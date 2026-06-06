// codeConstants.ts — Centralized metadata + mock code definitions for the Codes subsystem
// ---------------------------------------------------------------------------------------

import type { CodeSource, MedicalCode } from '../synopticTypes';

// ───────────────────────────────────────────────────────────────────────────────
// SOURCE META — UI metadata for code origin badges (system, AI, manual)
// This is the single source of truth for badge colors, labels, and removability.
// ───────────────────────────────────────────────────────────────────────────────

export const SOURCE_META: Record<
  CodeSource,
  { label: string; color: string; bg: string; removable: boolean }
> = {
  system: {
    label: 'CAP/System',
    color: '#5b21b6',
    bg: '#ede9fe',
    removable: false,
  },
  ai: {
    label: 'AI',
    color: '#0369a1',
    bg: '#e0f2fe',
    removable: true,
  },
  manual: {
    label: 'Manual',
    color: '#065f46',
    bg: '#d1fae5',
    removable: true,
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// MOCK CODES — Development-only seed codes for UI testing
// These are intentionally minimal and will be replaced by real code services.
// ───────────────────────────────────────────────────────────────────────────────

export const MOCK_CODES: Omit<MedicalCode, 'id' | 'source'>[] = [
  { system: 'SNOMED', code: '413448000', display: 'Invasive ductal carcinoma of breast' },
  { system: 'SNOMED', code: '416940007', display: 'Lymphovascular invasion present' },
  { system: 'SNOMED', code: '372064008', display: 'Nottingham grade 2 breast carcinoma' },
  { system: 'SNOMED', code: '414737002', display: 'ER positive breast carcinoma' },
  { system: 'SNOMED', code: '414739004', display: 'PR positive breast carcinoma' },
  { system: 'SNOMED', code: '431396003', display: 'HER2 negative breast carcinoma' },
  { system: 'SNOMED', code: '24689008',  display: 'Total mastectomy' },
  { system: 'SNOMED', code: '261665006', display: 'Sentinel lymph node biopsy' },

  { system: 'ICD', code: 'C50.512', display: 'Malignant neoplasm of lower-outer quadrant of left female breast' },
  { system: 'ICD', code: 'Z17.0',   display: 'Estrogen receptor positive status [ER+]' },
  { system: 'ICD', code: 'C77.3',   display: 'Secondary malignant neoplasm of axillary lymph nodes' },
  { system: 'ICD', code: 'Z85.3',   display: 'Personal history of malignant neoplasm of breast' },
];

// ---------------------------------------------------------------------------------------
// End of file — all constants exported cleanly for CodeBadge, AddCodeModal, and future UI
// ---------------------------------------------------------------------------------------