/**
 * src/types/systemConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure type definitions and default values for PathScribe system configuration.
 * No React, no side effects — safe to import anywhere.
 *
 * Single source of truth for:
 *   - The SystemConfig shape (what fields exist and their types)
 *   - DEFAULT_SYSTEM_CONFIG (safe baseline for first run / new fields)
 *
 * Runtime layer (loading, persisting, React context):
 *   → contexts/SystemConfigContext.tsx
 *
 * ─── Changelog ───────────────────────────────────────────────────────────────
 * v1  Initial — LIS integration flags, approved fonts
 * v2  Added jurisdiction, terminologyConfig
 * v3  Added voiceEnabled master switch
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. JURISDICTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The institution's operating jurisdiction.
 * Determines which national SNOMED CT release and ICD-10 variant are served,
 * and which licenses apply. Set once at deployment — never changed by end users.
 *
 * Licensing notes per jurisdiction:
 *   US      — SNOMED CT US Edition (NLM) + ICD-10-CM (NLM/CMS).
 *             NLM UMLS registration (free) covers both.
 *   CA      — SNOMED CT Canada Edition (Infoway) + ICD-10-CA (CIHI).
 *             Infoway affiliate (free) + CIHI registration (free).
 *   GB_EW   — SNOMED CT UK Edition (NHS Digital/TRUD) + ICD-10 WHO.
 *             NHS TRUD registration (free) covers both.
 *   GB_SCT  — SNOMED CT UK Edition + Scottish Extension (NHS Scotland/TRUD).
 *             Same TRUD registration as GB_EW — Scottish Extension included.
 *   IE      — SNOMED CT (SNOMED International Affiliate License, commercial fee)
 *             + ICD-10-AM (HSE Ireland/NCPOH). Ireland is not a SNOMED member
 *             country — the Affiliate License must be obtained before seeding
 *             production. Mock mode works without it during development.
 *
 * ICD-11 and ICD-O are served from WHO sources — no jurisdiction-specific
 * licensing required beyond standard WHO registration.
 */
export type Jurisdiction = 'US' | 'CA' | 'GB_EW' | 'GB_SCT' | 'IE';

/** Human-readable label for each jurisdiction. Used in the admin UI. */
export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  US:     'United States',
  CA:     'Canada',
  GB_EW:  'England & Wales (NHS)',
  GB_SCT: 'Scotland (NHS Scotland)',
  IE:     'Republic of Ireland (HSE)',
};

/** ICD-10 variant name for a given jurisdiction. */
export const icd10VariantForJurisdiction = (j: Jurisdiction): string => ({
  US:     'ICD-10-CM',
  CA:     'ICD-10-CA',
  GB_EW:  'ICD-10 (WHO)',
  GB_SCT: 'ICD-10 (WHO)',
  IE:     'ICD-10-AM',
}[j]);

/** SNOMED CT release name for a given jurisdiction. */
export const snomedReleaseForJurisdiction = (j: Jurisdiction): string => ({
  US:     'SNOMED CT US Edition (NLM)',
  CA:     'SNOMED CT Canada Edition (Infoway)',
  GB_EW:  'SNOMED CT UK Edition (NHS Digital)',
  GB_SCT: 'SNOMED CT UK Edition + Scottish Extension (NHS Scotland)',
  IE:     'SNOMED CT (SNOMED International Affiliate License)',
}[j]);

/**
 * Returns true if the jurisdiction requires a manually obtained license
 * before seeding production terminology. The seed script checks this and
 * requires --confirm-license for these jurisdictions.
 */
export const requiresManualLicense = (j: Jurisdiction): boolean => j === 'IE';


// ─────────────────────────────────────────────────────────────────────────────
// 2. TERMINOLOGY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deployment mode for a single terminology system.
 *   mock      — in-memory seed data (development / demo, no Firestore required)
 *   hosted    — Firestore hosted reference, seeded at deployment (v1 production)
 *   live_api  — proxied external API via Cloud Function (v2, future)
 */
export type TerminologyMode = 'mock' | 'hosted' | 'live_api';

/** Configuration for one terminology system (SNOMED, ICD-10, ICD-11, ICD-O). */
export interface TerminologySystemConfig {
  active:   boolean;
  mode:     TerminologyMode;
  /** Written by the seed script. Example: "SNOMED CT UK Edition 2025-04-23" */
  version?: string;
}

/** Configuration for all four terminology systems. */
export interface InstitutionTerminologyConfig {
  snomed: TerminologySystemConfig;
  icd10:  TerminologySystemConfig;
  icd11:  TerminologySystemConfig;
  icdo:   TerminologySystemConfig;
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. IDENTIFIER FORMATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Institution-specific identifier format configuration.
 *
 * These patterns drive the smart identifier box on the Search page, which
 * auto-detects whether a typed value is an accession number, MRN, or patient
 * name — routing it to the correct field without requiring manual field selection.
 *
 * Detection order:
 *   1. Test accessionPattern  → Accession #
 *   2. Test mrnPattern        → MRN / Hospital ID
 *   3. Contains space/comma, mostly alpha → Patient Name
 *   4. Ambiguous              → search all three fields
 *
 * Patterns are standard JavaScript regex strings (no delimiters).
 * Examples:
 *   accessionPattern: "^[A-Z]\\d{2}-\\d{4}$"  →  matches S26-4200
 *   mrnPattern:       "^\\d{6,8}$"             →  matches 123456
 */
export interface IdentifierFormats {
  accessionPattern: string;
  accessionExample: string;
  mrnPattern:       string;
  mrnExample:       string;
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. SYSTEM CONFIG — main shape
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemConfig {

  // ── LIS Integration ────────────────────────────────────────────────────────
  /** Enable LIS bi-directional integration. */
  lisIntegrationEnabled:           boolean;
  /** LIS FHIR/HL7 endpoint URL. */
  lisEndpoint:                     string;
  /** When true, case statuses are owned by the LIS — PathScribe treats them read-only. */
  lisOwnsStatuses:                 boolean;
  /** Allow PathScribe post-finalization actions (addendum, amendment) even when LIS is active. */
  allowPathScribePostFinalActions: boolean;

  // ── Typography ─────────────────────────────────────────────────────────────
  /** Fonts available in the report editor. */
  approvedFonts: string[];

  // ── Jurisdiction ───────────────────────────────────────────────────────────
  /**
   * Operating jurisdiction — determines SNOMED CT national release, ICD-10
   * variant, and locale defaults. Set at deployment, not editable by end users.
   */
  jurisdiction: Jurisdiction;

  // ── Identifier Formats ─────────────────────────────────────────────────────
  /** Smart identifier detection patterns for the Search page. */
  identifierFormats: IdentifierFormats;

  // ── Terminology ────────────────────────────────────────────────────────────
  /** Per-system terminology configuration (SNOMED, ICD-10, ICD-11, ICD-O). */
  terminologyConfig: InstitutionTerminologyConfig;

  // ── Voice Integration ──────────────────────────────────────────────────────
  /**
   * Master switch for voice commands and dictation.
   * When false, the mic button is greyed out and voice is completely
   * unavailable to all users on this client.
   * Can also be hard-disabled at the environment level via VITE_VOICE_ENABLED=false,
   * which overrides this setting and removes the mic button entirely.
   */
  voiceEnabled: boolean;


}


// ─────────────────────────────────────────────────────────────────────────────
// 5. DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DEFAULT_SYSTEM_CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 * Baseline values for first run and for any field not yet present in a user's
 * saved config (new fields added in later versions).
 *
 * Design principles:
 *   - LIS off by default       → PathScribe works standalone out of the box
 *   - Post-final actions on    → pathologist has full capability by default
 *   - Jurisdiction US          → safe default; overridden at deployment
 *   - All terminology mock     → no Firestore dependency until seeded
 *   - ICD-11 off by default    → adoption still in progress in most markets
 *   - Voice on by default      → feature is available unless explicitly disabled
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {

  // LIS
  lisIntegrationEnabled:           false,
  lisEndpoint:                     '',
  lisOwnsStatuses:                 true,
  allowPathScribePostFinalActions: true,

  // Typography
  approvedFonts: ['Arial', 'Times New Roman', 'Courier New'],

  // Jurisdiction
  jurisdiction: 'US',

  // Identifier formats — match the S26-4200 pattern used in mock data
  identifierFormats: {
    accessionPattern: '^[A-Z]\\d{2}-\\d{4,6}$',
    accessionExample: 'S26-4200',
    mrnPattern:       '^\\d{5,10}$',
    mrnExample:       '123456',
  },

  // Terminology — all mock by default
  terminologyConfig: {
    snomed: { active: true,  mode: 'mock' },
    icd10:  { active: true,  mode: 'mock' },
    icd11:  { active: false, mode: 'mock' },
    icdo:   { active: true,  mode: 'mock' },
  },

  // Voice
  voiceEnabled: true,
};
