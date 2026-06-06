/**
 * services/communications/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared types used across all communication services.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface EmailPayload {
  to:       string[];
  cc?: string[];
  subject:  string;
  bodyHtml: string;
  bodyText: string;
  metadata?: Record<string, string>;  // passed through to backend for logging
}

export interface Recipient {
  email: string;
  name?: string;
  role:  string;
}
