/**
 * FirestoreCaseService
 *
 * Production implementation of ICaseService backed by Firebase Firestore.
 *
 * Collection layout
 * ─────────────────
 *  /cases/{caseId}                      — Case document (written by LIS sync Cloud Function)
 *  /cases/{caseId}/synopticReports/{id} — Synoptic answer sub-collection (written by client)
 *
 * Access pattern
 * ──────────────
 * This service is READ for clinical case data (LIS owns it — Cloud Function writes).
 * It is WRITE only for PathScribe-owned fields:
 *   - synopticReports (structured answers)
 *   - status transitions (draft → finalizing → finalized)
 *   - orchSections (AI narrative content)
 *   - comments and delegation state
 *
 * Never write back to LIS-owned fields (patient demographics, specimens,
 * grossDescription etc.) from the client. Those are updated by re-sync only.
 *
 * TODO before go-live
 * ───────────────────
 * 1. Confirm COLLECTION_NAME matches your Firestore collection
 * 2. Confirm PATHOLOGIST_FIELD matches the field your Cloud Function writes
 *    (common values: 'assignedPathologistId', 'pathologistUserId', 'ownerId')
 * 3. Set Firestore Security Rules to restrict reads to authenticated users
 *    whose UID matches the pathologist field (or belongs to the same hospital)
 * 4. Ensure Firebase app is initialised before this service is called
 *    (done in src/contexts/AuthContext.tsx)
 * 5. Add composite indexes in firebase.json for any multi-field queries
 *    (e.g. assignedPathologistId + status)
 * 6. Confirm data residency: set Firestore location to europe-west2 (London)
 *    or europe-west1 (Belgium) for UK/EU compliance
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

import type { Case }                                          from '../../types/case/Case';
import type { ICaseService, PathologyCase, CaseFilterParams } from './ICaseService';
import type { ServiceResult }                                 from '../types';
import { AuditLogger }                                        from './AuditLogger';

// ── Configuration ─────────────────────────────────────────────────────────────
// TODO: confirm these match your Firestore schema
const COLLECTION_NAME   = 'cases';
const PATHOLOGIST_FIELD = 'assignedPathologistId'; // field written by Cloud Function

// ── Helpers ───────────────────────────────────────────────────────────────────
const audit = new AuditLogger('FIRESTORE');

/** Convert Firestore Timestamp fields to ISO strings so Case types stay consistent. */
function normaliseTimestamps(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val instanceof Timestamp) {
      out[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = normaliseTimestamps(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function docToCase(id: string, data: Record<string, any>): Case {
  return { id, ...normaliseTimestamps(data) } as Case;
}

// ── Service implementation ─────────────────────────────────────────────────────
export const firestoreCaseService: ICaseService = {

  // ── getCase ────────────────────────────────────────────────────────────────
  async getCase(caseId: string): Promise<Case | undefined> {
    const db = getFirestore();
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, caseId));
      if (!snap.exists()) {
        audit.log({ eventType: 'case.read', caseId, userId: 'system', outcome: 'failure' });
        return undefined;
      }
      audit.log({ eventType: 'case.read', caseId, userId: 'system', outcome: 'success' });
      return docToCase(snap.id, snap.data());
    } catch (err) {
      audit.log({ eventType: 'case.read', caseId, userId: 'system', outcome: 'failure' });
      console.error('firestoreCaseService.getCase', err);
      return undefined;
    }
  },

  // ── getAll ─────────────────────────────────────────────────────────────────
  async getAll(params?: CaseFilterParams): Promise<ServiceResult<Case[]>> {
    const db = getFirestore();
    try {
      const constraints: any[] = [];

      // Server-side filters (require Firestore composite indexes for combinations)
      if (params?.status) {
        const statuses = Array.isArray(params.status) ? params.status : [params.status];
        constraints.push(where('status', 'in', statuses));
      }
      if (params?.statusList?.length) {
        constraints.push(where('status', 'in', params.statusList));
      }
      if (params?.specialty) {
        constraints.push(where('specialty', '==', params.specialty));
      }
      if (params?.hospitalId) {
        constraints.push(where('hospitalId', '==', params.hospitalId));
      }
      if (params?.priorityList?.length) {
        if (params.priorityList.length === 1) {
          constraints.push(where('order.priority', '==', params.priorityList[0]));
        } else {
          constraints.push(where('order.priority', 'in', params.priorityList));
        }
      }

      // Sort most recent first
      constraints.push(orderBy('updatedAt', 'desc'));

      const snap = await getDocs(
        query(collection(db, COLLECTION_NAME), ...constraints)
      );

      let results = snap.docs.map(d =>
        docToCase(d.id, d.data()) as Case
      );

      // Client-side filters (no index required but post-fetch — keep result sets small)
      if (params?.search) {
        const s = params.search.toLowerCase();
        results = results.filter(c =>
          (c as any).accession?.fullAccession?.toLowerCase().includes(s) ||
          `${(c as any).patient?.firstName} ${(c as any).patient?.lastName}`.toLowerCase().includes(s) ||
          (c as any).patient?.mrn?.includes(s)
        );
      }
      if (params?.accessionNo) {
        results = results.filter(c =>
          (c as any).accession?.fullAccession === params.accessionNo
        );
      }

      return { ok: true, data: results };
    } catch (err: any) {
      console.error('firestoreCaseService.getAll', err);
      return { ok: false, error: err?.message ?? 'Firestore error' };
    }
  },

  // ── listCasesForUser ───────────────────────────────────────────────────────
  async listCasesForUser(userId: string): Promise<Case[]> {
    const db = getFirestore();
    try {
      // If userId is a sentinel value, return all cases (admin / dev)
      const isAdmin = !userId || userId === 'all' || userId === 'current';

      const q = isAdmin
        ? query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'))
        : query(
            collection(db, COLLECTION_NAME),
            where(PATHOLOGIST_FIELD, '==', userId),
            orderBy('updatedAt', 'desc')
          );

      const snap  = await getDocs(q);
      const cases = snap.docs.map(d => docToCase(d.id, d.data()));

      audit.log({ eventType: 'case.list', userId, outcome: 'success' });
      return cases;
    } catch (err) {
      audit.log({ eventType: 'case.list', userId, outcome: 'failure' });
      console.error('firestoreCaseService.listCasesForUser', err);
      return [];
    }
  },

  // ── updateCase ─────────────────────────────────────────────────────────────
  // Only updates PathScribe-owned fields. Never overwrites LIS-sourced clinical data.
  async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
    const db = getFirestore();

    // Guard: block writes to LIS-owned fields from the client
    const LIS_OWNED_FIELDS = [
      'patient', 'specimens', 'accession', 'grossDescription',
      'microscopicDescription', 'order', 'hospitalId',
    ] as const;

    const blocked = LIS_OWNED_FIELDS.filter(f => f in updates);
    if (blocked.length > 0) {
      console.warn(
        `firestoreCaseService.updateCase: ignoring LIS-owned fields [${blocked.join(', ')}]. ` +
        'These are managed by the Cloud Function sync and must not be overwritten by the client.'
      );
      blocked.forEach(f => delete (updates as any)[f]);
    }

    try {
      await updateDoc(doc(db, COLLECTION_NAME, caseId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      audit.log({ eventType: 'case.write', caseId, userId: 'system', outcome: 'success' });
    } catch (err) {
      audit.log({ eventType: 'case.write', caseId, userId: 'system', outcome: 'failure' });
      console.error('firestoreCaseService.updateCase', err);
      throw new Error(`firestoreCaseService.updateCase failed for ${caseId}`);
    }
  },
};
