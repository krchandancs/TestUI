//
// AuditEvent.ts
// ------------------------------------------------------------------
// Central audit event model for pathscribeAI.
// Supports:
// - AI actions
// - User actions
// - System actions
// - Field-level changes
// - Comment events
// - Lifecycle transitions
// - Full audit trail reconstruction
//

// High-level category for filtering and dashboard grouping
export type AuditEventCategory = "ai" | "user" | "system";

// Template lifecycle states
export type TemplateLifecycleState =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "published";

// Core audit event structure
export interface AuditEvent {
  // Unique event ID
  id: string;

  // ISO timestamp
  timestamp: string;

  // Who performed the action
  // Examples:
  // - "Dr. Sarah Johnson"
  // - "System"
  // - "System (AI)"
  user: string;

  // High-level grouping for UI filters
  category: AuditEventCategory;

  // Machine-readable action identifier
  // Examples:
  // - "set_single_answer"
  // - "add_comment"
  // - "state_transition"
  // - "ai_generated_synoptic"
  action: string;

  // Human-readable detail string (built by useAuditLog)
  detail: string;

  // Optional: which template this event belongs to
  templateId?: string;

  // Optional lifecycle transition fields
  stateFrom?: TemplateLifecycleState;
  stateTo?: TemplateLifecycleState;

  // Optional question-level context
  questionId?: string;

  // Optional comment-level context
  commentId?: string;

  // Old and new values for field changes
  oldValue?: any;
  newValue?: any;

  // Optional free-text note (e.g., AI explanation, reviewer note)
  note?: string;
}
