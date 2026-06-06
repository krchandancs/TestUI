/**
 * TerminologyServicesSection.tsx
 * src/components/Config/Terminology/TerminologyServicesSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * System config section for monitoring terminology service endpoints.
 *
 * Shows live health status for: SNOMED CT, ICD-10-CM, ICD-11, LOINC, ICD-O, CPT
 * Auto-runs health checks on mount and on demand via "Test All" button.
 *
 * Consumed by:
 *   components/Config/System/index.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../../../pathscribe.css';
import {
  testTerminologyEndpoints,
  TERMINOLOGY_CONFIG,
  type ServiceStatus,
  type TerminologyServiceStatus,
} from './terminologyConfig';

// ─── Toggle (matches GoverningBodiesSection design) ───────────────────────────

const Toggle: React.FC<{
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
  color?:    string;
}> = ({ checked, onChange, disabled = false, color = '#0891B2' }) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    style={{
      width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
      background:  checked ? color : '#334155',
      cursor:      disabled ? 'not-allowed' : 'pointer',
      opacity:     disabled ? 0.4 : 1,
      position:    'relative',
      transition:  'background 0.2s',
    }}
  >
    <div style={{
      position:     'absolute',
      top:          '3px',
      left:         checked ? '19px' : '3px',
      width:        '14px', height: '14px',
      borderRadius: '50%',
      background:   '#f1f5f9',
      transition:   'left 0.2s',
      boxShadow:    '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ServiceStatus, {
  bg: string; color: string; dot: string; label: string;
}> = {
  live:             { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', dot: '#10b981', label: 'Live'             },
  degraded:         { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', dot: '#f59e0b', label: 'Degraded'         },
  down:             { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', dot: '#ef4444', label: 'Down'             },
  not_configured:   { bg: 'rgba(100,116,139,0.1)', color: '#64748b', dot: '#475569', label: 'Not configured'   },
  license_required: { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', dot: '#fbbf24', label: 'License required' },
  checking:         { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', dot: '#334155', label: 'Checking…'        },
};

const StatusBadge: React.FC<{ status: ServiceStatus; latencyMs?: number }> = ({
  status,
  latencyMs,
}) => {
  const s = STATUS_STYLES[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '2px 8px', borderRadius: '20px',
        background: s.bg, fontSize: '11px', fontWeight: 700, color: s.color,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
        {s.label}
      </div>
      {latencyMs !== undefined && status === 'live' && (
        <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
          {latencyMs}ms
        </span>
      )}
    </div>
  );
};

// ─── Service definitions ──────────────────────────────────────────────────────

interface ServiceDef {
  key:         string;
  name:        string;
  description: string;
  source:      string;
  envVar?:     string;
  envValue?:   string;
  docsUrl?:    string;
}

const SERVICE_DEFS: ServiceDef[] = [
  {
    key:         'snomed',
    name:        'SNOMED CT',
    description: 'Morphology, anatomy, specimen, and organism concepts',
    source:      'NLM Clinical Tables (free)',
    envVar:      'VITE_NLM_BASE_URL',
    envValue:    TERMINOLOGY_CONFIG.nlm.baseUrl,
    docsUrl:     'https://clinicaltables.nlm.nih.gov/apidoc/snomed/v3/doc.html',
  },
  {
    key:         'icd10',
    name:        'ICD-10-CM',
    description: 'US diagnostic codes via NLM · Non-US variants (ICD-10-AM, ICD-10 WHO) require backend proxy',
    source:      'NLM Clinical Tables (free)',
    envVar:      'VITE_NLM_BASE_URL',
    envValue:    TERMINOLOGY_CONFIG.nlm.baseUrl,
    docsUrl:     'https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html',
  },
  {
    key:         'icd11',
    name:        'ICD-11',
    description: 'WHO ICD-11 codes — served directly by NLM, no OAuth required',
    source:      'NLM Clinical Tables (free)',
    envVar:      'VITE_NLM_BASE_URL',
    envValue:    TERMINOLOGY_CONFIG.nlm.baseUrl,
    docsUrl:     'https://clinicaltables.nlm.nih.gov/apidoc/icd11_codes/v3/doc.html',
  },
  {
    key:         'loinc',
    name:        'LOINC',
    description: 'Laboratory and clinical observation identifiers',
    source:      'NLM Clinical Tables (free)',
    envVar:      'VITE_NLM_BASE_URL',
    envValue:    TERMINOLOGY_CONFIG.nlm.baseUrl,
    docsUrl:     'https://clinicaltables.nlm.nih.gov/apidoc/loinc_items/v3/doc.html',
  },
  {
    key:         'icdo',
    name:        'ICD-O',
    description: 'Oncology morphology codes via SNOMED morphology subset',
    source:      'NLM Clinical Tables (free, SNOMED subset)',
    envVar:      'VITE_NLM_BASE_URL',
    envValue:    TERMINOLOGY_CONFIG.nlm.baseUrl,
    docsUrl:     'https://www.who.int/standards/classifications/other-classifications/international-classification-of-diseases-for-oncology',
  },
  {
    key:         'cpt',
    name:        'CPT',
    description: 'Procedure codes — AMA licensed, requires backend proxy',
    source:      'AMA (backend proxy required)',
    envVar:      'VITE_CPT_PROXY_URL',
    envValue:    TERMINOLOGY_CONFIG.cpt.proxyUrl,
    docsUrl:     'https://www.ama-assn.org/practice-management/cpt',
  },
];

// ─── Service row ──────────────────────────────────────────────────────────────

const ServiceRow: React.FC<{
  def:         ServiceDef;
  status:      TerminologyServiceStatus | undefined;
  showEnvVars: boolean;
}> = ({ def, status, showEnvVars }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '160px 1fr 170px',
    gap: '0 16px',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '6px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '9px',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.15s',
  }}>

    {/* Name + source */}
    <div>
      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
        {def.name}
      </div>
      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
        {def.source}
        {def.docsUrl && (
          <a
            href={def.docsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#334155', marginLeft: '6px', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0891B2')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >↗</a>
        )}
      </div>
    </div>

    {/* Description + env var + note */}
    <div>
      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
        {def.description}
      </div>
      {showEnvVars && def.envVar && (
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace', color: '#475569',
            background: 'rgba(255,255,255,0.04)', padding: '1px 6px',
            borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {def.envVar}
          </span>
          <span style={{ fontSize: '10px', color: '#334155' }}>→</span>
          <span style={{
            fontSize: '10px', fontFamily: 'monospace', color: '#64748b',
            maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {def.envValue}
          </span>
        </div>
      )}
      {status?.note && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
          {status.note}
        </div>
      )}
    </div>

    {/* Status badge */}
    <div>
      <StatusBadge
        status={status?.status ?? 'checking'}
        latencyMs={status?.latencyMs}
      />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const TerminologyServicesSection: React.FC<{ isSuperAdmin?: boolean }> = ({
  isSuperAdmin = false,
}) => {
  const [statuses,    setStatuses]    = useState<Record<string, TerminologyServiceStatus>>({});
  const [checking,    setChecking]    = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showEnvVars, setShowEnvVars] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);
    // Mark live services as checking while running
    setStatuses(prev => {
      const next = { ...prev };
      ['snomed', 'icd10', 'icd11', 'loinc', 'icdo'].forEach(k => {
        next[k] = { ...(next[k] ?? { name: k, status: 'checking' as ServiceStatus }), status: 'checking' as ServiceStatus };
      });
      return next;
    });
    const results = await testTerminologyEndpoints();
    setStatuses(results);
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  // Auto-run on mount
  useEffect(() => { runChecks(); }, [runChecks]);

  const allOperational = Object.values(statuses).every(
    s => s.status === 'live' || s.status === 'license_required'
  );

  return (
    <div>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
            Terminology Services
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Endpoint health for clinical coding systems used in code search and AI suggestions.
            {lastChecked && (
              <span style={{ color: '#475569' }}>
                {' '}· Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px', alignItems: 'center' }}>

          {/* Overall status */}
          {Object.keys(statuses).length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600,
              color: allOperational ? '#10b981' : '#f59e0b',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: allOperational ? '#10b981' : '#f59e0b',
              }} />
              {allOperational ? 'All systems operational' : 'Some services need attention'}
            </div>
          )}

          {/* Env vars toggle — super admin only */}
          {isSuperAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#475569' }}>Show env vars</span>
              <Toggle checked={showEnvVars} onChange={setShowEnvVars} color="#7c3aed" />
            </div>
          )}

          {/* Test button */}
          <button
            onClick={runChecks}
            disabled={checking}
            style={{
              padding: '7px 16px', borderRadius: '7px',
              border: '1px solid rgba(8,145,178,0.4)',
              background: checking ? 'rgba(8,145,178,0.05)' : 'rgba(8,145,178,0.15)',
              color: checking ? '#475569' : '#0891B2',
              fontSize: '12px', fontWeight: 600,
              cursor: checking ? 'wait' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {checking ? 'Testing…' : '↻ Test All'}
          </button>
        </div>
      </div>

      {/* ICD-10 variant callout */}
      <div style={{
        padding: '12px 16px', marginBottom: '20px', borderRadius: '9px',
        background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.2)',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>🌐</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '3px' }}>
            Region-Aware ICD-10 Variants
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            ICD-10-CM (US/CAP) is served directly by NLM at no cost.
            Non-US variants — ICD-10 WHO (RCPath/ICCR) and ICD-10-AM (RCPA) — require a
            backend proxy configured via{' '}
            <span style={{ fontFamily: 'monospace', color: '#475569' }}>VITE_ICD10_PROXY_URL</span>.
            The correct variant is automatically selected based on your active Governing Bodies.
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '160px 1fr 170px',
        gap: '0 16px', padding: '0 16px 8px', marginBottom: '4px',
      }}>
        {['Service', 'Details', 'Status'].map(h => (
          <div key={h} style={{
            fontSize: '10px', fontWeight: 700, color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{h}</div>
        ))}
      </div>

      {/* Service rows */}
      {SERVICE_DEFS.map(def => (
        <ServiceRow
          key={def.key}
          def={def}
          status={statuses[def.key]}
          showEnvVars={showEnvVars && isSuperAdmin}
        />
      ))}

      {/* CPT licensing callout */}
      <div style={{
        padding: '12px 16px', marginTop: '16px', borderRadius: '9px',
        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24', marginBottom: '3px' }}>
            CPT License Required Before Go-Live
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            CPT codes are AMA-licensed and cannot be served via a public API. Procure an{' '}
            <a href="https://www.ama-assn.org/practice-management/cpt" target="_blank"
              rel="noreferrer" style={{ color: '#0891B2' }}>AMA CPT data license</a>{' '}
            (~$3–10k/year depending on usage) and build a backend proxy at{' '}
            <span style={{ fontFamily: 'monospace', color: '#475569' }}>
              {TERMINOLOGY_CONFIG.cpt.proxyUrl}
            </span>.
            Both the pathologist professional component (26 modifier) and lab technical
            component (TC modifier) billing depend on this.
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 32 }} />

    </div>
  );
};

export default TerminologyServicesSection;
