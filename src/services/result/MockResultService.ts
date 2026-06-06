// PathScribe — MockResultService
// Synthetic ComputationalResult data for development and QA testing.
// Covers all four worklist icon states:
//   PENDING            → gray  slow pulse  (ordered, not yet resulted)
//   PRELIMINARY        → amber fast pulse  (interim result available)
//   FINAL NON-ACTION   → green solid       (resulted, no intervention needed)
//   FINAL ACTIONABLE   → red   solid       (resulted, action required)
//
// AI extraction provenance is included on selected results to test
// the SidecarDisplay ExtractionBadge.

import { IResultService } from './IResultService';
import {
  ComputationalResult,
  ResultStatus,
  ActionabilityLevel,
} from '../../types/smarttag.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const P  = ResultStatus.PENDING;
const PR = ResultStatus.PRELIMINARY;
const F  = ResultStatus.FINAL;
const NA = ActionabilityLevel.NON_ACTIONABLE;
const A  = ActionabilityLevel.ACTIONABLE;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Synthetic result lookup
// Key format: `${sourceId}_${caseId}`
// ---------------------------------------------------------------------------

const RESULTS: Record<string, ComputationalResult> = {

  // ── S26-4401 Grace Thompson (breast, in-progress) ─────────────────────────
  // HER2 IHC equivocal → Preliminary amber
  'er-pr-her2_S26-4401': {
    status:        PR,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'indeterminate',
    data: {
      'ER':                  'Positive — Allred 7/8 (90% strong)',
      'PR':                  'Positive — Allred 6/8 (70% moderate)',
      'HER2 IHC':            '2+ (equivocal)',
      'Ki-67':               '18%',
      'interpretation':      'HER2 equivocal — FISH testing initiated',
    },
    extraction: {
      method:     'llm',
      confidence: 0.96,
      sourceText: 'ER: Positive (Allred score 7/8, 90% strong). PR: Positive (Allred score 6/8, 70% moderate). HER2 IHC: 2+ (equivocal). Ki-67: 18%.',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // HER2 FISH not amplified → Final Non-Actionable green
  'her2-fish_S26-4401': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(0),
    concordance:   'concordant',
    data: {
      'HER2 signals / cell':   '4.2',
      'CEP17 signals / cell':  '3.0',
      'HER2 / CEP17 ratio':    '1.4',
      'interpretation':         'Not amplified — FISH negative',
    },
  },

  // ── S26-4402 Robert Jackson (colorectal, STAT) ────────────────────────────
  // KRAS G12D detected → Final Actionable red (anti-EGFR therapy excluded)
  'mol-panel_S26-4402': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'KRAS codon 12/13':  'p.G12D mutation detected',
      'KRAS codon 61':     'Wild type',
      'NRAS exon 2/3/4':   'Wild type',
      'BRAF V600E':        'Wild type',
      'interpretation':     'RAS mutant — anti-EGFR therapy (cetuximab/panitumumab) not indicated',
    },
    extraction: {
      method:     'llm',
      confidence: 0.97,
      sourceText: 'KRAS mutation analysis: p.G12D detected. BRAF V600E: Wild type. RAS/RAF panel: Pending.',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // ── S26-4403 Helen Williams (lung, STAT) ──────────────────────────────────
  // NGS panel preliminary
  'mol-profiling_S26-4403': {
    status:        PR,
    actionability: A,
    resultedAt:    daysAgo(0),
    data: {
      'KRAS':          'p.G12C mutation detected (PRELIMINARY)',
      'EGFR':          'Wild type',
      'ALK':           'Negative',
      'ROS1':          'Negative',
      'PD-L1 TPS':     '45% (22C3 assay)',
      'status note':   'Comprehensive NGS panel in progress — KRASG12C targeted therapy eligibility pending confirmation',
    },
  },

  // PD-L1 as IHC result
  'ihc-panel_S26-4403': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(1),
    data: {
      'PD-L1 TPS (22C3)': '45%',
      'interpretation':    'Intermediate expression — pembrolizumab eligible (TPS ≥ 1%)',
      'TTF-1':             'Positive',
      'Napsin A':          'Positive',
    },
  },

  // ── S26-4406 Ruth Anderson (breast biopsy, blank) ─────────────────────────
  // ER/PR/HER2 ordered, not yet resulted → Pending gray
  'er-pr-her2:S26-4406': {
    status:        P,
    actionability: NA,
    data: {},
  },

  // ── S26-4407 Michael Chen (rectal post-CRT) ───────────────────────────────
  // MMR IHC → Final Actionable (MLH1 loss = MSI-H = immunotherapy eligible)
  'ihc-panel_S26-4407': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'MLH1':          'Loss of nuclear expression (ABNORMAL)',
      'PMS2':          'Loss of nuclear expression (ABNORMAL)',
      'MSH2':          'Retained',
      'MSH6':          'Retained',
      'interpretation': 'MLH1/PMS2 loss — consistent with MLH1 promoter hypermethylation (sporadic MSI-H). Lynch syndrome unlikely. Immunotherapy (pembrolizumab) eligible.',
    },
    extraction: {
      method:     'llm',
      confidence: 0.99,
      sourceText: 'MMR IHC: MLH1 loss (abnormal). MSH2: Retained. MSH6: Retained. PMS2: Loss. Pattern consistent with MLH1 promoter hypermethylation (sporadic MSI-H).',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // Molecular → Final Actionable (BRAF V600E positive = MSI-H + BRAF = specific prognosis)
  'mol-panel_S26-4407': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(0),
    data: {
      'KRAS codon 12/13':  'Wild type',
      'BRAF V600E':        'Positive (detected)',
      'MSI status':        'MSI-High (corroborates MMR IHC)',
      'interpretation':     'BRAF V600E + MSI-H sporadic — immunotherapy preferred. Adverse prognosis vs BRAF wt MSI-H.',
    },
  },

  // ── S26-4408 Carol Davis (HER2 3+ mastectomy) ─────────────────────────────
  // HER2 3+ → Final Actionable red (trastuzumab)
  'er-pr-her2:S26-4408': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'ER':             'Negative (Allred 0/8)',
      'PR':             'Negative (Allred 0/8)',
      'HER2 IHC':       '3+ (positive)',
      'Ki-67':          '65%',
      'interpretation':  'Triple negative for hormones; HER2 positive — anti-HER2 therapy (trastuzumab + pertuzumab) indicated',
    },
  },

  // HER2 FISH amplified → Final Actionable
  'her2-fish:S26-4408': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(0),
    concordance:   'concordant',
    data: {
      'HER2 signals / cell':  '9.8',
      'CEP17 signals / cell': '2.1',
      'HER2 / CEP17 ratio':   '4.7',
      'interpretation':        'Amplified — confirms HER2 positivity',
    },
  },

  // ── S26-4411 Margaret Foster (breast pending review) ──────────────────────
  // ER/PR/HER2 pending
  'er-pr-her2:S26-4411': {
    status:        P,
    actionability: NA,
    data: {},
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UK CASES — Paul Carter (HOSP-MFT)
  // ─────────────────────────────────────────────────────────────────────────

  // MFT26-8801 Colorectal anterior resection
  // MMR IHC proficient → Final Non-Actionable green
  'ihc-panel_MFT26-8801': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'MLH1':          'Retained',
      'PMS2':          'Retained',
      'MSH2':          'Retained',
      'MSH6':          'Retained',
      'interpretation': 'MMR proficient (pMMR) — MSS. Standard adjuvant chemotherapy applies.',
    },
    extraction: {
      method:     'llm',
      confidence: 0.98,
      sourceText: 'Mismatch repair proteins: MLH1, PMS2, MSH2, MSH6 — all nuclear expression intact (MMR proficient).',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // KRAS p.G12V → Final Actionable
  'mol-panel_MFT26-8801': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'KRAS codon 12/13':  'p.G12V mutation detected',
      'NRAS':              'Wild type',
      'BRAF V600E':        'Wild type',
      'MSI':               'MS-stable',
      'interpretation':     'KRAS mutant — anti-EGFR therapy not indicated. FOLFOX adjuvant appropriate.',
    },
    extraction: {
      method:     'llm',
      confidence: 0.97,
      sourceText: 'KRAS codon 12/13: p.G12V mutation detected. BRAF V600E: wild type. MSI testing: MS-stable.',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // MFT26-8802 Prostate biopsy — PSMA pending
  'ihc-panel_MFT26-8802': {
    status:        P,
    actionability: NA,
    data: {},
  },

  // MFT26-8804 Radical prostatectomy — PSMA final, positive margin actionable
  'ihc-panel_MFT26-8804': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(0),
    concordance:   'discordant',
    data: {
      'PSMA IHC':       'Strongly positive in carcinoma foci',
      'PIN-4':          'Confirms adenocarcinoma, loss of basal cells',
      'margin status':  'Right posterolateral margin positive (1.2 mm)',
      'interpretation': 'PSMA positive — PSMA-targeted therapy/imaging eligible. Positive margin: adjuvant radiotherapy discussion required.',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // US CASES — Amber Fehrs-Battey (HOSP-MPA)
  // ─────────────────────────────────────────────────────────────────────────

  // MPA26-1001 Breast lumpectomy — HER2 equivocal, FISH pending
  'er-pr-her2:MPA26-1001': {
    status:        PR,
    actionability: A,
    resultedAt:    daysAgo(0),
    data: {
      'ER':             'Positive — 95% strong',
      'PR':             'Positive — 80% moderate',
      'HER2 IHC':       '2+ (equivocal)',
      'Ki-67':          '18%',
      'interpretation':  'HER2 equivocal (2+) — FISH testing in progress',
    },
  },

  'her2-fish:MPA26-1001': {
    status:        P,
    actionability: NA,
    data: {},
  },

  // MPA26-1002 Colorectal post-CRT — pMMR, KRAS wild type
  'ihc-panel_MPA26-1002': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'MLH1':          'Retained (+)',
      'MSH2':          'Retained (+)',
      'MSH6':          'Retained (+)',
      'PMS2':          'Retained (+)',
      'interpretation': 'MMR proficient — no immunotherapy benefit expected. FOLFOX maintenance appropriate.',
    },
  },

  'mol-panel_MPA26-1002': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'KRAS exon 2':   'Wild type',
      'NRAS':          'Wild type',
      'BRAF V600E':    'Not detected',
      'interpretation': 'RAS/RAF wild type — anti-EGFR therapy (cetuximab/panitumumab) may be considered',
    },
    extraction: {
      method:     'llm',
      confidence: 0.96,
      sourceText: 'MMR IHC: MLH1+, MSH2+, MSH6+, PMS2+ — mismatch repair proficient (pMMR). KRAS exon 2: wild type. NRAS: wild type. BRAF V600E: not detected.',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  // MPA26-1003 Prostate radical prostatectomy — positive margin actionable
  'ihc-panel_MPA26-1003': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(0),
    data: {
      'PSMA IHC':       'Strongly positive in carcinoma foci',
      'PIN-4':          'Confirms adenocarcinoma, basal cell loss confirmed',
      'margin status':  'Right posterior surgical margin positive (1 mm)',
      'interpretation': 'PSMA positive — PSMA-PET staging and targeted therapy eligible. Positive margin: discuss adjuvant radiotherapy.',
    },
  },

  // HFHS26-1004 Lung lobectomy — EGFR actionable, PD-L1 non-actionable
  'mol-profiling_HFHS26-1004': {
    status:        F,
    actionability: A,
    resultedAt:    daysAgo(1),
    concordance:   'concordant',
    data: {
      'EGFR':          'Exon 19 deletion detected (sensitising mutation)',
      'ALK':           'Negative',
      'ROS1':          'Negative',
      'KRAS':          'Wild type',
      'MET':           'Wild type',
      'interpretation': 'EGFR exon 19 deletion — osimertinib (first-line EGFR TKI) strongly indicated. Expected PFS benefit ~18 months.',
    },
    extraction: {
      method:     'llm',
      confidence: 0.98,
      sourceText: 'EGFR: exon 19 deletion detected. ALK: negative. ROS1: negative. PD-L1 TPS: 35% (22C3).',
      modelId:    'pathscribe-extract-v1.2',
    },
  },

  'ihc-panel_HFHS26-1004': {
    status:        F,
    actionability: NA,
    resultedAt:    daysAgo(2),
    data: {
      'PD-L1 TPS (22C3)': '35%',
      'TTF-1':             'Positive',
      'Napsin A':          'Positive',
      'interpretation':    'Intermediate PD-L1 — immunotherapy eligible but EGFR mutation takes therapeutic priority (TKI first)',
    },
  },

  // ── S26-4401 Grace Thompson (breast biopsy) ───────────────────────────────
  
};

// ---------------------------------------------------------------------------
// Default results by sourceId (fallback when caseId not in lookup)
// ---------------------------------------------------------------------------

const DEFAULTS: Record<string, ComputationalResult> = {
  'er-pr-her2':    { status: P,  actionability: NA, data: {} },
  'ihc-panel':     { status: P,  actionability: NA, data: {} },
  'her2-fish':     { status: P,  actionability: NA, data: {} },
  'mol-panel':     { status: P,  actionability: NA, data: {} },
  'mol-profiling': { status: P,  actionability: NA, data: {} },
  'flow-cyto':     { status: P,  actionability: NA, data: {} },
  'cytogenetics':  { status: P,  actionability: NA, data: {} },
};

// ---------------------------------------------------------------------------
// MockResultService
// ---------------------------------------------------------------------------

const delay = (ms = 120) => new Promise<void>(r => setTimeout(r, ms));

export class MockResultService implements IResultService {
  async getResult(sourceId: string, caseId: string): Promise<ComputationalResult> {
    await delay();
    const key = `${sourceId}_${caseId}`;
    return RESULTS[key] ?? DEFAULTS[sourceId] ?? { status: P, actionability: NA, data: {} };
  }
}

// Singleton instance — imported by services/index.ts as 'resultService'
export const mockResultService = new MockResultService();
