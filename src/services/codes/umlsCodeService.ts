/**
 * umlsCodeService.ts — src/services/codes/umlsCodeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Live SNOMED CT search via the NLM UTS REST API.
 * ICD-10, ICD-11, and ICD-O fall back to the curated mock seed data since
 * those require separate NLM endpoints or licensed data files.
 *
 * API key is embedded for demo purposes — regenerate after demo session.
 * In production this should move to VITE_UMLS_KEY env variable or a
 * server-side proxy so the key is not exposed in the bundle.
 *
 * UTS REST API docs: https://documentation.uts.nlm.nih.gov/rest/home.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ServiceResult }                              from '../types';
import type { ClinicalCode, CodeSearchParams, CodeSystem,
              IcdOSubtype, ICodeService }                  from './ICodeService';
import { mockCodeService }                                 from './mockCodeService';

// ─── API Key ──────────────────────────────────────────────────────────────────
// Embedded for demo — regenerate at uts.nlm.nih.gov after Paul's session.
const UMLS_API_KEY = import.meta.env.VITE_UMLS_KEY ?? 'a29978e5-905a-4b4e-af8d-2c7ec4bd90d7';

const UTS_BASE = 'https://uts-ws.nlm.nih.gov/rest';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok  = <T>(data: T): ServiceResult<T>   => ({ ok: true,  data });


// Map UTS source abbreviations to our system labels
const SNOMED_SOURCE = 'SNOMEDCT_US';

// ─── UTS response types ───────────────────────────────────────────────────────

interface UtsResult {
  ui:          string;  // SNOMED concept ID
  name:        string;  // preferred term
  rootSource:  string;  // e.g. 'SNOMEDCT_US'
  uri?:        string;
}

interface UtsSearchResponse {
  result: {
    results:   UtsResult[];
    pageNumber: number;
    pageSize:   number;
  };
}

// ─── Category inference ───────────────────────────────────────────────────────
// UTS doesn't return PathScribe categories — we infer from the concept name.

const CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /carcinoma|adenocarcinoma|squamous|transitional|small.cell|non.small/i, category: 'Morphology|Malignant Epithelial' },
  { pattern: /melanoma/i,                                                             category: 'Morphology|Melanocytic' },
  { pattern: /lymphoma|leukaemia|leukemia|myeloma|lymphocytic/i,                     category: 'Morphology|Haematological' },
  { pattern: /glioma|glioblastoma|meningioma|astrocytoma|oligodendroglioma/i,        category: 'Morphology|CNS' },
  { pattern: /sarcoma|liposarcoma|leiomyosarcoma|fibrosarcoma|rhabdomyo/i,           category: 'Morphology|Mesenchymal' },
  { pattern: /in.situ|dysplasia|adenoma|intraepithelial|hyperplasia/i,               category: 'Morphology|Pre-Malignant' },
  { pattern: /breast/i,                                                               category: 'Body Structure|Breast' },
  { pattern: /colon|rectum|rectal|colorectal|sigmoid|caecum|cecum/i,                 category: 'Body Structure|Colorectal' },
  { pattern: /prostate|prostatic/i,                                                   category: 'Body Structure|Urological' },
  { pattern: /lung|bronch|pulmonary/i,                                                category: 'Body Structure|Thoracic' },
  { pattern: /lymph.node|axillary|inguinal|mediastinal/i,                            category: 'Body Structure|Lymph Node' },
  { pattern: /liver|hepatic|biliary|cholangiocarcinoma/i,                            category: 'Body Structure|Hepatobiliary' },
  { pattern: /kidney|renal|nephro/i,                                                  category: 'Body Structure|Urological' },
  { pattern: /biopsy|excision|resection|mastectomy|prostatectomy/i,                  category: 'Procedure|Surgical' },
  { pattern: /skin|dermal|cutaneous|melanocytic/i,                                   category: 'Body Structure|Skin' },
];

function inferCategory(name: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(name)) return rule.category;
  }
  return 'Morphology|Other';
}

// ─── SNOMED search via UTS ────────────────────────────────────────────────────

async function searchSnomed(query: string, pageSize = 25): Promise<ClinicalCode[]> {
  if (!UMLS_API_KEY) {
    console.warn('[umlsCodeService] No API key — falling back to mock SNOMED data');
    const fallback = await mockCodeService.search({ system: 'SNOMED', query });
    return fallback.ok ? fallback.data : [];
  }

  const params = new URLSearchParams({
    string:       query,
    sabs:         SNOMED_SOURCE,
    returnIdType: 'code',
    pageSize:     String(pageSize),
    apiKey:       UMLS_API_KEY,
  });

  try {
    const response = await fetch(`${UTS_BASE}/search/current?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`[umlsCodeService] UTS API error ${response.status}`);
      // Fall back to mock on API error
      const fallback = await mockCodeService.search({ system: 'SNOMED', query });
      return fallback.ok ? fallback.data : [];
    }

    const data: UtsSearchResponse = await response.json();
    const results = data?.result?.results ?? [];

    return results
      .filter(r => r.rootSource === SNOMED_SOURCE && r.ui && r.ui !== 'NONE')
      .map(r => ({
        code:         r.ui,
        display:      r.name,
        system:       'SNOMED' as CodeSystem,
        category:     inferCategory(r.name),
        jurisdiction: 'ALL',
        active:       true,
      }));

  } catch (e) {
    console.error('[umlsCodeService] Network error:', e);
    // Fall back to mock on network error
    const fallback = await mockCodeService.search({ system: 'SNOMED', query });
    return fallback.ok ? fallback.data : [];
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const umlsCodeService: ICodeService = {

  async search(params: CodeSearchParams): Promise<ServiceResult<ClinicalCode[]>> {
    // Only SNOMED uses the live UTS API — everything else uses mock data
    if (params.system === 'SNOMED') {
      const query = params.query?.trim() ?? '';

      // If no query, return local seed data (browse mode)
      if (!query) {
        return mockCodeService.search(params);
      }

      const results = await searchSnomed(query);

      // Apply category filter if provided
      const filtered = params.category
        ? results.filter(c =>
            c.category?.startsWith(params.category + '|') ||
            c.category === params.category
          )
        : results;

      return ok(filtered);
    }

    // ICD-10, ICD-11, ICD-O — delegate to mock service
    return mockCodeService.search(params);
  },

  async getByCode(system: CodeSystem, code: string): Promise<ServiceResult<ClinicalCode>> {
    // For SNOMED, try the UTS concept endpoint first
    if (system === 'SNOMED' && UMLS_API_KEY) {
      try {
        const params = new URLSearchParams({ apiKey: UMLS_API_KEY });
        const response = await fetch(
          `${UTS_BASE}/content/current/source/${SNOMED_SOURCE}/${code}?${params}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
          const data = await response.json();
          const concept = data?.result;
          if (concept?.ui) {
            return ok({
              code:         concept.ui,
              display:      concept.name ?? concept.defaultPreferredName,
              system:       'SNOMED',
              category:     inferCategory(concept.name ?? ''),
              jurisdiction: 'ALL',
              active:       true,
            });
          }
        }
      } catch (e) {
        // Fall through to mock
      }
    }

    return mockCodeService.getByCode(system, code);
  },

  async getCategories(system: CodeSystem, subtype?: IcdOSubtype): Promise<ServiceResult<string[]>> {
    // Categories are static — always use mock
    return mockCodeService.getCategories(system, subtype);
  },
};

export default umlsCodeService;
