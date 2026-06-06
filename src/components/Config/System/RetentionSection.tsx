/**
 * RetentionSection.tsx
 * Data retention policy — editable by administrators.
 * Persists to localStorage via 'pathscribe_retention_policy' key.
 * When SystemConfigContext adds retention fields, replace localStorage with context.
 */

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RetentionPolicy {
  aiSuggestionDays:     number;
  auditLogDays:         number;
  caseSnapshotYears:    number;
  reportArchiveYears:   number;
}

const DEFAULTS: RetentionPolicy = {
  aiSuggestionDays:   90,
  auditLogDays:       365,
  caseSnapshotYears:  7,
  reportArchiveYears: 10,
};

const STORAGE_KEY = 'pathscribe_retention_policy';

function load(): RetentionPolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
  marginBottom: '10px', gap: 16,
};
const labelStyle: React.CSSProperties  = { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 };
const noteStyle: React.CSSProperties   = { fontSize: 12, color: '#64748b', lineHeight: 1.4 };
const inputStyle: React.CSSProperties  = {
  width: 80, padding: '6px 10px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#f1f5f9',
  fontSize: 14, fontWeight: 700, textAlign: 'center' as const, outline: 'none',
  fontFamily: 'inherit',
};
const unitStyle: React.CSSProperties   = { fontSize: 12, color: '#64748b', marginLeft: 6, whiteSpace: 'nowrap' as const };

// ─── Editable row ─────────────────────────────────────────────────────────────
const Row: React.FC<{
  label: string; note: string; value: number; unit: string;
  min: number; max: number; onChange: (v: number) => void; dirty: boolean;
}> = ({ label, note, value, unit, min, max, onChange, dirty }) => (
  <div style={{ ...fieldStyle, borderColor: dirty ? 'rgba(8,145,178,0.4)' : 'rgba(255,255,255,0.08)' }}>
    <div style={{ flex: 1 }}>
      <div style={labelStyle}>{label}</div>
      <div style={noteStyle}>{note}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <input
        type="number" min={min} max={max} value={value}
        style={inputStyle}
        onChange={e => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min && n <= max) onChange(n);
        }}
      />
      <span style={unitStyle}>{unit}</span>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const RetentionSection: React.FC = () => {
  const [policy,  setPolicy]  = useState<RetentionPolicy>(load);
  const [saved,   setSaved]   = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const saved_policy = load(); // reference point for dirty detection

  const set = <K extends keyof RetentionPolicy>(key: K, value: number) => {
    setPolicy(p => ({ ...p, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setPolicy({ ...DEFAULTS });
    setDirty(true);
    setSaved(false);
  };

  return (
    <div style={{ padding: '4px 0', maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
          🗄️ Data Retention
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          How long PathScribe retains AI decisions, audit trails, and case data.
          Changes take effect at the next scheduled purge cycle. Consult your institution's
          data governance policy before reducing any retention period.
        </p>
      </div>

      {/* Editable fields */}
      <Row
        label="AI Suggestions" unit="days" min={30} max={730}
        note="AI-generated field suggestions and confidence scores retained per case"
        value={policy.aiSuggestionDays}
        onChange={v => set('aiSuggestionDays', v)}
        dirty={dirty && policy.aiSuggestionDays !== saved_policy.aiSuggestionDays}
      />
      <Row
        label="Audit Logs" unit="days" min={90} max={3650}
        note="All user actions, sign-outs, amendments, voice events, and system events"
        value={policy.auditLogDays}
        onChange={v => set('auditLogDays', v)}
        dirty={dirty && policy.auditLogDays !== saved_policy.auditLogDays}
      />
      <Row
        label="Case Snapshots" unit="years" min={1} max={30}
        note="Full case data captured at each finalisation and sign-out event"
        value={policy.caseSnapshotYears}
        onChange={v => set('caseSnapshotYears', v)}
        dirty={dirty && policy.caseSnapshotYears !== saved_policy.caseSnapshotYears}
      />
      <Row
        label="Report Archive" unit="years" min={1} max={30}
        note="Signed-out reports retained for medicolegal and pathology review purposes"
        value={policy.reportArchiveYears}
        onChange={v => set('reportArchiveYears', v)}
        dirty={dirty && policy.reportArchiveYears !== saved_policy.reportArchiveYears}
      />

      {/* Governance note */}
      <div style={{
        margin: '16px 0', padding: '10px 14px', borderRadius: 8,
        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
        fontSize: 12, color: '#a78bfa', lineHeight: 1.5,
      }}>
        🔒 Minimum audit log retention is 90 days. Reductions below regulatory minimums
        require sign-off from your institution's compliance officer.
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={!dirty}
          style={{
            padding: '9px 24px', borderRadius: 8, border: 'none',
            background: dirty ? '#22c55e' : 'rgba(255,255,255,0.05)',
            color: dirty ? '#022c22' : '#475569',
            fontWeight: 700, fontSize: 13, cursor: dirty ? 'pointer' : 'default',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '9px 20px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#64748b', fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          Reset to Defaults
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#34d399' }}>
            Retention policy updated — takes effect at next purge cycle.
          </span>
        )}
      </div>
    </div>
  );
};

export default RetentionSection;
