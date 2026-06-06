/**
 * components/Config/Protocols/TerminologyAlertBanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders SNOMED CT / ICD deprecation alerts inline in SynopticEditor.
 * Also exports TerminologyAlertBadge for compact use in protocol cards.
 *
 * Drop-in path: src/components/Config/Protocols/TerminologyAlertBanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../../pathscribe.css';
import { TerminologyAlert } from '../../../hooks/useTerminologyAlerts';

// ─── Shared style tokens (matches SynopticEditor) ─────────────────────────────
const ERROR_COLOR   = '#f87171';
const ERROR_BG      = 'rgba(239,68,68,0.08)';
const ERROR_BORDER  = 'rgba(239,68,68,0.25)';
const WARN_COLOR    = '#fbbf24';
const WARN_BG       = 'rgba(245,158,11,0.08)';
const WARN_BORDER   = 'rgba(245,158,11,0.25)';

function alertStyles(severity: 'error' | 'warning') {
  return severity === 'error'
    ? { color: ERROR_COLOR, bg: ERROR_BG, border: ERROR_BORDER, icon: '🚫' }
    : { color: WARN_COLOR,  bg: WARN_BG,  border: WARN_BORDER,  icon: '⚠️' };
}

// ─── Individual alert row ─────────────────────────────────────────────────────

const AlertRow: React.FC<{
  alert:   TerminologyAlert;
  onDismiss: (id: string) => void;
}> = ({ alert, onDismiss }) => {
  const s = alertStyles(alert.severity);
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      padding: '10px 12px', borderRadius: '8px',
      background: s.bg, border: `1px solid ${s.border}`,
      marginBottom: '6px',
    }}>
      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: s.color, marginBottom: '2px' }}>
          {alert.system.toUpperCase()} {alert.code}
          {alert.fieldLabel && (
            <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
              — {alert.fieldLabel}
              {alert.optionLabel && ` › "${alert.optionLabel}"`}
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
          {alert.message}
        </div>
        {alert.replacements && alert.replacements.length > 0 && (
          <div style={{ marginTop: '5px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Suggested replacement{alert.replacements.length > 1 ? 's' : ''}:</span>
            {alert.replacements.map(r => (
              <span key={r.code} style={{
                fontSize: '10px', fontFamily: 'monospace', fontWeight: 700,
                padding: '1px 7px', borderRadius: '4px',
                background: 'rgba(16,185,129,0.12)', color: '#10B981',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                {r.code} — {r.display}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        title="Dismiss this alert"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#475569', fontSize: '14px', padding: '0 2px',
          lineHeight: 1, flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
      >
        ✕
      </button>
    </div>
  );
};

// ─── Full banner (for SynopticEditor) ─────────────────────────────────────────

export const TerminologyAlertBanner: React.FC<{
  alerts:    TerminologyAlert[];
  isLoading: boolean;
  onDismiss: (id: string) => void;
  onRevalidate: () => void;
}> = ({ alerts, isLoading, onDismiss, onRevalidate }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        padding: '10px 14px', marginBottom: '16px', borderRadius: '9px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        fontSize: '12px', color: '#64748b',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>🔍</span>
        Validating terminology codes…
      </div>
    );
  }

  if (alerts.length === 0) return null;

  const errorCount   = alerts.filter(a => a.severity === 'error').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const hasErrors    = errorCount > 0;

  return (
    <div style={{
      marginBottom: '16px', borderRadius: '10px',
      border: `1px solid ${hasErrors ? ERROR_BORDER : WARN_BORDER}`,
      background: hasErrors ? ERROR_BG : WARN_BG,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '15px' }}>{hasErrors ? '🚫' : '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: hasErrors ? ERROR_COLOR : WARN_COLOR }}>
            Terminology Alerts
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>
            {errorCount > 0   && `${errorCount} deprecated code${errorCount > 1 ? 's' : ''}`}
            {errorCount > 0 && warningCount > 0 && ' · '}
            {warningCount > 0 && `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRevalidate(); }}
          style={{
            padding: '3px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
            color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          ↻ Re-check
        </button>
        <span style={{
          fontSize: '12px', color: '#475569',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s', display: 'inline-block',
        }}>▾</span>
      </div>

      {/* Alert list */}
      {!collapsed && (
        <div style={{ padding: '0 14px 12px' }}>
          {alerts.map(alert => (
            <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Compact badge (for protocol cards in AllProtocolsSection) ────────────────

export const TerminologyAlertBadge: React.FC<{
  errorCount:   number;
  warningCount: number;
}> = ({ errorCount, warningCount }) => {
  if (errorCount === 0 && warningCount === 0) return null;
  const hasErrors = errorCount > 0;
  const s = alertStyles(hasErrors ? 'error' : 'warning');
  const label = hasErrors
    ? `${errorCount} deprecated code${errorCount > 1 ? 's' : ''}`
    : `${warningCount} terminology warning${warningCount > 1 ? 's' : ''}`;

  return (
    <span style={{
      fontSize: '10px', fontWeight: 700,
      padding: '2px 8px', borderRadius: '99px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.icon} {label}
    </span>
  );
};
