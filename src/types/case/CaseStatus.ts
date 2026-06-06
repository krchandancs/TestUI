// src/types/case/CaseStatus.ts
// ─────────────────────────────────────────────────────────────
// Clinical-grade case lifecycle states.
// Aligned with:
//   • FHIR DiagnosticReport.status
//   • LIS case lifecycle
//   • PathScribe synoptic workflow
//   • Shared case + amendment workflows
// ─────────────────────────────────────────────────────────────

export type CaseStatus =
  /** Case created but not yet started */
  | "draft"

  /** AI has run and pre-filled suggestions — pathologist has not yet interacted */
  | "pending-review"

  /** Case is actively being worked on */
  | "in-progress"

  /** Awaiting review, QA, or sign-out — pathologist has reviewed and is ready for sign-out */
  | "pathologist-review"

  /** Fully finalized (no changes pending) */
  | "finalized"

  /** Case has been amended after finalization */
  | "amended"

  /** Case is closed (no further changes allowed) */
  | "closed"

  /** Case returned to pathologist (shared workflow) */
  | "returned"

  /** Case accepted by another pathologist (shared workflow) */
  | "accepted"

  /** Case is awaiting addendum */
  | "addendum-pending"

  /** Case is in AI-assisted drafting mode */
  | "ai-assisted"

  /** Case is sitting in a workgroup pool queue — awaiting acceptance by any available pathologist */
  | "pool"

  /** Case is temporarily locked while a pathologist is reviewing the accept/pass prompt — released after 30s if not confirmed */
  | "claiming"

  /** Case is in the process of being finalized — synoptic complete, awaiting sign-out */
  | "finalizing";
