import React from 'react';
import '../../../pathscribe.css';
import type { MedicalCode } from '../synopticTypes';
import { SOURCE_META } from './codeConstants';
import { FieldVerification } from '../../Synoptic/synopticTypes';


// ─── CodeBadge ────────────────────────────────────────────────────────────────

const CodeBadge: React.FC<{
  code: MedicalCode;
  onRemove?: (id: string) => void;
  onVerify?: (id: string, verification: FieldVerification) => void;
  readOnly?: boolean;
}> = ({ code, onRemove, onVerify, readOnly }) => {
  const m = SOURCE_META[code.source];
  const isAi = code.source === 'ai';
  const vStatus = code.verification ?? 'unverified';
  const isHighConfidence = (code.confidence ?? 0) >= 85;

  // Confidence badge — collapses once verified or disputed (replaced by verification badge)
  const showConfidenceBadge = isAi && code.confidence !== undefined && vStatus === 'unverified';
  const confidenceBadge = showConfidenceBadge
    ? isHighConfidence
      ? { bg: '#86efac', color: '#14532d', icon: '✓' }
      : { bg: '#fde047', color: '#713f12', icon: '⚠' }
    : null;

  // Border + background — mirrors field verification states
  const borderColor = !isAi ? '#e2e8f0'
    : vStatus === 'verified'  ? '#86efac'
    : vStatus === 'disputed'  ? '#fca5a5'
    : '#e2e8f0';
  const bgColor = !isAi ? 'white'
    : vStatus === 'verified'  ? '#f0fdf4'
    : vStatus === 'disputed'  ? '#fef2f2'
    : 'white';

  const renderVerificationBadge = () => {
    if (!isAi) return null;
    if (vStatus === 'verified') return (
      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, background: '#bbf7d0', color: '#14532d', display: 'flex', alignItems: 'center', gap: '3px' }}>
        ✓ AI Confirmed
      </span>
    );
    if (vStatus === 'disputed') return (
      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, background: '#fecaca', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '3px' }}>
        ✎ Overridden
      </span>
    );
    // unverified — show confidence score
    return confidenceBadge ? (
      <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '8px', background: confidenceBadge.bg, color: confidenceBadge.color }}>
        {confidenceBadge.icon} {code.confidence}%
      </span>
    ) : null;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '10px 12px', borderRadius: '8px',
      background: bgColor, border: `1.5px solid ${borderColor}`,
      marginBottom: '6px', transition: 'background 0.15s, border-color 0.15s',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: code chip + source badge + verification badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#1e293b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>{code.code}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', background: m.bg, color: m.color }}>{m.label}</span>
          {!m.removable && <span style={{ fontSize: '10px', color: '#94a3b8' }}>🔒</span>}
          {renderVerificationBadge()}
        </div>

        {/* Display name */}
        <div style={{ fontSize: '13px', color: '#1e293b' }}>{code.display}</div>

        {/* AI source citation */}
        {isAi && code.aiSource && (
          <div style={{ fontSize: '10px', marginTop: '3px', fontStyle: 'italic', color: '#94a3b8' }}>
            AI source: {code.aiSource}
          </div>
        )}
      </div>

      {/* Action buttons — right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {/* Confirm / Override — AI codes only, not finalized */}
        {isAi && onVerify && !readOnly && (
          <>
            <button
              title="Confirm — AI assignment is correct"
              onClick={() => onVerify(code.id, vStatus === 'verified' ? 'unverified' : 'verified')}
              style={{
                height: '24px', padding: '0 8px', borderRadius: '12px', border: '1.5px solid',
                background: vStatus === 'verified' ? '#10B981' : 'white',
                borderColor: vStatus === 'verified' ? '#10B981' : '#d1d5db',
                color: vStatus === 'verified' ? 'white' : '#6b7280',
                cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '3px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (vStatus !== 'verified') { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}}
              onMouseLeave={e => { if (vStatus !== 'verified') { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}}
            >✓ Confirm</button>
            <button
              title="Override — AI assignment is incorrect"
              onClick={() => onVerify(code.id, vStatus === 'disputed' ? 'unverified' : 'disputed')}
              style={{
                height: '24px', padding: '0 8px', borderRadius: '12px', border: '1.5px solid',
                background: vStatus === 'disputed' ? '#ef4444' : 'white',
                borderColor: vStatus === 'disputed' ? '#ef4444' : '#d1d5db',
                color: vStatus === 'disputed' ? 'white' : '#6b7280',
                cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '3px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (vStatus !== 'disputed') { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}}
              onMouseLeave={e => { if (vStatus !== 'disputed') { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}}
            >✎ Override</button>
          </>
        )}
        {/* Remove button — removable codes only */}
        {m.removable && onRemove && !readOnly && (
          <button onClick={() => onRemove(code.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px', padding: '0 2px', lineHeight: 1 }} title="Remove">✕</button>
        )}
      </div>
    </div>
  );
};

// ─── AddCodeModal ─────────────────────────────────────────────────────────────
// Command-palette style: instant search, keyboard nav, SNOMED/ICD toggle,
// specimen strip at bottom. One view, no steps, no page turns.

export default CodeBadge;
