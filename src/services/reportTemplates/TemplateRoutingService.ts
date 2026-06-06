// src/services/reportTemplates/TemplateRoutingService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Resolves the correct Case Report Template for an Outreach case.
//
// Priority:
//   1. CAP synoptic template ID (most specific — encodes subspecialty + procedure)
//   2. Subspecialty ID fallback
//   3. Gold standard (universal fallback)
//
// If multiple CAP protocols on a single case resolve to different report
// templates (multi-organ case), `ambiguous: true` is returned and `candidates`
// lists all qualifying template IDs.  The caller should surface the choice to
// the pathologist via the Sequencer or case header dropdown.
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateRoutingInput {
  /** Subspecialty ID from the case or order (e.g. 'breast', 'gi') */
  subspecialtyId?: string;
  /** CAP / RCPath synoptic template IDs from synopticReports[].templateId */
  synopticTemplateIds?: string[];
}

export interface TemplateRoutingResult {
  /** Resolved Case Report Template ID */
  templateId: string;
  /** True when >1 distinct templates qualify — caller should prompt the pathologist */
  ambiguous: boolean;
  /** All qualifying template IDs in priority order */
  candidates: string[];
  /** How the template was resolved */
  resolvedBy: 'cap-protocol' | 'subspecialty' | 'gold-standard';
}

// ── CAP synoptic template → Case Report Template ─────────────────────────────
// Key = synopticReports[].templateId value in mock case data
// Value = Case Report Template ID (see mockReportTemplateService)

const CAP_TO_REPORT: Record<string, string> = {
  // Breast
  'cap-breast-invasive-resection': 'tmpl-breast',
  'cap-breast-dcis-resection':     'tmpl-breast',
  'cap-breast-core-biopsy':        'tmpl-breast',
  'cap-her2-ish':                  'tmpl-breast',

  // Gastrointestinal
  'cap-colon-rectum-resection':    'tmpl-gi',
  'cap-colon-resection':           'tmpl-gi',
  'cap-colon-biopsy':              'tmpl-gi',
  'cap-gastric-resection':         'tmpl-gi',
  'cap-liver-biopsy':              'tmpl-gi',

  // Thoracic / Pulmonary
  'cap-lung-resection':            'tmpl-thoracic',
  'cap-lung-biopsy':               'tmpl-thoracic',
  'cap-mesothelioma':              'tmpl-thoracic',
  'cap-thymic-resection':          'tmpl-thoracic',

  // Urological
  'cap-prostate-biopsy':           'tmpl-uro',
  'cap-prostate-resection':        'tmpl-uro',
  'cap-bladder-resection':         'tmpl-uro',
  'cap-kidney-resection':          'tmpl-uro',

  // Gynaecological
  'cap-cervix-biopsy':             'tmpl-gold-standard',
  'cap-endometrium-resection':     'tmpl-gold-standard',
  'cap-ovary-resection':           'tmpl-gold-standard',

  // Haematopathology
  'cap-lymphoma':                  'tmpl-gold-standard',
  'cap-bone-marrow-biopsy':        'tmpl-gold-standard',

  // Dermatopathology
  'cap-melanoma-excision':         'tmpl-gold-standard',
  'cap-skin-biopsy':               'tmpl-gold-standard',
};

// ── Subspecialty → Case Report Template fallback ─────────────────────────────

const SUBSPECIALTY_TO_REPORT: Record<string, string> = {
  'breast':        'tmpl-breast',
  'gi':            'tmpl-gi',
  'thoracic':      'tmpl-thoracic',
  'uro':           'tmpl-uro',
  'derm':          'tmpl-gold-standard',
  'neuro':         'tmpl-gold-standard',
  'heme':          'tmpl-gold-standard',
  'gyn':           'tmpl-gold-standard',
  'oncology-pool': 'tmpl-gold-standard',
};

// ── Resolver ─────────────────────────────────────────────────────────────────

export function resolveReportTemplate(input: TemplateRoutingInput): TemplateRoutingResult {
  const candidates = new Set<string>();

  // Pass 1 — CAP protocol (most specific)
  for (const capId of (input.synopticTemplateIds ?? [])) {
    const mapped = CAP_TO_REPORT[capId];
    if (mapped) candidates.add(mapped);
  }

  if (candidates.size > 0) {
    const list = Array.from(candidates);
    return {
      templateId:  list[0],
      ambiguous:   list.length > 1,
      candidates:  list,
      resolvedBy: 'cap-protocol',
    };
  }

  // Pass 2 — subspecialty fallback
  if (input.subspecialtyId) {
    const mapped = SUBSPECIALTY_TO_REPORT[input.subspecialtyId];
    if (mapped) {
      return {
        templateId:  mapped,
        ambiguous:   false,
        candidates:  [mapped],
        resolvedBy: 'subspecialty',
      };
    }
  }

  // Pass 3 — gold standard
  return {
    templateId:  'tmpl-gold-standard',
    ambiguous:   false,
    candidates:  ['tmpl-gold-standard'],
    resolvedBy: 'gold-standard',
  };
}
