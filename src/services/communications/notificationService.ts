/**
 * services/communications/notificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic email dispatcher. Transport-only — no domain knowledge.
 * All domain-specific subjects, bodies, and recipient logic lives in the
 * feature-specific services (synopticNotificationService, etc.)
 *
 * Any feature in pathscribe that needs to send email imports sendEmail()
 * from here. The backend routes POST /api/notifications/email to
 * SendGrid / SES / SMTP per system config.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EmailPayload } from './types';

const API_BASE = '/api';

/**
 * Dispatches an email via the pathscribe notification endpoint.
 * Fire-and-forget safe — logs errors but never throws.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    if (payload.to.length === 0) {
      console.warn('[NotificationService] No recipients — email skipped');
      return;
    }

    const res = await fetch(`${API_BASE}/notifications/email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[NotificationService] Dispatch failed:', res.status, await res.text());
    } else {
      console.info(`[NotificationService] "${payload.subject}" → ${payload.to.length} recipient(s)`);
    }
  } catch (err) {
    console.error('[NotificationService] Unexpected error:', err);
  }
}
