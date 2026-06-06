// src/utils/formatDate.ts
// Locale-aware date and datetime formatting utilities.
// Single source of truth for all date display across PathScribe.
//
// Usage:
//   import { formatDate, formatDateTime, formatAge } from '@/utils/formatDate';
//   formatDate('1974-03-14', 'en-GB')  → '14/03/1974'
//   formatDate('1974-03-14', 'en-US')  → '03/14/1974'

// ── Date only ─────────────────────────────────────────────────────────────────
export function formatDate(iso: string | undefined, locale?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale ?? 'en-US', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

// ── Date + time ───────────────────────────────────────────────────────────────
export function formatDateTime(iso: string | undefined, locale?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale ?? 'en-US', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ── Age label (days / weeks / months / years) ─────────────────────────────────
export function formatAge(dobIso: string | undefined): string {
  if (!dobIso) return '—';
  const dob  = new Date(dobIso);
  const now  = new Date();
  const msOld = now.getTime() - dob.getTime();
  const days  = Math.floor(msOld / (1000 * 3600 * 24));

  if (days < 1)   return `${Math.max(0, Math.floor(msOld / (1000 * 3600)))}h`;
  if (days < 7)   return `${days}d`;
  if (days < 30)  return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30.43)}mo`;
  return `${Math.floor(days / 365.25)}y`;
}

// ── Relative label (today / yesterday / day name / date) ──────────────────────
export function formatRelative(iso: string | undefined, locale?: string): string {
  if (!iso) return '—';
  const d   = new Date(iso);
  const now = new Date();
  if (isNaN(d.getTime())) return iso;

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return d.toLocaleDateString(locale ?? 'en-US', { weekday: 'short' });
  if (diffDays < 365) return d.toLocaleDateString(locale ?? 'en-US', { month: 'short', day: 'numeric' });
  return formatDate(iso, locale);
}
