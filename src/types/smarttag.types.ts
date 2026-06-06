// PathScribe — SmartTag Type System
// Phase I: Dual-Tag Model
// V1: No permissions, analytics, or advanced validation

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TagClass {
  ADMINISTRATIVE = "ADMINISTRATIVE",
  COMPUTATIONAL  = "COMPUTATIONAL",
}

export enum ResultStatus {
  PENDING     = "PENDING",      // Ordered, awaiting result
  PRELIMINARY = "PRELIMINARY",  // Interim result available
  FINAL       = "FINAL",        // Result locked and reportable
}

// Drives visual escalation on the worklist icon.
// Only meaningful when status === FINAL.
export enum ActionabilityLevel {
  NON_ACTIONABLE = "NON_ACTIONABLE", // Green — no intervention indicated
  ACTIONABLE     = "ACTIONABLE",     // Red   — requires pathologist attention
}

// Predefined keys into the SVG/glyph library.
// Extend this union as new assay icons are added — no code elsewhere changes.
export type IconKey =
  | "ihc"
  | "fish"
  | "molecular"
  | "flow-cytometry"
  | "cytogenetics"
  | "micro"
  | "coag"
  | "generic-lab";

// ---------------------------------------------------------------------------
// Data Binding
// ---------------------------------------------------------------------------

export interface DataSourceBinding {
  /** Stable identifier for this data source (e.g. "her2-ihc", "pdl1-22c3"). */
  sourceId: string;

  /** Absolute API endpoint or LIMS field reference returning ComputationalResult. */
  endpoint: string;

  /**
   * Optional dot-notation path into the response payload.
   * e.g. "results.her2.score" — leave undefined to use the full response.
   */
  resultPath?: string;

  /**
   * Polling interval in milliseconds for live/pending results.
   * Omit to fetch once and rely on push / manual refresh.
   */
  pollIntervalMs?: number;
}

// ---------------------------------------------------------------------------
// Status & Color Logic
// ---------------------------------------------------------------------------

/**
 * Rule-based mapping from result status (and optional actionability) to a
 * display color token. Kept as plain data so admins can edit via config UI
 * without touching component code.
 */
export interface StatusColorRule {
  status: ResultStatus;
  actionability?: ActionabilityLevel; // Only evaluated when status === FINAL
  /** Semantic color token consumed by the SidecarDrawer and worklist icon. */
  colorToken: "neutral" | "amber" | "green" | "red";
}
export interface ExtractionProvenance {
  method:     'llm' | 'ocr+llm' | 'hl7-parse' | 'pdf-parse' | 'native';
  confidence: number;   // 0–1
  sourceText: string;
  modelId?:   string;
}


/** Default ruleset — overridable per-tag in configuration. */
export const DEFAULT_STATUS_RULES: StatusColorRule[] = [
  { status: ResultStatus.PENDING,     colorToken: "neutral" },
  { status: ResultStatus.PRELIMINARY, colorToken: "amber"   },
  { status: ResultStatus.FINAL, actionability: ActionabilityLevel.NON_ACTIONABLE, colorToken: "green" },
  { status: ResultStatus.FINAL, actionability: ActionabilityLevel.ACTIONABLE,     colorToken: "red"   },
];

// ---------------------------------------------------------------------------
// Discrete Result Payload
// ---------------------------------------------------------------------------

/**
 * The structured data returned by a Computational Tag's data source.
 * Intentionally minimal for V1 — typed as a generic record to accommodate
 * IHC scores, FISH ratios, mutation calls, etc. without pre-baking schemas.
 */
export interface ComputationalResult {
  extraction?: ExtractionProvenance;
  status:        ResultStatus;
  actionability: ActionabilityLevel;

  /** ISO 8601 timestamp of the result (preliminary or final). */
  resultedAt?: string;

  /**
   * Assay-specific key/value pairs.
   * e.g. { score: "3+", percentPositive: 95, interpretation: "Positive" }
   */
  data: Record<string, string | number | boolean | null>;

  /**
   * Optional system-generated concordance signal for the Sidecar header.
   * Undefined means no comparison is available.
   */
  concordance?: "concordant" | "discordant" | "indeterminate";
}

// ---------------------------------------------------------------------------
// Tag Definitions
// ---------------------------------------------------------------------------

/** Fields shared by both tag classes. */
interface SmartTagBase {
  /** Unique stable identifier — safe to use as a React key. */
  tagId: string;

  /** Human-readable label (used in admin UI and accessibility text). */
  displayName: string;

  tagClass: TagClass;

  /**
   * Allows admins to suppress a tag without deleting its config.
   * Inactive tags are hidden from both the worklist and the Sidecar navigator.
   */
  isActive: boolean;
}

/** Administrative tag — rendered as a static text pill. No interaction. */
export interface AdministrativeTag extends SmartTagBase {
  tagClass: TagClass.ADMINISTRATIVE;

  /** Text shown directly in the pill. */
  value: string;
}

/** Computational tag — rendered as an icon; opens the Sidecar Drawer. */
export interface ComputationalTag extends SmartTagBase {
  tagClass: TagClass.COMPUTATIONAL;

  /** Icon to render in the worklist and Sidecar navigator. */
  iconKey: IconKey;

  /** Where to fetch discrete result data. */
  dataSource: DataSourceBinding;

  /**
   * Override the default status → color rules for this tag.
   * Falls back to DEFAULT_STATUS_RULES when undefined.
   */
  statusRules?: StatusColorRule[];

  /**
   * Arbitrary metadata for future extension (e.g. molecular panel type,
   * vendor integration flags) without breaking the V1 interface.
   */
  meta?: Record<string, unknown>;
}

/** Discriminated union — exhaustive pattern matching enforced by TypeScript. */
export type SmartTag = AdministrativeTag | ComputationalTag;

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isComputationalTag(tag: SmartTag): tag is ComputationalTag {
  return tag.tagClass === TagClass.COMPUTATIONAL;
}

export function isAdministrativeTag(tag: SmartTag): tag is AdministrativeTag {
  return tag.tagClass === TagClass.ADMINISTRATIVE;
}

// ---------------------------------------------------------------------------
// Configuration Schema
// ---------------------------------------------------------------------------

/**
 * The persisted unit an admin creates/edits in the Tag Configuration Manager.
 * This is what the backend stores and the frontend fetches — no redeployment
 * required for adding new tags or changing routing rules.
 */
export interface SmartTagConfig {
  /** ISO 8601. Informational — not used for cache busting in V1. */
  lastModified: string;
  tags: SmartTag[];
}

// ---------------------------------------------------------------------------
// Usage example (illustrative — not shipped)
// ---------------------------------------------------------------------------

// const her2Tag: ComputationalTag = {
//   tagId:       "her2-ihc",
//   displayName: "HER2 IHC",
//   tagClass:    TagClass.COMPUTATIONAL,
//   iconKey:     "ihc",
//   isActive:    true,
//   dataSource: {
//     sourceId: "her2-ihc",
//     endpoint: "/api/results/ihc/her2",
//     resultPath: "results.score",
//     pollIntervalMs: 30_000,
//   },
// };
//
// const priorityTag: AdministrativeTag = {
//   tagId:       "priority-stat",
//   displayName: "Priority",
//   tagClass:    TagClass.ADMINISTRATIVE,
//   isActive:    true,
//   value:       "STAT",
// };
