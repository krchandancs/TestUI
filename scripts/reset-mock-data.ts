/**
 * scripts/reset-mock-data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resets all PathScribe mock data by clearing localStorage keys used by the
 * mock services. Run this from the browser console OR add to package.json.
 *
 * Usage (browser console):
 *   Copy and paste the IIFE below directly into DevTools console.
 *
 * Usage (as npm script):
 *   npm run reset
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function resetPathScribeMockData() {
  const PREFIX = 'pathscribe_mock_';
  const SESSION_KEY = 'pathscribe-user';
  const cleared = [];

  // ── Versioned seed keys — must be removed so services re-seed from defaults ──
  const VERSIONED_KEYS = [
    'pathscribe_users_version',       // mockUserService seed version
    'pathscribe_messages_version',    // mockMessageService seed version
    'pathscribe_mock_cases_version',  // mockCaseService seed version (uses mock_ prefix but tracked separately)
    'pathscribe_flags_version',        // mockFlagService seed version
  ];

  VERSIONED_KEYS.forEach(k => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      cleared.push(k);
    }
  });

  // ── UI state keys — persisted across sessions but should reset with data ──
  const STATE_KEYS = [
    'pathscribe_ped_requested',  // "Access requested" badge state per case
  ];

  STATE_KEYS.forEach(k => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      cleared.push(k);
    }
  });

  // ── Flag service storage (uses different prefix) ──
  const FLAG_KEYS = ['pathscribe_flags', 'pathscribe_flags_v2'];
  FLAG_KEYS.forEach(k => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      cleared.push(k);
    }
  });

  // ── All mock service storage (pathscribe_mock_ prefix) ──
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => {
      localStorage.removeItem(k);
      cleared.push(k);
    });

  // ── User session ──
  if (localStorage.getItem(SESSION_KEY) !== null) {
    localStorage.removeItem(SESSION_KEY);
    cleared.push(SESSION_KEY);
  }

  // ── Session storage (drawer state, tab state, etc.) ──
  sessionStorage.clear();

  if (cleared.length === 0) {
    console.log('[PathScribe Reset] Nothing to clear — localStorage was already clean.');
  } else {
    console.group('[PathScribe Reset] Cleared ' + cleared.length + ' keys:');
    cleared.forEach(k => console.log(' ✓', k));
    console.groupEnd();
    console.log('[PathScribe Reset] All mock data reset. Refresh the page to re-seed.');
  }
})();
