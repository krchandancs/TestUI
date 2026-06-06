/**
 * firestoreCodeService.ts — src/services/codes/firestoreCodeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firestore implementation of ICodeService.
 *
 * Data model (defined in the Terminology Architecture document):
 *
 *   terminology/{system}_{jurisdiction}/codes/{codeId}
 *     code, display, system, subtype?, category?, jurisdiction, active, version?
 *
 *   terminologyMeta/{system}_{jurisdiction}
 *     system, jurisdiction, version, codeCount, seededAt, seededBy,
 *     nextUpdateDue?, notes?
 *
 * Jurisdiction routing:
 *   This service reads the institution's jurisdiction from SystemConfig and
 *   routes to the correct Firestore collection automatically.
 *   Components never pass jurisdiction — they just call search().
 *
 * ICD-10 jurisdiction variants:
 *   US     → terminology/ICD-10_US     (ICD-10-CM)
 *   CA     → terminology/ICD-10_CA     (ICD-10-CA)
 *   GB_EW  → terminology/ICD-10_GB_EW  (ICD-10 WHO)
 *   GB_SCT → terminology/ICD-10_GB_SCT (ICD-10 WHO, same as GB_EW in practice)
 *   IE     → terminology/ICD-10_IE     (ICD-10-AM)
 *
 * SNOMED CT jurisdiction variants:
 *   US     → terminology/SNOMED_US     (NLM US Edition)
 *   CA     → terminology/SNOMED_CA     (Infoway Canada Edition)
 *   GB_EW  → terminology/SNOMED_GB_EW  (NHS UK Edition)
 *   GB_SCT → terminology/SNOMED_GB_SCT (NHS UK Edition + Scottish Extension)
 *   IE     → terminology/SNOMED_IE     (SNOMED International Affiliate)
 *
 * ICD-11 and ICD-O use a single 'ALL' collection (no jurisdiction variants):
 *   → terminology/ICD-11_ALL
 *   → terminology/ICD-O_ALL
 *
 * Performance:
 *   - Queries use Firestore composite indexes on (system, active, category)
 *   - Results are paginated: 50 for Browse modal, 8 for typeahead
 *   - Firestore local persistence cache handles repeat queries sub-50ms
 *
 * Required Firestore indexes (deploy via firestore.indexes.json):
 *   Collection: codes (subcollection of terminology/{systemJurisdiction})
 *   Fields: active ASC, category ASC, display ASC
 *   Fields: active ASC, display ASC
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection, query, where, orderBy, limit,
  getDocs, getDoc, doc,
  type QueryConstraint,
} from 'firebase/firestore';

import { db }                                              from '../../firebase';
import { DEFAULT_SYSTEM_CONFIG }                           from '../../types/systemConfig';
import type { Jurisdiction }                               from '../../types/systemConfig';
import type { ServiceResult }                              from '../types';
import type {
  ClinicalCode, CodeSearchParams, CodeSystem,
  IcdOSubtype, ICodeService,
}                                                          from './ICodeService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok  = <T>(data: T): ServiceResult<T>   => ({ ok: true,  data });
const err = <T>(e: string): ServiceResult<T> => ({ ok: false, error: e });

/**
 * Resolves the Firestore collection key for a given system + jurisdiction.
 *
 * ICD-11 and ICD-O are jurisdiction-independent — they always use 'ALL'.
 * SNOMED and ICD-10 route to the jurisdiction-specific national release.
 */
const collectionKey = (system: CodeSystem, jurisdiction: Jurisdiction): string => {
  switch (system) {
    case 'ICD-11': return 'ICD-11_ALL';
    case 'ICD-O':  return 'ICD-O_ALL';
    case 'SNOMED': return `SNOMED_${jurisdiction}`;
    case 'ICD-10': return `ICD-10_${jurisdiction}`;
  }
};

/**
 * Reads the current jurisdiction from SystemConfig persisted in localStorage.
 * Falls back to DEFAULT_SYSTEM_CONFIG.jurisdiction ('US') if not set.
 *
 * This keeps firestoreCodeService independent of React context — it can be
 * called from outside the component tree (e.g. seed script utilities).
 */
const getJurisdiction = (): Jurisdiction => {
  try {
    const raw = localStorage.getItem('pathscribe_system_config_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.jurisdiction) return parsed.jurisdiction as Jurisdiction;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_SYSTEM_CONFIG.jurisdiction;
};

// ─── Firestore implementation ─────────────────────────────────────────────────

export const firestoreCodeService: ICodeService = {

  async search(params: CodeSearchParams): Promise<ServiceResult<ClinicalCode[]>> {
    try {
      const jurisdiction = getJurisdiction();
      const colKey       = collectionKey(params.system, jurisdiction);
      const colRef       = collection(db, 'terminology', colKey, 'codes');

      const constraints: QueryConstraint[] = [];

      // Always filter to active codes unless caller explicitly wants retired
      if (!params.includeRetired) {
        constraints.push(where('active', '==', true));
      }

      // ICD-O subtype filter (topography vs morphology)
      if (params.subtype) {
        constraints.push(where('subtype', '==', params.subtype));
      }

      // Category filter
      if (params.category) {
        constraints.push(where('category', '==', params.category));
      }

      // Firestore does not support full-text search — we use a prefix approach
      // for typeahead (query >= term AND query < term + '\uf8ff') on the display
      // field. For the Browse modal (no query), we load all and sort by display.
      if (params.query?.trim()) {
        const q    = params.query.trim();
        const qEnd = q + '\uf8ff';

        // Try display prefix first (most common case: user types a word)
        constraints.push(
          where('display', '>=', q),
          where('display', '<',  qEnd),
          orderBy('display'),
        );
        constraints.push(limit(8)); // typeahead cap
      } else {
        // Browse modal — load up to 50, ordered by display
        constraints.push(orderBy('display'), limit(50));
      }

      const snap   = await getDocs(query(colRef, ...constraints));
      const codes  = snap.docs.map(d => d.data() as ClinicalCode);

      // Secondary client-side filter: if the Firestore prefix query missed
      // code-string matches (e.g. user typed "8140"), filter those in too.
      if (params.query?.trim()) {
        const q       = params.query.trim().toLowerCase();
        const byCode  = codes.filter(c => c.code.toLowerCase().startsWith(q));
        const byLabel = codes.filter(c => !c.code.toLowerCase().startsWith(q));

        // If display prefix returned nothing, fall back to a code-string query
        if (codes.length === 0) {
          const codeConstraints: QueryConstraint[] = [
            where('active', '==', !params.includeRetired ? true : undefined).valueOf() as unknown as QueryConstraint,
          ].filter(Boolean);
          // Simpler: just do a full collection scan client-side for short seed sets
          // In production with large collections, add a Firestore full-text
          // extension (Algolia / Typesense) or store a normalised search field.
          const allSnap  = await getDocs(query(colRef, where('active', '==', true), limit(200)));
          const allCodes = allSnap.docs.map(d => d.data() as ClinicalCode);
          const filtered = allCodes.filter(c =>
            c.code.toLowerCase().includes(q) ||
            c.display.toLowerCase().includes(q)
          ).slice(0, 8);
          return ok(filtered);
        }

        return ok([...byCode, ...byLabel].slice(0, 8));
      }

      return ok(codes);

    } catch (e) {
      console.error('[firestoreCodeService.search]', e);
      return err(`Terminology search failed: ${(e as Error).message}`);
    }
  },

  async getByCode(system: CodeSystem, code: string): Promise<ServiceResult<ClinicalCode>> {
    try {
      const jurisdiction = getJurisdiction();
      const colKey       = collectionKey(system, jurisdiction);

      // Document ID is the code string (normalised: replace '/' with '_')
      const docId  = code.replace(/\//g, '_');
      const docRef = doc(db, 'terminology', colKey, 'codes', docId);
      const snap   = await getDoc(docRef);

      if (!snap.exists()) {
        return err(`Code ${system}:${code} not found in ${colKey}`);
      }

      return ok(snap.data() as ClinicalCode);

    } catch (e) {
      console.error('[firestoreCodeService.getByCode]', e);
      return err(`Failed to fetch code ${system}:${code}: ${(e as Error).message}`);
    }
  },

  async getCategories(system: CodeSystem, subtype?: IcdOSubtype): Promise<ServiceResult<string[]>> {
    try {
      const jurisdiction = getJurisdiction();
      const colKey       = collectionKey(system, jurisdiction);
      const colRef       = collection(db, 'terminology', colKey, 'codes');

      const constraints: QueryConstraint[] = [
        where('active', '==', true),
        orderBy('category'),
        limit(200), // enough to capture all distinct categories
      ];

      if (subtype) {
        constraints.push(where('subtype', '==', subtype));
      }

      const snap       = await getDocs(query(colRef, ...constraints));
      const categories = Array.from(
        new Set(snap.docs.map(d => (d.data() as ClinicalCode).category ?? 'Other'))
      );

      return ok(categories);

    } catch (e) {
      console.error('[firestoreCodeService.getCategories]', e);
      return err(`Failed to fetch categories: ${(e as Error).message}`);
    }
  },
};
