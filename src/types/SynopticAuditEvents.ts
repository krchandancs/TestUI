/**
 * types/SynopticAuditEvents.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Audit event action strings and payload type for all synoptic template
 * lifecycle events. Plugs into the existing logEvent() in audit/auditLogger
 * using the same call signature already used in TemplateRenderer.tsx.
 *
 * Drop-in path: src/types/SynopticAuditEvents.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TemplateLifecycleState } from './AuditEvent';

// ─── Action strings ───────────────────────────────────────────────────────────

export type SynopticAuditAction =

  // Nightly sync / manual upload
  | 'sync.auto_completed'
  | 'sync.auto_failed'
  | 'sync.manual_upload'
  | 'sync.new_template_found'   // ← triggers admin email
  | 'sync.template_updated'     // ← triggers admin email

  // Lifecycle transitions — mirrors TemplateRenderer.tsx TRANSITION_ACTIONS
  | 'template.submitted_for_review'  // draft → in_review     ← email
  | 'template.needs_changes'         // → needs_changes        ← email (incl. owner)
  | 'template.approved'              // in_review → approved   ← email
  | 'template.published'             // approved → published   ← email
  | 'template.reset'
  | 'template.archived'

  // Editor — logged only, no email
  | 'template.created'
  | 'template.duplicated'
  | 'template.section_added'
  | 'template.section_removed'
  | 'template.field_added'
  | 'template.field_removed'
  | 'template.field_updated'
  | 'template.option_added'
  | 'template.option_removed'
  | 'template.snomed_applied'
  | 'template.icd_applied'
  | 'template.snomed_removed'
  | 'template.icd_removed'

  // Answer-level — logged when a pathologist fills in a synoptic field
  | 'set_single_answer'
  | 'add_multi_answer'
  | 'remove_multi_answer'
  | 'set_text_answer'

  // Generic lifecycle
  | 'state_transition'
  | 'reset_template';

// ─── Event payload ────────────────────────────────────────────────────────────
// Intentionally compatible with the existing logEvent() object shape.

export interface SynopticAuditEvent {
  // Core — matches existing logEvent() fields
  user:        string;
  category:    'user' | 'system';
  action:      SynopticAuditAction;
  templateId:  string;
  detail?:     string;    // human-readable summary (optional for synoptic events)
  // Template metadata
  templateName?: string;
  stateFrom?:    TemplateLifecycleState;
  stateTo?:      TemplateLifecycleState;
  note?:         string;           // reviewer comment on transition

  // Sync-specific
  source?:       'CAP' | 'RCPath' | 'ICCR' | 'Custom';
  version?:      string;
  prevVersion?:  string;
  syncJobId?:    string;

  // Editor-specific
  sectionId?:    string;
  fieldId?:      string;
  questionId?:   string;           // synoptic question ID (answer-level events)
  oldValue?:     unknown;
  newValue?:     unknown;

  // Coding-specific
  codeType?:     'snomed' | 'icd';
  codeValue?:    string;
  conceptName?:  string;
  optionId?:     string;
}

// ─── Actions that trigger admin email ─────────────────────────────────────────

export const NOTIFY_ON_ACTIONS: SynopticAuditAction[] = [
  'sync.new_template_found',
  'sync.template_updated',
  'sync.auto_failed',
  'sync.manual_upload',
  'template.submitted_for_review',
  'template.needs_changes',
  'template.approved',
  'template.published',
];
