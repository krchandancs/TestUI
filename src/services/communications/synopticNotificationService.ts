/**
 * services/communications/synopticNotificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates email notifications for synoptic template lifecycle events.
 * Combines recipientResolver + synopticEmailTemplates + notificationService.
 *
 * Usage (after every logEvent() call for a notifiable action):
 *   logEvent(event);
 *   await sendSynopticNotification(event);
 *
 * Or use the useSynopticAudit hook which wraps both calls together.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SynopticAuditEvent, NOTIFY_ON_ACTIONS } from '../../types/SynopticAuditEvents';
import { sendEmail } from './notificationService';
import { resolveByRoles, resolveTemplateOwner, mergeRecipients } from './recipientResolver';
import { buildSubject, buildHtml, buildText } from './emailTemplates/synopticEmailTemplates';

async function resolveRecipients(event: SynopticAuditEvent): Promise<string[]> {
  const admins = await resolveByRoles(['admin', 'clinical_lead']);

  // For needs_changes, also notify the template owner so they know to act
  if (event.action === 'template.needs_changes') {
    const owner = await resolveTemplateOwner(event.templateId);
    return mergeRecipients(admins, owner);
  }

  return admins;
}

export async function sendSynopticNotification(event: SynopticAuditEvent): Promise<void> {
  if (!NOTIFY_ON_ACTIONS.includes(event.action)) return;

  const baseUrl = window.location.origin;
  const to      = await resolveRecipients(event);

  await sendEmail({
    to,
    subject:  buildSubject(event),
    bodyHtml: buildHtml(event, baseUrl),
    bodyText: buildText(event, baseUrl),
    metadata: {
      action:      event.action,
      templateId:  event.templateId,
      triggeredBy: event.user,
      timestamp:   new Date().toISOString(),
    },
  });
}
