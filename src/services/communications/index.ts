/**
 * services/communications/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports the public API of the communications folder.
 * Import from here rather than from individual files.
 *
 * Usage:
 *   import { sendEmail, sendSynopticNotification } from '@services/communications';
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Generic transport
export { sendEmail }                    from './notificationService';

// Recipient resolution (exposed for custom use cases)
export { resolveByRoles, resolveTemplateOwner, mergeRecipients } from './recipientResolver';

// Domain-specific services
export { sendSynopticNotification }     from './synopticNotificationService';

// Types
export type { EmailPayload, Recipient } from './types';
