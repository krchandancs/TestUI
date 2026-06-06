// src/services/mockStorage.ts
// ─────────────────────────────────────────────────────────────────────────────
// Thin localStorage wrapper used by all mock services.
// Provides typed get/set with JSON serialization and a fallback to seed data.
// When Firestore services replace the mocks, this file is simply unused.
// ─────────────────────────────────────────────────────────────────────────────

const PREFIX = 'pathscribe_mock_';

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (SSR, private mode quota) — fail silently
  }
}

export function storageClear(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

export function storageClearAll(): void {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}
