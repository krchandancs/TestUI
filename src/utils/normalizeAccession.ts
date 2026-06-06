/**
 * src/utils/normalizeAccession.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Normalizes accession number input so users never need to type a hyphen.
 *
 * Examples (using default S26-4401 pattern):
 *   "S264401"   → "S26-4401"
 *   "s264401"   → "S26-4401"   (uppercased)
 *   "S26-4401"  → "S26-4401"   (already correct — passed through)
 *   "S26 4401"  → "S26-4401"   (space treated as hyphen)
 *   "S2644018"  → "S26-44018"  (6-digit suffix)
 *   "123456"    → "123456"     (MRN — not an accession, returned as-is)
 *   "hello"     → "hello"      (no match — returned as-is)
 *
 * The function infers hyphen position from the accession pattern stored in
 * SystemConfig.identifierFormats.accessionPattern. If no pattern is provided
 * it falls back to the PathScribe default: one letter + two digits + hyphen
 * + four to six digits (e.g. S26-4401).
 *
 * Usage:
 *   import { normalizeAccession } from '../utils/normalizeAccession';
 *   const clean = normalizeAccession('S264401');  // → "S26-4401"
 *
 *   // With a custom pattern from SystemConfig:
 *   const clean = normalizeAccession('S264401', config.identifierFormats.accessionPattern);
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Default pattern — matches S26-4401 style accessions
const DEFAULT_PATTERN = '^[A-Z]\\d{2}-\\d{4,6}$';

/**
 * Parses the accession pattern to determine prefix length and suffix range.
 * Returns null if the pattern doesn't match the expected structure.
 *
 * Supported pattern shape: ^[A-Z]\d{N}-\d{min,max}$
 * where N is the number of digits in the prefix after the letter.
 */
function parsePatternShape(pattern: string): { prefixLen: number; suffixMin: number; suffixMax: number } | null {
  // Match patterns like ^[A-Z]\d{2}-\d{4,6}$ or ^[A-Z]\d{2}-\d{4}$
  const m = pattern.match(/\[A-Z\]\\d\{(\d+)\}-\\d\{(\d+)(?:,(\d+))?\}/i);
  if (!m) return null;
  const prefixDigits = parseInt(m[1], 10);       // e.g. 2
  const suffixMin    = parseInt(m[2], 10);        // e.g. 4
  const suffixMax    = m[3] ? parseInt(m[3], 10) : suffixMin; // e.g. 6
  return {
    prefixLen:  1 + prefixDigits,  // letter + N digits (e.g. 3 for S26)
    suffixMin,
    suffixMax,
  };
}

/**
 * Normalizes an accession number input, inserting the hyphen if missing.
 *
 * @param input   Raw user input (typed or spoken)
 * @param pattern Optional regex pattern string from SystemConfig.
 *                Defaults to the PathScribe standard pattern.
 * @returns Normalized accession string, or the original input if it doesn't
 *          look like an accession number.
 */
export function normalizeAccession(input: string, pattern: string = DEFAULT_PATTERN): string {
  if (!input) return input;

  // Strip leading/trailing whitespace and uppercase
  let val = input.trim().toUpperCase();

  // Already matches the pattern — return as-is
  if (new RegExp(pattern, 'i').test(val)) return val;

  // Replace spaces with nothing (user may have said "S 26 4401")
  val = val.replace(/\s+/g, '');

  // Already has a hyphen but didn't match above — return cleaned version
  if (val.includes('-')) return val;

  // Try to infer hyphen position from the pattern shape
  const shape = parsePatternShape(pattern);
  if (!shape) return val; // unknown pattern — return stripped value

  const { prefixLen, suffixMin, suffixMax } = shape;

  // Check total length fits prefix + suffix (no hyphen)
  const totalMin = prefixLen + suffixMin;
  const totalMax = prefixLen + suffixMax;

  if (val.length >= totalMin && val.length <= totalMax) {
    // First char must be a letter
    if (!/^[A-Z]/.test(val)) return val;
    // Remaining prefix chars must be digits
    if (!/^\d+$/.test(val.slice(1, prefixLen))) return val;
    // Suffix must be digits
    if (!/^\d+$/.test(val.slice(prefixLen))) return val;

    // Insert hyphen
    const normalized = val.slice(0, prefixLen) + '-' + val.slice(prefixLen);

    // Validate against original pattern
    if (new RegExp(pattern, 'i').test(normalized)) return normalized;
  }

  // Doesn't look like an accession — return stripped value unchanged
  return val;
}

/**
 * Returns true if the value (after normalization) matches the accession pattern.
 * Useful for the smart identifier box to detect accession input.
 */
export function isAccession(input: string, pattern: string = DEFAULT_PATTERN): boolean {
  return new RegExp(pattern, 'i').test(normalizeAccession(input, pattern));
}
