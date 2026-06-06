// src/pages/Synoptic/Codes/codeSearchService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Terminology search abstraction.
// All endpoint URLs are centralised in terminologyConfig.ts.
//
// NLM Clinical Tables API response format (all endpoints):
//   data[0] = total match count
//   data[1] = array of primary codes     e.g. ["C50.412", "C50.911"]
//   data[2] = code system info (ignore)
//   data[3] = array of display arrays    e.g. [["C50.412","Malignant..."], ...]
//
// Key params:
//   sf = search fields  (which fields NLM searches against)
//   df = display fields (which fields NLM returns in data[3])
//   rec_type = SNOMED concept type filter
// ─────────────────────────────────────────────────────────────────────────────

import { TERMINOLOGY_CONFIG } from '../../../components/Config/Terminology/terminologyConfig';

export interface CodeResult {
  code:       string;
  display:    string;
  system:     string;
  hierarchy?: string;
}

const NLM_BASE = TERMINOLOGY_CONFIG.nlm.baseUrl;

export type SnomedFilter = 'all' | 'morphology' | 'anatomy' | 'specimen' | 'organism';

// ─── SNOMED CT ────────────────────────────────────────────────────────────────
// Endpoint: UTS REST API (uts-ws.nlm.nih.gov) — NLM Clinical Tables SNOMED
// endpoint has been retired and returns 404 for all queries.
// UTS 'approximate' search type gives the best substring/partial word matching.

const UMLS_API_KEY = import.meta.env.VITE_UMLS_KEY ?? 'a29978e5-905a-4b4e-af8d-2c7ec4bd90d7';
const UTS_SEARCH   = 'https://uts-ws.nlm.nih.gov/rest/search/current';

const SNOMED_FILTER_KEYWORDS: Record<SnomedFilter, string[]> = {
  all:        [],
  morphology: ['carcinoma','adenocarcinoma','sarcoma','lymphoma','melanoma','neoplasm','dysplasia','adenoma','in situ','tumour','tumor','hyperplasia','metaplasia','invasion'],
  anatomy:    ['structure','region','area','wall','lobe','node','duct','gland','tissue','tract','junction','zone'],
  specimen:   ['specimen','biopsy','resection','excision','aspirate','curettage','washings'],
  organism:   ['bacterium','virus','fungus','organism','parasite'],
};

export async function searchSnomed(
  query: string,
  filter: SnomedFilter = 'all',
  maxResults = 20
): Promise<CodeResult[]> {
  if (!query.trim()) return [];
  const q = query.trim();
  try {
    const params = new URLSearchParams({
      string:       q,
      searchType:   'rightTruncation',
      sabs:         'SNOMEDCT_US',
      returnIdType: 'code',
      pageSize:     String(maxResults),
      apiKey:       UMLS_API_KEY,
    });

    const res = await fetch(`${UTS_SEARCH}?${params}`);
    if (!res.ok) throw new Error(`UTS SNOMED ${res.status}`);
    const data = await res.json();

    const results: any[] = data?.result?.results ?? [];

    let mapped: CodeResult[] = results
      .filter(r => r.ui && r.ui !== 'NONE' && r.rootSource === 'SNOMEDCT_US')
      .map(r => ({
        code:    r.ui,
        display: r.name,
        system:  'SNOMED',
      }));

    // Apply filter client-side via keyword matching
    const keywords = SNOMED_FILTER_KEYWORDS[filter];
    if (keywords.length > 0) {
      const filtered = mapped.filter(r =>
        keywords.some(kw => r.display.toLowerCase().includes(kw))
      );
      if (filtered.length > 0) mapped = filtered;
    }

    return mapped;
  } catch (err) {
    console.warn('[codeSearchService] SNOMED search failed:', err);
    return [];
  }
}

// ─── ICD-10-CM ────────────────────────────────────────────────────────────────
// Endpoint: /icd10cm/v3/search
// data[1] = codes, data[3] = [[code, name], ...] when df=code,name
// Note: Non-US variants (ICD-10-AM, ICD-10 WHO) require backend proxy.

export async function searchIcd10(query: string, maxResults = 20): Promise<CodeResult[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({
      terms:   query,
      maxList: String(maxResults),
      sf:      'code,name',
      df:      'code,name',
    });
    const res = await fetch(`${NLM_BASE}${TERMINOLOGY_CONFIG.nlm.endpoints.icd10}?${params}`);
    if (!res.ok) throw new Error(`NLM ICD-10 ${res.status}`);
    const data = await res.json();

    const codes:    string[]  = data[1] ?? [];
    const extraArr: any[][]   = data[3] ?? [];

    return codes.map((code, i) => ({
      code,
      display: extraArr[i]?.[1] ?? extraArr[i]?.[0] ?? code,
      system:  'ICD10',
    }));
  } catch (err) {
    console.warn('[codeSearchService] ICD-10 search failed:', err);
    return [];
  }
}

// ─── ICD-11 ───────────────────────────────────────────────────────────────────
// Endpoint: /icd11_codes/v3/search
// NLM hosts ICD-11 directly — no WHO OAuth or backend proxy required.
// data[1] = codes, data[3] = [[code, title], ...] when df=code,title

export async function searchIcd11(query: string, maxResults = 20): Promise<CodeResult[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({
      terms:   query,
      maxList: String(maxResults),
      sf:      'code,title',
      df:      'code,title',
    });
    const res = await fetch(`${NLM_BASE}${TERMINOLOGY_CONFIG.nlm.endpoints.icd11}?${params}`);
    if (!res.ok) throw new Error(`NLM ICD-11 ${res.status}`);
    const data = await res.json();

    const codes:    string[]  = data[1] ?? [];
    const extraArr: any[][]   = data[3] ?? [];

    return codes.map((code, i) => ({
      code,
      display: extraArr[i]?.[1] ?? extraArr[i]?.[0] ?? code,
      system:  'ICD11',
    }));
  } catch (err) {
    console.warn('[codeSearchService] ICD-11 search failed:', err);
    return [];
  }
}

// ─── LOINC ────────────────────────────────────────────────────────────────────
// Endpoint: /loinc_items/v3/search  (note: loinc_items, not loinc)
// type=question filters to observable/test codes relevant to pathology.
// data[1] = LOINC numbers, data[3] = [[LOINC_NUM, LONG_COMMON_NAME], ...]

export async function searchLoinc(query: string, maxResults = 20): Promise<CodeResult[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({
      terms:   query,
      maxList: String(maxResults),
      type:    'question',
      sf:      'LOINC_NUM,LONG_COMMON_NAME,SHORTNAME',
      df:      'LOINC_NUM,LONG_COMMON_NAME',
    });
    const res = await fetch(`${NLM_BASE}${TERMINOLOGY_CONFIG.nlm.endpoints.loinc}?${params}`);
    if (!res.ok) throw new Error(`NLM LOINC ${res.status}`);
    const data = await res.json();

    const codes:    string[]  = data[1] ?? [];
    const extraArr: any[][]   = data[3] ?? [];

    return codes.map((code, i) => ({
      code,
      display: extraArr[i]?.[1] ?? extraArr[i]?.[0] ?? code,
      system:  'LOINC',
    }));
  } catch (err) {
    console.warn('[codeSearchService] LOINC search failed:', err);
    return [];
  }
}

// ─── ICD-O ────────────────────────────────────────────────────────────────────
// Uses UTS SNOMED morphology search filtered to morphologic abnormality concepts.
// Replace with a dedicated backend ICD-O-3 endpoint for full topography coverage.

export async function searchIcdo(query: string, maxResults = 20): Promise<CodeResult[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({
      string:       query.trim(),
      searchType:   'rightTruncation',
      sabs:         'SNOMEDCT_US',
      returnIdType: 'code',
      pageSize:     String(maxResults),
      apiKey:       UMLS_API_KEY,
    });

    const res = await fetch(`${UTS_SEARCH}?${params}`);
    if (!res.ok) throw new Error(`UTS SNOMED (ICD-O) ${res.status}`);
    const data = await res.json();

    const results: any[] = data?.result?.results ?? [];
    const morphologyKeywords = ['carcinoma','adenocarcinoma','sarcoma','lymphoma','melanoma','neoplasm','dysplasia','adenoma','in situ','tumour','tumor','metaplasia'];

    return results
      .filter(r => r.ui && r.ui !== 'NONE' && r.rootSource === 'SNOMEDCT_US')
      .filter(r => morphologyKeywords.some(kw => r.name.toLowerCase().includes(kw)))
      .map(r => ({
        code:    r.ui,
        display: r.name,
        system:  'ICDO',
      }));
  } catch (err) {
    console.warn('[codeSearchService] ICD-O search failed:', err);
    return [];
  }
}

// ─── OPCS-4 ───────────────────────────────────────────────────────────────────
// NHS UK procedure classification — no public NLM endpoint exists.
// Requires NHS TRUD licence and backend proxy for production.
// Dev/demo: returns empty with a console note.
// TODO: wire to NHS TRUD API via backend proxy.

export async function searchOpcs4(_query: string, _maxResults = 20): Promise<CodeResult[]> {
  console.info('[codeSearchService] OPCS-4 search requires NHS TRUD backend proxy — not yet implemented');
  return [];
}

// ─── CPT ──────────────────────────────────────────────────────────────────────
// NLM does not have CPT codes (AMA copyright restriction).
// Requires a licensed backend proxy — placeholder until implemented.

export async function searchCpt(_query: string, _maxResults = 20): Promise<CodeResult[]> {
  console.info('[codeSearchService] CPT search requires AMA-licensed backend proxy — not yet implemented');
  return [];
}

// ─── Unified dispatcher ───────────────────────────────────────────────────────

export async function searchCodes(
  system: string,
  query: string,
  filter: SnomedFilter = 'all',
  maxResults = 20
): Promise<CodeResult[]> {
  switch (system) {
    case 'SNOMED': return searchSnomed(query, filter, maxResults);
    case 'ICD10':  return searchIcd10(query, maxResults);
    case 'ICD11':  return searchIcd11(query, maxResults);
    case 'LOINC':  return searchLoinc(query, maxResults);
    case 'ICDO':   return searchIcdo(query, maxResults);
    case 'OPCS4':  return searchOpcs4(query, maxResults);
    case 'CPT':    return searchCpt(query, maxResults);
    default:       return [];
  }
}
