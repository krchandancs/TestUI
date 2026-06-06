/**
 * services/synopticNotificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends email/webhook notifications on high-stakes synoptic audit events.
 *
 * Current state: STUB — logs to console in development.
 * Wire to real backend once POST /api/v1/notifications is implemented.
 *
 * Drop-in path: src/services/synopticNotificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AuditEvent } from '../types/AuditEvent';

// Actions that warrant an email notification to reviewers / authors
const NOTIFY_ON_ACTIONS = new Set([
  'state_transition',
  'reset_template',
]);

export async function sendSynopticNotification(
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<void> {
  if (!NOTIFY_ON_ACTIONS.has(event.action)) return;

  // TODO: replace with real API call, e.g.:
  // await fetch('/api/v1/notifications', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event),
  // });

  console.info('[synopticNotificationService] Notification dispatched:', {
    action:     event.action,
    user:       event.user,
    templateId: event.templateId,
    detail:     event.detail,
  });
}
