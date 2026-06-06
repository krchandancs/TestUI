// ─────────────────────────────────────────────────────────────────────────────
// services/types.ts
// Shared types used across all service interfaces.
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

export type ID = string;
