/**
 * services/phiSelectors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central registry of DOM selectors that identify PHI (Protected Health
 * Information) and PII elements in the pathscribe UI.
 *
 * Used by useScreenCapture to redact sensitive data before a screenshot
 * is captured for enhancement request submissions.
 *
 * HOW TO TAG NEW COMPONENTS:
 *   Add  data-phi="true"  to any element that renders patient data:
 *     <span data-phi="true">{patient.name}</span>
 *     <td data-phi="true">{accessionNumber}</td>
 *
 *   For entire sections, tag the container:
 *     <div data-phi="true">  ← everything inside will be redacted
 *
 * SELECTOR CATEGORIES:
 *   1. data-phi attribute  — explicit tagging (preferred)
 *   2. data-pii attribute  — user/staff personal data
 *   3. Known class names   — legacy or third-party components
 *   4. ARIA roles          — semantic fallbacks
 *
 * COMPLIANCE:
 *   HIPAA  — 18 PHI identifiers (names, dates, MRN, accession, geographic)
 *   GDPR   — personal data (names, IDs, contact info)
 *   NHS DSP Toolkit — patient identifiable data
 *
 * Drop-in path: src/services/phiSelectors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Primary selectors — always redacted ─────────────────────────────────────

export const PHI_SELECTORS: string[] = [
  // Explicit PHI tagging (preferred — add to any component rendering patient data)
  '[data-phi="true"]',
  '[data-phi="name"]',
  '[data-phi="dob"]',
  '[data-phi="mrn"]',
  '[data-phi="accession"]',
  '[data-phi="address"]',
  '[data-phi="phone"]',
  '[data-phi="email"]',
  '[data-phi="nhs"]',          // NHS number (UK)
  '[data-phi="insurance"]',

  // Explicit PII tagging (staff/user personal data)
  '[data-pii="true"]',
  '[data-pii="name"]',
  '[data-pii="email"]',

  // pathscribe-specific class names — add as you build components
  '.patient-name',
  '.patient-dob',
  '.patient-mrn',
  '.accession-number',
  '.patient-address',
  '.patient-phone',
  '.report-patient-header',
  '.worklist-patient-cell',
  '.phi-field',
];

// ─── Redaction overlay style ──────────────────────────────────────────────────
// Applied as an absolutely-positioned overlay during capture, then removed.

export const REDACTION_STYLE = {
  backgroundColor: '#1e293b',   // matches pathscribe surface colour
  borderRadius:    '4px',
  display:         'inline-block',
  minWidth:        '80px',
  minHeight:       '16px',
} as const;

// ─── Redaction label ──────────────────────────────────────────────────────────
// Shown inside the redaction box so it's clear what was removed.

export const REDACTION_LABEL = '[REDACTED]';
export const REDACTION_LABEL_STYLE = {
  fontSize:   '9px',
  color:      '#475569',
  fontFamily: 'monospace',
  fontWeight: '600',
  letterSpacing: '0.05em',
} as const;
