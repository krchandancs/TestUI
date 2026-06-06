/**
 * IBiometricService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Interface contract for biometric e-signature services.
 *
 * Two implementations:
 *   mockBiometricService     — localStorage, simulated WebAuthn (demo/dev)
 *   firestoreBiometricService — Firestore + Cloud Functions (production)
 *
 * WebAuthn architecture note:
 *   Registration (enrollBiometric):
 *     1. Client calls getEnrolmentChallenge() → server returns random challenge
 *     2. Client calls navigator.credentials.create() with challenge
 *     3. Client sends attestation response to verifyEnrolment()
 *     4. Server verifies attestation, stores credential public key
 *
 *   Verification (verifyBiometric):
 *     1. Client calls getVerificationChallenge() → server returns random challenge
 *     2. Client calls navigator.credentials.get() with challenge
 *     3. Client sends assertion response to verifyAssertion()
 *     4. Server verifies signature against stored public key
 *
 * The private key NEVER leaves the device. PathScribe/Firestore stores only
 * the credential ID and public key. This is what satisfies 21 CFR Part 11,
 * MHRA, and EU Annex 11 e-signature requirements.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ServiceResult } from '../types';

// ─── Policy ──────────────────────────────────────────────────────────────────

export type BiometricCadence =
  | 'never'         // verify at enrolment only, valid indefinitely
  | 'per_session'   // verify once per login session
  | 'per_days'      // verify every N days
  | 'per_sign_off'; // verify on every report finalisation

export interface BiometricPolicy {
  enabled: boolean;          // institution master switch — default false
  cadence: BiometricCadence;
  cadenceDays: number;       // relevant when cadence === 'per_days'
}

export const BIOMETRIC_POLICY_DEFAULTS: BiometricPolicy = {
  enabled: false,
  cadence: 'per_sign_off',
  cadenceDays: 30,
};

// ─── Credential ───────────────────────────────────────────────────────────────

export interface BiometricCredential {
  userId: string;
  credentialId: string;          // WebAuthn credential ID (base64url)
  enrolledAt: string;            // ISO datetime
  lastVerifiedAt: string | null; // ISO datetime
  deviceName: string;            // e.g. "Touch ID", "Windows Hello"
}

// ─── Challenge/response types (production WebAuthn flow) ─────────────────────

export interface EnrolmentChallenge {
  challenge: string;       // base64url random bytes from server
  rpId: string;            // relying party ID (e.g. "pathscribe.ai")
  rpName: string;          // "PathScribe AI"
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout: number;         // ms
}

export interface VerificationChallenge {
  challenge: string;       // base64url random bytes from server
  rpId: string;
  credentialId: string;    // the enrolled credential to authenticate with
  timeout: number;
}

// Raw WebAuthn response objects — passed back to server for verification
export interface AttestationResponse {
  id: string;
  rawId: string;           // base64url
  type: 'public-key';
  response: {
    clientDataJSON: string;  // base64url
    attestationObject: string; // base64url
  };
}

export interface AssertionResponse {
  id: string;
  rawId: string;           // base64url
  type: 'public-key';
  response: {
    clientDataJSON: string;  // base64url
    authenticatorData: string; // base64url
    signature: string;       // base64url
    userHandle?: string;     // base64url
  };
}

// ─── Service interface ────────────────────────────────────────────────────────

export interface IBiometricService {

  // ── Policy ──────────────────────────────────────────────────────────────

  /** Get the current institution biometric policy. */
  getPolicy(): Promise<ServiceResult<BiometricPolicy>>;

  /** Save updated institution biometric policy. Admin only. */
  savePolicy(policy: BiometricPolicy): Promise<ServiceResult<BiometricPolicy>>;

  // ── Credential management ────────────────────────────────────────────────

  /** Get the enrolled credential for a user, or null if not enrolled. */
  getCredential(userId: string): Promise<ServiceResult<BiometricCredential | null>>;

  /**
   * Step 1 of enrolment: request a server-generated challenge.
   * Production: calls a Cloud Function that generates and stores a nonce.
   * Mock: returns a fake challenge immediately.
   */
  getEnrolmentChallenge(userId: string, userName: string): Promise<ServiceResult<EnrolmentChallenge>>;

  /**
   * Step 2 of enrolment: submit the WebAuthn attestation response to the server.
   * Server verifies the attestation and stores the public key + credential ID.
   * Mock: skips verification, stores a mock credential ID in localStorage.
   */
  completeEnrolment(
    userId: string,
    attestation: AttestationResponse,
    deviceName: string,
  ): Promise<ServiceResult<BiometricCredential>>;

  /** Remove the enrolled credential for a user (e.g. lost device, security reset). */
  revokeCredential(userId: string): Promise<ServiceResult<void>>;

  // ── Verification ─────────────────────────────────────────────────────────

  /**
   * Step 1 of verification: request a server-generated challenge.
   * Production: calls a Cloud Function that generates and stores a nonce.
   * Mock: returns a fake challenge immediately.
   */
  getVerificationChallenge(userId: string): Promise<ServiceResult<VerificationChallenge>>;

  /**
   * Step 2 of verification: submit the WebAuthn assertion response to the server.
   * Server verifies the signature against the stored public key.
   * Mock: skips verification, always returns success.
   */
  completeVerification(
    userId: string,
    assertion: AssertionResponse,
  ): Promise<ServiceResult<{ verified: boolean }>>;

  // ── Cadence / wizard ─────────────────────────────────────────────────────

  /**
   * Returns true if the user's biometric is current per the institution policy
   * and does not need re-verification before signing off a report.
   */
  isBiometricCurrentForUser(userId: string): Promise<ServiceResult<boolean>>;

  /**
   * Returns true if the biometric setup wizard should be shown to this user
   * (policy enabled, not yet enrolled, not permanently dismissed).
   */
  shouldShowWizard(userId: string): Promise<ServiceResult<boolean>>;

  /** Record that the user dismissed the setup wizard. */
  dismissWizard(userId: string): Promise<ServiceResult<void>>;
}
