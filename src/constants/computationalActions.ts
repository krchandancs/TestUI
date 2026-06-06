// src/constants/computationalActions.ts
// ─────────────────────────────────────────────────────────────────────────────
// System action IDs and voice trigger phrases for the Computational Sidecar.
//
// Pattern mirrors existing PATHSCRIBE_* custom events. Each action has:
//   EVENT      — the window CustomEvent name the page listener handles
//   VOICE      — human-readable phrases the voice engine maps to this event
//   AUDIT_KEY  — the key passed to useAuditLog().log() for utilization tracking
//
// Configuration audit (flag creation / edit / delete) uses AUDIT_CONFIG_*.
// Utilization audit (pathologist interactions) uses AUDIT_USE_*.
// ─────────────────────────────────────────────────────────────────────────────

// ── Worklist — Sidecar ───────────────────────────────────────────────────────

export const COMP_EVENT = {
  // Open the computational sidecar for the focused worklist row
  OPEN_SIDECAR:         'PATHSCRIBE_COMP_OPEN_SIDECAR',
  // Close the sidecar drawer
  CLOSE_SIDECAR:        'PATHSCRIBE_COMP_CLOSE_SIDECAR',
  // Read the computational result for the currently selected assay aloud
  READ_RESULT:          'PATHSCRIBE_COMP_READ_RESULT',
  // Navigate to next assay in the navigator pane
  NEXT_ASSAY:           'PATHSCRIBE_COMP_NEXT_ASSAY',
  // Navigate to previous assay
  PREV_ASSAY:           'PATHSCRIBE_COMP_PREV_ASSAY',

  // Synoptic page — switch to computational tab
  OPEN_COMP_TAB:        'PATHSCRIBE_COMP_OPEN_TAB',
  // Synoptic page — switch back to full report tab
  OPEN_REPORT_TAB:      'PATHSCRIBE_COMP_OPEN_REPORT',

  // Order workflow
  OPEN_ORDER_MODAL:     'PATHSCRIBE_COMP_OPEN_ORDER_MODAL',
  CLOSE_ORDER_MODAL:    'PATHSCRIBE_COMP_CLOSE_ORDER_MODAL',
  PLACE_ORDERS:         'PATHSCRIBE_COMP_PLACE_ORDERS',

  // Cancel workflow
  CANCEL_SELECTED:      'PATHSCRIBE_COMP_CANCEL_SELECTED',
} as const;

// ── Voice trigger phrase lists ────────────────────────────────────────────────
// These feed into the action registry so the voice engine knows which phrases
// map to which event. The first phrase in each array is the canonical form.

export const COMP_VOICE: Record<keyof typeof COMP_EVENT, string[]> = {
  OPEN_SIDECAR:   ['show computational data', 'open sidecar', 'show lab results', 'show ancillary results', 'show test results'],
  CLOSE_SIDECAR:  ['close sidecar', 'close results', 'hide sidecar', 'dismiss results'],
  READ_RESULT:    ['read result', 'read lab result', 'what is the result', 'read computational result'],
  NEXT_ASSAY:     ['next assay', 'next test', 'next result'],
  PREV_ASSAY:     ['previous assay', 'previous test', 'prior result'],

  OPEN_COMP_TAB:  ['show computational tab', 'open computational', 'show lab panel', 'computational data'],
  OPEN_REPORT_TAB: ['show report', 'open report', 'back to report', 'close computational'],

  OPEN_ORDER_MODAL: ['order test', 'order additional test', 'order ancillary test', 'new order'],
  CLOSE_ORDER_MODAL: ['cancel order modal', 'close order modal', 'dismiss order modal'],
  PLACE_ORDERS:   ['place orders', 'submit orders', 'confirm orders', 'send orders to lab'],

  CANCEL_SELECTED: ['cancel order', 'cancel test', 'remove order'],
};

// ── Audit event keys ──────────────────────────────────────────────────────────
// Passed to useAuditLog().log(key, payload) for utilization tracking.

export const COMP_AUDIT = {
  // Utilization — pathologist interactions
  USE_SIDECAR_OPENED:      'comp_sidecar_opened',        // { caseId, flagId, source: 'click' | 'voice' }
  USE_SIDECAR_CLOSED:      'comp_sidecar_closed',        // { caseId }
  USE_RESULT_VIEWED:       'comp_result_viewed',         // { caseId, flagId, flagName, status }
  USE_RESULT_READ_ALOUD:   'comp_result_read_aloud',     // { caseId, flagId }
  USE_COMP_TAB_OPENED:     'comp_tab_opened',            // { caseId, source: 'click' | 'voice' }
  USE_ORDER_MODAL_OPENED:  'comp_order_modal_opened',    // { caseId }
  USE_ORDERS_PLACED:       'comp_orders_placed',         // { caseId, count, flags: [{flagId, lisCode, specimenId}] }
  USE_ORDER_CANCELLED:     'comp_order_cancelled',       // { caseId, flagId, flagName, orderedVia }
  USE_CONCORDANCE_VIEWED:  'comp_concordance_viewed',    // { caseId, flagId, agreement: 'agrees' | 'differs' }

  // Configuration — admin actions
  CONFIG_FLAG_CREATED:     'comp_config_flag_created',   // { flagId, flagName, dataSourceType, lisCode }
  CONFIG_FLAG_UPDATED:     'comp_config_flag_updated',   // { flagId, changes: string[] }
  CONFIG_FLAG_DEACTIVATED: 'comp_config_flag_deactivated', // { flagId, flagName }
  CONFIG_PROTOCOL_LINKED:  'comp_config_protocol_linked', // { flagId, protocolId, protocolName }
  CONFIG_PROTOCOL_UNLINKED: 'comp_config_protocol_unlinked', // { flagId, protocolId }
} as const;

export type CompAuditKey = typeof COMP_AUDIT[keyof typeof COMP_AUDIT];
