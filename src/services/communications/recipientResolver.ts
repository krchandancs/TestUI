/**
 * services/communications/recipientResolver.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves email recipients by role. Reused by every notification service
 * so the user/role lookup logic lives in one place.
 *
 * Usage:
 *   const to = await resolveByRoles(['admin', 'clinical_lead']);
 *   const to = await resolveByTemplateOwner(templateId);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Recipient } from './types';

const API_BASE = '/api';

/**
 * Fetches all users with any of the given roles.
 * Returns their email addresses deduplicated.
 */
export async function resolveByRoles(roles: string[]): Promise<string[]> {
  try {
    const query = roles.join(',');
    const res   = await fetch(`${API_BASE}/users?roles=${query}`);
    const users = (await res.json()) as Recipient[];
    return [...new Set(users.map(u => u.email))];
  } catch (err) {
    console.error('[RecipientResolver] Role lookup failed:', err);
    return [];
  }
}

/**
 * Fetches the owner of a specific template.
 * Used when a template is returned for changes — the author needs to know.
 */
export async function resolveTemplateOwner(templateId: string): Promise<string[]> {
  try {
    const res  = await fetch(`${API_BASE}/templates/${templateId}/owner`);
    const data = (await res.json()) as { email?: string };
    return data?.email ? [data.email] : [];
  } catch (err) {
    console.error('[RecipientResolver] Template owner lookup failed:', err);
    return [];
  }
}

/**
 * Merges multiple recipient arrays, deduplicating by email.
 */
export function mergeRecipients(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}
