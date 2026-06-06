// src/components/Config/System/CaseRoutingSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Configuration UI for automatic case pool routing.
// Controls how unassigned cases are distributed to subspecialty pools
// when the LIS does not provide an assignment.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import {
  RoutingConfig,
  getRoutingConfig,
  saveRoutingConfig,
  routeUnassignedCases,
  RoutingResult,
} from '../../../services/cases/caseRoutingService';
import { subspecialtyService } from '../../../services';
import { Subspecialty } from '../../../services/subspecialties/ISubspecialtyService';
import { mockCaseService } from '../../../services/cases/mockCaseService';

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 16,
};

const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 6, display: 'block',
};

const INPUT: React.CSSProperties = {
  padding: '9px 12px', fontSize: 13, color: '#e5e7eb',
  background: '#0f0f0f', border: '1px solid #374151',
  borderRadius: 7, outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }> = ({ value, onChange, label, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', flexShrink: 0, marginTop: 2, transition: 'background 0.2s', background: value ? '#22c55e' : '#374151', boxShadow: value ? '0 0 8px #22c55e55' : 'none' }}>
      <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: value ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{desc}</div>}
    </div>
    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: value ? '#22c55e' : '#4b5563', flexShrink: 0 }}>
      {value ? 'Enabled' : 'Disabled'}
    </span>
  </div>
);

// ─── Routing logic explainer ──────────────────────────────────────────────────

const RoutingDiagram: React.FC = () => (
  <div style={{ padding: '16px 20px', background: 'rgba(138,180,248,0.04)', border: '1px solid rgba(138,180,248,0.12)', borderRadius: 10, marginBottom: 20 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#8AB4F8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      How routing works
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { step: '1', label: 'Case arrives via HL7 or LIS', color: '#6b7280' },
        { step: '2', label: 'PathScribe checks for LIS assignment', color: '#6b7280' },
        { step: '3', label: 'Assignment found → assigned directly to pathologist', color: '#22c55e' },
        { step: '4', label: 'No assignment → match specimen type to subspecialty pool', color: '#f59e0b' },
        { step: '5', label: 'Match found → routed to subspecialty pool', color: '#22c55e' },
        { step: '6', label: 'No match → routed to fallback pool', color: '#f59e0b' },
        { step: '7', label: 'No fallback → flagged for manual assignment', color: '#f87171' },
      ].map(({ step, label, color }) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>{step}</span>
          <span style={{ fontSize: 12, color }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CaseRoutingSection: React.FC = () => {
  const [config,        setConfig]        = useState<RoutingConfig>(getRoutingConfig());
  const [pools,         setPools]         = useState<Subspecialty[]>([]);
  const [saved,         setSaved]         = useState(false);
  const [running,       setRunning]       = useState(false);
  const [runResults,    setRunResults]    = useState<{ routed: number; skipped: number; failed: number; results: { caseId: string; result: RoutingResult }[] } | null>(null);

  useEffect(() => {
    subspecialtyService.getAll().then(res => {
      if (res.ok) {
        // Show all active subspecialties — admins can mark any as a routing destination
        setPools(res.data.filter((s: Subspecialty) => s.active));
      }
    });
  }, []);

  const handleSave = () => {
    saveRoutingConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResults(null);
    try {
      const cases = await mockCaseService.listCasesForUser('all');
      const results = await routeUnassignedCases(cases);
      setRunResults(results);
    } finally {
      setRunning(false);
    }
  };

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

  return (
    <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Case Routing</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Configure how unassigned cases are automatically distributed to subspecialty pools
          when the LIS does not provide a pathologist assignment.
        </p>
      </div>

      <RoutingDiagram />

      {/* Master toggle */}
      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 16 }}>Routing Settings</div>
        <Toggle
          value={config.enabled}
          onChange={v => setConfig(c => ({ ...c, enabled: v }))}
          label="Automatic Pool Routing"
          desc="When enabled, cases without a LIS assignment are automatically routed to the appropriate subspecialty pool based on specimen type."
        />
        <Toggle
          value={config.statRoutesImmediately}
          onChange={v => setConfig(c => ({ ...c, statRoutesImmediately: v }))}
          label="STAT Cases Route Immediately"
          desc="STAT priority cases bypass the assignment timeout and are routed to a pool as soon as they arrive, without waiting for a LIS assignment."
        />
      </div>

      {/* Timeout */}
      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 16 }}>Assignment Timeout</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL}>Wait for LIS assignment (seconds)</label>
            <input
              type="number" min={0} max={3600}
              value={config.assignmentTimeoutSec}
              onChange={e => setConfig(c => ({ ...c, assignmentTimeoutSec: parseInt(e.target.value) || 0 }))}
              style={INPUT}
            />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
              How long PathScribe waits for the LIS to provide an assignment before routing to a pool.
              Set to 0 to route immediately. Recommended: 300 (5 minutes) for routine, 0 for STAT.
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingBottom: 28 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              = {Math.floor(config.assignmentTimeoutSec / 60)}m {config.assignmentTimeoutSec % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* Fallback pool */}
      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>Fallback Pool</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          Cases where no subspecialty match is found are sent here. Typically a "General Pathology" pool.
        </div>

        {pools.length === 0 ? (
          <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 13, color: '#fbbf24' }}>
            ⚠ No active pools found. Go to <strong>System → Subspecialties</strong> and enable "Pool / Workgroup" mode on at least one subspecialty.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={LABEL}>Fallback Pool</label>
              <select
                value={config.fallbackPoolId}
                onChange={e => {
                  const pool = pools.find(p => p.id === e.target.value);
                  setConfig(c => ({ ...c, fallbackPoolId: e.target.value, fallbackPoolName: pool?.name ?? e.target.value }));
                }}
                style={{ ...INPUT, appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32, cursor: 'pointer' }}
              >
                <option value="">— None (manual assignment required) —</option>
                {pools.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* HL7 segment → participation type mapping */}
      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>HL7 Segment Mapping</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          Maps standard HL7 physician segments to PathScribe participation types.
          These are applied automatically when a case arrives via HL7.
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['HL7 Segment', 'Field', 'Participation Type', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { segment: 'PV1',  field: '7',  type: 'Primary Pathologist',  notes: 'Attending doctor — primary owner' },
                { segment: 'PV1',  field: '8',  type: 'Ordering Clinician',   notes: 'Referring doctor' },
                { segment: 'PV1',  field: '9',  type: 'Consultant',           notes: 'Consulting doctor' },
                { segment: 'PV1',  field: '17', type: 'Primary Pathologist',  notes: 'Admitting doctor — fallback attending' },
                { segment: 'ORC',  field: '12', type: 'Ordering Clinician',   notes: 'Ordering provider' },
                { segment: 'OBR',  field: '16', type: 'Ordering Clinician',   notes: 'Ordering provider (repeated)' },
                { segment: 'OBR',  field: '28', type: 'Observer',             notes: 'Result copies to — view only' },
              ].map((row, i, arr) => (
                <tr key={row.segment + row.field}
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#8AB4F8' }}>{row.segment}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{row.field}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#e5e7eb' }}>{row.type}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#4b5563' }}>
          Custom participation types cannot be auto-assigned via HL7 — they must be added manually to the case team.
        </div>
      </div>

      {/* Run routing now */}
      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>Manual Routing Run</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          Immediately route all unassigned cases to their appropriate pools.
          Useful after changing routing configuration or when recovering from a LIS outage.
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, background: running ? '#1f2937' : 'rgba(138,180,248,0.15)', border: '1px solid rgba(138,180,248,0.3)', borderRadius: 8, color: running ? '#6b7280' : '#8AB4F8', cursor: running ? 'wait' : 'pointer' }}
        >
          {running ? '⏳ Running…' : '▶ Route Unassigned Cases Now'}
        </button>

        {runResults && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{runResults.routed}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Routed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#6b7280' }}>{runResults.skipped}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Skipped</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171' }}>{runResults.failed}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Failed</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {runResults.results.map(({ caseId, result }) => (
                <div key={caseId} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ color: result.outcome.startsWith('routed') ? '#22c55e' : '#f87171', flexShrink: 0 }}>
                    {result.outcome.startsWith('routed') ? '✓' : '—'}
                  </span>
                  <span style={{ color: '#9ca3af', fontFamily: 'monospace', flexShrink: 0 }}>{caseId}</span>
                  <span style={{ color: '#6b7280' }}>{result.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={handleSave}
          style={{ padding: '10px 28px', fontSize: 13, fontWeight: 700, background: saved ? 'rgba(34,197,94,0.15)' : '#8AB4F8', border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none', borderRadius: 8, color: saved ? '#22c55e' : '#0d1117', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {saved ? '✓ Saved' : 'Save Routing Config'}
        </button>
      </div>
    </div>
  );
};

export default CaseRoutingSection;
