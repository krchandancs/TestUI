import React from 'react';
import { useState } from 'react';
import '../../../pathscribe.css';

const ConfidenceBadge: React.FC<{
  confidence: number;
  isHigh: boolean;
  aiSource?: string;
}> = ({ confidence, isHigh, aiSource }) => {
  const [show, setShow] = useState(false);
  const badge = isHigh
    ? { bg: '#86efac', color: '#14532d', accent: '#86efac' }
    : { bg: '#fde047', color: '#713f12', accent: '#fde047' };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', fontWeight: 600, background: badge.bg, color: badge.color, cursor: 'help' }}>
        {isHigh ? '✓' : '⚠'} {confidence}%
      </span>
      {show && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 200,
          width: '240px', background: '#1e293b', color: 'white', borderRadius: '8px',
          padding: '10px 12px', fontSize: '11px', lineHeight: 1.5,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: badge.accent }}>
            AI Confidence: {confidence}%
          </div>
          {aiSource && (
            <div style={{ marginBottom: '4px', color: '#94a3b8' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Source:</span> {aiSource}
            </div>
          )}
          <div style={{ color: '#94a3b8' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Alert threshold:</span> below 75% triggers a warning
          </div>
        </div>
      )}
    </span>
  );
};

// ─── ReportPreviewModal ───────────────────────────────────────────────────────
// Renders a read-only formatted pathology report structured like an actual
// delivered CAP surgical pathology report:
//
//   Letterhead + Patient block
//   DIAGNOSIS SUMMARY  ← one line per specimen (clinician reads first)
//   ── SPECIMEN A ──────────────────────────────────
//     Primary synoptic (Tumor / Margins / IHC)
//       ↳ Child synoptic (ER/PR)
//       ↳ Child synoptic (HER2)
//     Diagnostic codes
//     Specimen comment
//   ── SPECIMEN B ──  (etc.)
//   Case comment
//   Signature block
//
// Navigation: sticky left rail lists all specimens + synoptics for fast jumping
// on multi-specimen cases. Each specimen uses the standard CAP letter convention
// (A, B, C…). Child synoptics are indented under their parent — NOT flattened.

export { ConfidenceBadge };
