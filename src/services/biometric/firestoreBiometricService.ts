/**
 * firestoreBiometricService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Production biometric e-signature service using Firestore + Cloud Functions.
 *
 * ── Firestore schema ─────────────────────────────────────────────────────────
 *
 *   institutions/{institutionId}/biometricPolicy          (single document)
 *     enabled: boolean
 *     cadence: BiometricCadence
 *     cadenceDays: number
 *     updatedAt: Timestamp
 *     updatedBy: string (userId)
 *
 *   users/{userId}/biometricCredential                    (single document)
 *     credentialId: string     ← WebAuthn credential ID (base64url)
 *     publicKeyJwk: object     ← COSE/JWK public key (stored server-side only)
 *     enrolledAt: Timestamp
 *     lastVerifiedAt: Timestamp | null
 *     deviceName: string
 *     rpId: string
 *
 *   users/{userId}/biometricWizardDismissals              (single document)
 *     count: number
 *     lastDismissedAt: Timestamp
 *
 * ── Cloud Functions required ──────────────────────────────────────────────────
 *
 *   biometric-getEnrolmentChallenge(userId, userName)
 *     → Generates a cryptographically random challenge (32 bytes).
 *     → Stores challenge + expiry (5 min) in Firestore under a pending nonce.
 *     → Returns EnrolmentChallenge.
 *
 *   biometric-completeEnrolment(userId, attestation, deviceName)
 *     → Verifies the WebAuthn attestation object against the pending nonce.
 *     → Extracts and stores the public key from the attestation.
 *     → Stores credentialId + publicKeyJwk in users/{userId}/biometricCredential.
 *     → Returns BiometricCredential (without publicKeyJwk).
 *
 *   biometric-getVerificationChallenge(userId)
 *     → Generates a cryptographically random challenge.
 *     → Stores challenge + expiry (2 min) in Firestore under a pending nonce.
 *     → Returns VerificationChallenge.
 *
 *   biometric-completeVerification(userId, assertion)
 *     → Retrieves stored public key from users/{userId}/biometricCredential.
 *     → Verifies the WebAuthn assertion signature.
 *     → Updates lastVerifiedAt on success.
 *     → Returns { verified: boolean }.
 *
 *   Security note: challenges are single-use and expire after a short window.
 *   The server never returns the public key to the client — it is stored and
 *   used only server-side for signature verification.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import { getInstitutionId } from '@/services/auth/institutionService';

import type {
  IBiometricService,
  BiometricCredential,
  EnrolmentChallenge,
  VerificationChallenge,
} from './IBiometricService';
import { BIOMETRIC_POLICY_DEFAULTS } from './IBiometricService';
import type { ServiceResult } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ok  = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err = <T>(error: string): ServiceResult<T> => ({ ok: false, error });

function tsToIso(ts: Timestamp | null | undefined): string | null {
  return ts ? ts.toDate().toISOString() : null;
}

// ─── Session cadence store (client-side — not sensitive) ──────────────────────

const SESSION_KEY = 'ps_biometric_session';

function markSessionVerified(userId: string): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    userId,
    verifiedAt: new Date().toISOString(),
  }));
}

function isSessionVerified(userId: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.userId === userId;
  } catch { return false; }
}

// ─── Cloud Function references ────────────────────────────────────────────────

const fnGetEnrolmentChallenge    = () => httpsCallable(functions, 'biometric-getEnrolmentChallenge');
const fnCompleteEnrolment        = () => httpsCallable(functions, 'biometric-completeEnrolment');
const fnGetVerificationChallenge = () => httpsCallable(functions, 'biometric-getVerificationChallenge');
const fnCompleteVerification     = () => httpsCallable(functions, 'biometric-completeVerification');

// ─── Service implementation ───────────────────────────────────────────────────

export const firestoreBiometricService: IBiometricService = {

  // ── Policy ──────────────────────────────────────────────────────────────

  async getPolicy() {
    try {
      const institutionId = await getInstitutionId();
      const ref = doc(db, 'institutions', institutionId, 'biometricPolicy', 'current');
      const snap = await getDoc(ref);
      if (!snap.exists()) return ok({ ...BIOMETRIC_POLICY_DEFAULTS });
      const data = snap.data();
      return ok({
        enabled:     data.enabled     ?? BIOMETRIC_POLICY_DEFAULTS.enabled,
        cadence:     data.cadence     ?? BIOMETRIC_POLICY_DEFAULTS.cadence,
        cadenceDays: data.cadenceDays ?? BIOMETRIC_POLICY_DEFAULTS.cadenceDays,
      });
    } catch (e: any) {
      return err(`Failed to load biometric policy: ${e.message}`);
    }
  },

  async savePolicy(policy) {
    try {
      const institutionId = await getInstitutionId();
      const ref = doc(db, 'institutions', institutionId, 'biometricPolicy', 'current');
      await setDoc(ref, {
        ...policy,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return ok(policy);
    } catch (e: any) {
      return err(`Failed to save biometric policy: ${e.message}`);
    }
  },

  // ── Credential management ────────────────────────────────────────────────

  async getCredential(userId) {
    try {
      const ref = doc(db, 'users', userId, 'biometricCredential', 'current');
      const snap = await getDoc(ref);
      if (!snap.exists()) return ok(null);
      const data = snap.data();
      return ok({
        userId,
        credentialId:   data.credentialId,
        enrolledAt:     tsToIso(data.enrolledAt) ?? new Date().toISOString(),
        lastVerifiedAt: tsToIso(data.lastVerifiedAt),
        deviceName:     data.deviceName ?? 'Unknown device',
      } as BiometricCredential);
    } catch (e: any) {
      return err(`Failed to load credential: ${e.message}`);
    }
  },

  async getEnrolmentChallenge(userId, userName) {
    try {
      // ── Requires Cloud Function: biometric-getEnrolmentChallenge ──
      // Function generates a random challenge, stores it server-side with
      // a 5-minute expiry, and returns the challenge parameters.
      const fn = fnGetEnrolmentChallenge();
      const result = await fn({ userId, userName });
      return ok(result.data as EnrolmentChallenge);
    } catch (e: any) {
      return err(`Failed to get enrolment challenge: ${e.message}`);
    }
  },

  async completeEnrolment(userId, attestation, deviceName) {
    try {
      // ── Requires Cloud Function: biometric-completeEnrolment ──
      // Function verifies the attestation object against the stored nonce,
      // extracts the public key, stores it in Firestore, and returns the
      // credential record (without the private key, which never leaves the device).
      const fn = fnCompleteEnrolment();
      const result = await fn({ userId, attestation, deviceName });
      const data = result.data as any;

      markSessionVerified(userId);
      return ok({
        userId,
        credentialId:   data.credentialId,
        enrolledAt:     data.enrolledAt,
        lastVerifiedAt: data.enrolledAt,
        deviceName,
      } as BiometricCredential);
    } catch (e: any) {
      return err(`Enrolment failed: ${e.message}`);
    }
  },

  async revokeCredential(userId) {
    try {
      const ref = doc(db, 'users', userId, 'biometricCredential', 'current');
      await deleteDoc(ref);
      return ok(undefined);
    } catch (e: any) {
      return err(`Failed to revoke credential: ${e.message}`);
    }
  },

  // ── Verification ─────────────────────────────────────────────────────────

  async getVerificationChallenge(userId) {
    try {
      // ── Requires Cloud Function: biometric-getVerificationChallenge ──
      // Generates a random challenge, stores it with a 2-minute expiry.
      const fn = fnGetVerificationChallenge();
      const result = await fn({ userId });
      return ok(result.data as VerificationChallenge);
    } catch (e: any) {
      return err(`Failed to get verification challenge: ${e.message}`);
    }
  },

  async completeVerification(userId, assertion) {
    try {
      // ── Requires Cloud Function: biometric-completeVerification ──
      // Retrieves the stored public key, verifies the WebAuthn assertion
      // signature, updates lastVerifiedAt on success.
      const fn = fnCompleteVerification();
      const result = await fn({ userId, assertion });
      const data = result.data as { verified: boolean };

      if (data.verified) {
        markSessionVerified(userId);
        // Update lastVerifiedAt in Firestore (Cloud Function also does this,
        // but we confirm client-side for immediate UI feedback)
        const ref = doc(db, 'users', userId, 'biometricCredential', 'current');
        await updateDoc(ref, { lastVerifiedAt: serverTimestamp() });
      }

      return ok(data);
    } catch (e: any) {
      return err(`Verification failed: ${e.message}`);
    }
  },

  // ── Cadence / wizard ─────────────────────────────────────────────────────

  async isBiometricCurrentForUser(userId) {
    try {
      const policyResult = await firestoreBiometricService.getPolicy();
      if (policyResult.ok === false) return err(policyResult.error);
      const policy = policyResult.data!;

      if (!policy.enabled) return ok(false);

      const credResult = await firestoreBiometricService.getCredential(userId);
      if (!credResult.ok || !credResult.data) return ok(false);
      const cred = credResult.data;

      if (policy.cadence === 'never') return ok(true);
      if (policy.cadence === 'per_sign_off') return ok(false); // always re-verify

      if (policy.cadence === 'per_session') {
        return ok(isSessionVerified(userId));
      }

      if (policy.cadence === 'per_days') {
        if (!cred.lastVerifiedAt) return ok(false);
        const daysSince = (Date.now() - new Date(cred.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24);
        return ok(daysSince < policy.cadenceDays);
      }

      return ok(false);
    } catch (e: any) {
      return err(`Cadence check failed: ${e.message}`);
    }
  },

  async shouldShowWizard(userId) {
    try {
      const policyResult = await firestoreBiometricService.getPolicy();
      if (!policyResult.ok || !policyResult.data!.enabled) return ok(false);

      const credResult = await firestoreBiometricService.getCredential(userId);
      if (!credResult.ok) return ok(false);
      if (credResult.data) return ok(false); // already enrolled

      const ref = doc(db, 'users', userId, 'biometricWizardDismissals', 'current');
      const snap = await getDoc(ref);
      if (!snap.exists()) return ok(true);
      const count = snap.data()?.count ?? 0;
      return ok(count < 3); // re-prompt until dismissed 3 times
    } catch (e: any) {
      return err(`Wizard check failed: ${e.message}`);
    }
  },

  async dismissWizard(userId) {
    try {
      const ref = doc(db, 'users', userId, 'biometricWizardDismissals', 'current');
      const snap = await getDoc(ref);
      const current = snap.exists() ? (snap.data()?.count ?? 0) : 0;
      await setDoc(ref, {
        count: current + 1,
        lastDismissedAt: serverTimestamp(),
      });
      return ok(undefined);
    } catch (e: any) {
      return err(`Failed to record dismissal: ${e.message}`);
    }
  },
};
