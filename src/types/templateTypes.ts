//
// Template + Audit Types
// ------------------------------------------------------------------
// Shared model definitions for templates, questions, sections,
// and audit events used throughout pathscribeAI.
// ------------------------------------------------------------------

// Template lifecycle states
export type TemplateLifecycleState =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "published";

// Template option (for choice questions)
export interface TemplateOption {
  id: string;
  label: string;
}

// Base question structure
interface QuestionBase {
  id: string;
  text: string;
  type: "choice" | "text";
}

// Choice question
export interface ChoiceQuestion extends QuestionBase {
  type: "choice";
  multiple?: boolean;
  options: TemplateOption[];
}

// Text question
export interface TextQuestion extends QuestionBase {
  type: "text";
}

// Union of all question types
export type Question = ChoiceQuestion | TextQuestion;

// Template section
export interface TemplateSection {
  id: string;
  title: string;
  questions: Question[];
}

// Template definition
export interface TemplateDefinition {
  id: string;
  displayName: string;
  source: string;
  sourceVersion: string;
  sections: TemplateSection[];
}

// ------------------------------------------------------------------
// Audit Event Model
// ------------------------------------------------------------------

// High-level category for filtering and dashboard grouping
export type AuditEventCategory = "ai" | "user" | "system";

// Core audit event structure
export interface AuditEvent {
  // Unique event ID
  id: string;

  // ISO timestamp
  timestamp: string;

  // Who performed the action
  user: string;

  // High-level grouping for UI filters
  category: AuditEventCategory;

  // Machine-readable action identifier
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
