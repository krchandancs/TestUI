// PathScribe — DemoResetTab
// Two-level mock data reset for guest testing rounds.
//
//   Full reset    — clears everything, restores seed data for all users
//   My data only  — clears only data belonging to the current user's hospital,
//                   preserving other testers' work
//
// Both paths require a confirmation step before executing.

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';

// ─── Reset utilities ──────────────────────────────────────────────────────────

const MOCK_PREFIX   = 'pathscribe_mock_';
const SESSION_KEY   = 'pathscribe-user';

const VERSIONED_KEYS = [
  'pathscribe_users_version',
  'pathscribe_messages_version',
  'pathscribe_mock_cases_version',
  'pathscribe_flags_version',
];

const SETTINGS_KEYS = [
  'pathscribe_subspecialties',
  'pathscribe_report_templates',
];

const CASE_KEYS = [
  'ps_cases',
  'orch_cases_v2',
];

const FLAG_KEYS = [
  'pathscribe_flags',
  'pathscribe_flags_v2',
];

const STATE_KEYS = [
  'pathscribe_ped_requested',
];

// Hospital → user mapping (mirrors mockCaseService USER_HOSPITAL_MAP)
const HOSPITAL_MAP: Record<string, string> = {
  'PATH-001':    'HOSP-001',   // Pete Nimmo — US demo
  'PATH-UK-001': 'HOSP-MFT',  // Paul Carter   — UK
  'PATH-UK-002': 'HOSP-MFT',
  'PATH-US-001': 'HOSP-MPA',  // Amber Fehrs-Battey — US
  'PATH-US-002': 'HOSP-HFHS',  // J. Mark Tuthill
  'PATH-RB-001': 'HOSP-RB',    // Rossana Babakhani
};

/** Read current user id from localStorage session */
function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? parsed?.userId ?? null;
  } catch {
    return null;
  }
}

/** Full reset — clears all mock data for all users */
function executeFullReset(): string[] {
  const cleared: string[] = [];
  const remove = (k: string) => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      cleared.push(k);
    }
  };

  VERSIONED_KEYS.forEach(remove);
  SETTINGS_KEYS.forEach(remove);
  CASE_KEYS.forEach(remove);
  FLAG_KEYS.forEach(remove);
  STATE_KEYS.forEach(remove);
  remove(SESSION_KEY);

  Object.keys(localStorage)
    .filter(k => k.startsWith(MOCK_PREFIX))
    .forEach(k => { localStorage.removeItem(k); cleared.push(k); });

  sessionStorage.clear();
  return cleared;
}

/**
 * Partial reset — removes only the current user's cases from the mock case
 * store, then forces a version bump so their cases re-seed from defaults.
 * Other users' work is preserved.
 */
function executeUserReset(userId: string): string[] {
  const cleared: string[] = [];
  const hospitalId = HOSPITAL_MAP[userId];

  // Load and filter the cases store
  const casesKey = `${MOCK_PREFIX}cases`;
  const raw = localStorage.getItem(casesKey);
  if (raw) {
    try {
      const cases = JSON.parse(raw);
      const filtered = cases.filter(
        (c: any) => c.originHospitalId !== hospitalId && c.hospitalId !== hospitalId
      );
      if (filtered.length !== cases.length) {
        localStorage.setItem(casesKey, JSON.stringify(filtered));
        cleared.push(`${casesKey} (removed ${cases.length - filtered.length} cases)`);
      }
    } catch {
      // If corrupt, remove the whole store — it will re-seed
      localStorage.removeItem(casesKey);
      cleared.push(casesKey);
    }
  }

  // Clear the cases version so the full seed re-runs on next load
  // (seed data is additive — it won't duplicate cases already present)
  localStorage.removeItem('pathscribe_mock_cases_version');
  cleared.push('pathscribe_mock_cases_version (version reset)');

  // Clear any user-specific session state
  sessionStorage.clear();
  cleared.push('sessionStorage');

  return cleared;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Mode    = 'full' | 'user';
type UIState = 'idle' | 'confirm-full' | 'confirm-user' | 'done';

interface ResetResult { mode: Mode; cleared: string[]; }

const DemoResetTab: React.FC = () => {
  const [uiState,    setUiState]    = useState<UIState>('idle');
  const [result,     setResult]     = useState<ResetResult | null>(null);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [countdown,  setCountdown]  = useState(3);

  useEffect(() => {
    setUserId(getCurrentUserId());
  }, []);

  // Countdown before redirect after reset
  useEffect(() => {
    if (uiState !== 'done') return;
    if (countdown <= 0) { window.location.href = '/worklist'; return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [uiState, countdown]);

  const handleFullReset = () => {
    const cleared = executeFullReset();
    setResult({ mode: 'full', cleared });
    setUiState('done');
  };

  const handleUserReset = () => {
    if (!userId) return;
    const cleared = executeUserReset(userId);
    setResult({ mode: 'user', cleared });
    setUiState('done');
    setCountdown(3);
  };

  const hospitalId = userId ? HOSPITAL_MAP[userId] : null;
  const hospitalLabel: Record<string, string> = {
    'HOSP-001': 'PathScribe Demo (Pete Nimmo)',
    'HOSP-MFT': 'Manchester Foundation Trust (Paul Carter)',
    'HOSP-MPA': 'Midwest Pathology Associates (Amber Fehrs-Battey)',
    'HOSP-HFHS': 'Henry Ford Health System (J. Mark Tuthill)',
    'HOSP-RB':    'PathScribe Review (Rossana Babakhani)',
  };

  // ── Confirmation dialogs ──────────────────────────────────────────────────
  const ConfirmDialog = ({
    title, description, warning, onConfirm, onCancel, confirmLabel, confirmColor,
  }: {
    title: string; description: string; warning: string;
    onConfirm: () => void; onCancel: () => void;
    confirmLabel: string; confirmColor: string;
  }) => (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" style={{
      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--ps-conf-border)',
      borderRadius: 8, padding: '20px 24px', marginTop: 16,
    }}>
      <h4 id="confirm-dialog-title" style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{title}</h4>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ps-conf-text-3)', lineHeight: 1.6 }}>
        {description}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
        ⚠ {warning}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="ps-conf-btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          onClick={onConfirm}
          className={confirmColor === '#dc2626' ? 'ps-btn-danger-solid' : 'ps-btn-primary'}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );

  // ── Done state ────────────────────────────────────────────────────────────
  if (uiState === 'done' && result) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 0' }}>
        <div className="ps-reset-success">
          <div className="ps-reset-success__title">
            ✓ {result.mode === 'full' ? 'Full reset complete' : 'Your data has been reset'}
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ps-conf-text-3)' }}>
            {result.cleared.length} item{result.cleared.length !== 1 ? 's' : ''} cleared.
            Redirecting to Worklist in {countdown}s…
          </p>
          <div style={{ fontSize: 11, color: 'var(--ps-conf-text-3)', fontFamily: 'monospace', lineHeight: 1.8 }}>
            {result.cleared.map(k => <div key={k}>✓ {k}</div>)}
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 0' }}>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700 }}>Demo Data Reset</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ps-conf-text-3)', lineHeight: 1.6 }}>
          Restore mock data to a clean baseline without requiring developer access.
          Choose between resetting only your data or performing a full system reset.
        </p>
      </div>

      {/* ── Option 1: My data only ── */}
      <div className="comp-reset-card comp-reset-card--user">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div className="comp-reset-card-title">
              Reset my data only
            </div>
            <div className="comp-reset-card-desc">
              Removes your cases and restores your seed data. Other testers' work is preserved.
            </div>
            {hospitalId && (
              <div className="comp-reset-hospital-label">
                Your hospital: {hospitalLabel[hospitalId] ?? hospitalId}
              </div>
            )}
          </div>
          <button
            className="ps-conf-btn-secondary"
            disabled={!userId || uiState === 'confirm-full'}
            onClick={() => { setUiState('confirm-user'); setCountdown(3); }}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Reset my data…
          </button>
        </div>

        {uiState === 'confirm-user' && (
          <ConfirmDialog
            title="Reset your data?"
            description={`This will remove all cases for ${hospitalLabel[hospitalId ?? ''] ?? 'your hospital'} and restore them to the demo seed. Your flag configurations are not affected.`}
            warning="This cannot be undone. The page will reload automatically."
            confirmLabel="Yes, reset my data"
            confirmColor="#0891B2"
            onConfirm={handleUserReset}
            onCancel={() => setUiState('idle')}
          />
        )}
      </div>

      {/* ── Option 2: Full reset ── */}
      <div className="comp-reset-card comp-reset-card--full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div className="comp-reset-card-title">
              Full reset
            </div>
            <div className="comp-reset-card-desc">
              Clears all mock data for all users — cases, flags, messages, session, and UI state.
              Use this to restore a completely clean baseline before a new testing session.
            </div>
            <div className="comp-reset-card-warning">
              Affects all testers. Use sparingly.
            </div>
          </div>
          <button
            disabled={uiState === 'confirm-user'}
            onClick={() => setUiState('confirm-full')}
            style={{
              flexShrink: 0, whiteSpace: 'nowrap',
              padding: '8px 18px', fontSize: 13, fontWeight: 600,
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: 6, color: '#f87171', cursor: 'pointer',
              opacity: uiState === 'confirm-user' ? 0.4 : 1,
            }}
          >
            Full reset…
          </button>
        </div>

        {uiState === 'confirm-full' && (
          <ConfirmDialog
            title="Full reset — are you sure?"
            description="This will clear all mock data for every user including cases, flag configurations, messages, and sessions. All testers will lose their current state."
            warning="This affects Paul, Amber, and Sarah. All work in progress will be lost."
            confirmLabel="Yes, reset everything"
            confirmColor="#dc2626"
            onConfirm={handleFullReset}
            onCancel={() => setUiState('idle')}
          />
        )}
      </div>

    </div>
  );
};

export default DemoResetTab;
