/**
 * ContributionDashboard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared TypeScript types for the Contribution Dashboard page and its
 * extracted sub-components (FlagRow, CaseMixTile).
 *
 * Import path: src/types/ContributionDashboard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// Severity
// Lowercase union — matches FlagRowProps and CaseMixTileProps.
// The dashboard page normalises incoming mock/API data to this casing.
// ─────────────────────────────────────────────────────────────────────────────
export type Severity = "low" | "medium" | "high";

// ─────────────────────────────────────────────────────────────────────────────
// Quality Flag
// Represents a single row in the Quality Flags panel.
// id    — unique key for React reconciliation
// label — case ID displayed as the primary text (e.g. "PSA-2024-1182")
// value — the issue description displayed as secondary text
// severity — drives the badge color; defaults to "low" when omitted
// onClick  — optional handler wired to the whole row (future drill-down)
// ─────────────────────────────────────────────────────────────────────────────
export interface ContributionFlag {
  id: string;
  label: string;
  value: number | string;
  severity?: Severity;
  onClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Mix Data
// Keys match pathscribeTheme.colors.caseMix exactly.
// All values are case counts (integers expected, floats accepted).
// ─────────────────────────────────────────────────────────────────────────────
export interface CaseMixData {
  breast: number;
  gi:     number;
  gu:     number;
  derm:   number;
  other:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Tile
// Used by the KPI grid — not yet extracted to its own component but typed
// here so the mock data array is explicitly shaped.
// ─────────────────────────────────────────────────────────────────────────────
export interface KpiTile {
  label: string;
  value: number;
  unit:  string;
  delta: string;
  up:    boolean;
  icon:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAT Histogram Bucket
// One bar in the Turnaround Time histogram.
// ─────────────────────────────────────────────────────────────────────────────
export interface TATBucket {
  label: string;   // e.g. "1d", "2d"
  value: number;   // case count — drives bar height
}
