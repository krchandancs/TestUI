// src/pages/SynopticReportPage/components/LeftReportPanel.tsx
import React, { useEffect } from 'react';
import type { Case } from '@/types/case/Case';
import { useAuth } from '@/contexts/AuthContext';
import InternalNotesDrawer from '@/components/InternalNotes/InternalNotesDrawer';
import { internalNoteService } from '@/services';

interface LeftReportPanelProps {
  caseData: Case | null;
  highlightText?: string;
}

// Splits text and wraps matching substring in a highlight mark.
// The ref callback fires whenever the mark mounts so we can scroll to it.
const HighlightedText: React.FC<{
  text: string;
  highlight?: string;
  onMarkMount?: (el: HTMLElement | null) => void;
}> = ({ text, highlight, onMarkMount }) => {
  if (!highlight || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        ref={onMarkMount}
        style={{
          background: 'rgba(251,191,36,0.45)',
          color: '#fde68a',
          borderRadius: 3,
          padding: '1px 4px',
          boxShadow: '0 0 0 2px rgba(251,191,36,0.5)',
          animation: 'ps-highlight-pop 0.5s ease',
        }}
      >
        {text.slice(idx, idx + highlight.length)}
      </mark>
      {text.slice(idx + highlight.length)}
    </>
  );
};

const LeftReportPanel: React.FC<LeftReportPanelProps> = ({ caseData, highlightText }) => {
  const { user } = useAuth();
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [unreadNoteCount, setUnreadNoteCount] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Count shared notes by other authors — proxy for "unread colleague notes"
  useEffect(() => {
    if (!caseData) return;
    const accession = caseData.accession?.fullAccession ?? caseData.accession?.accessionNumber ?? '';
    if (!accession) return;
    internalNoteService.getForCase(accession, user?.id ?? 'u1').then(result => {
      if (result.ok) {
        const count = result.data.filter(n => n.authorId !== (user?.id ?? 'u1') && n.visibility === 'shared').length;
        setUnreadNoteCount(count);
      }
    }).catch(() => {});
  }, [caseData, user?.id]);
  const markRef   = React.useRef<HTMLElement | null>(null);

  const sections = caseData ? [
    { title: 'CLINICAL HISTORY',     text: caseData.order?.clinicalIndication ?? '(not recorded)' },
    { title: 'GROSS DESCRIPTION',    text: caseData.diagnostic?.grossDescription ?? '(not recorded)' },
    { title: 'MICROSCOPIC FINDINGS', text: caseData.diagnostic?.microscopicDescription ?? '(not recorded)' },
    { title: 'ANCILLARY STUDIES',    text: caseData.diagnostic?.ancillaryStudies ?? '(not recorded)' },
  ] : [];

  // Extract the quoted phrase from source strings like 'Gross: "2.3 × 1.8 × 1.5 cm"'
  // Falls back to progressively shorter word sequences if the full phrase isn't found
  const matchPhrase = React.useMemo(() => {
    if (!highlightText) return undefined;
    const quoted = highlightText.match(/"([^"]+)"/);
    const candidate = quoted ? quoted[1] : highlightText;

    // Build a combined text to search across all sections
    // Try full phrase first, then drop words from the end until we find a match
    const words = candidate.split(/\s+/).filter(Boolean);
    for (let len = words.length; len >= 3; len--) {
      const phrase = words.slice(0, len).join(' ');
      // Check if this phrase appears in any section text (case-insensitive)
      const allText = [
        caseData?.order?.clinicalIndication ?? '',
        caseData?.diagnostic?.grossDescription ?? '',
        caseData?.diagnostic?.microscopicDescription ?? '',
        caseData?.diagnostic?.ancillaryStudies ?? '',
      ].join(' ').toLowerCase();
      if (allText.includes(phrase.toLowerCase())) return phrase;
    }
    // Fall back to the original candidate even if not found
    return candidate;
  }, [highlightText, caseData]);

  // Scroll the panel to bring the highlighted mark into view whenever it changes
  const handleMarkMount = React.useCallback((el: HTMLElement | null) => {
    markRef.current = el;
    if (el && scrollRef.current) {
      // Small delay so the DOM has settled before we measure
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#111827',
        borderRight: '1px solid rgba(8,145,178,0.3)',
        overflowY: 'auto',
        padding: '16px 32px 32px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes ps-highlight-pop {
          0%   { background: rgba(251,191,36,0.9); box-shadow: 0 0 0 4px rgba(251,191,36,0.7); }
          100% { background: rgba(251,191,36,0.45); box-shadow: 0 0 0 2px rgba(251,191,36,0.5); }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(8,145,178,0.4)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Full Patient Report
        </h3>
        {caseData && (
          <button
            onClick={() => setNotesOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)', borderRadius: '6px', color: '#0891B2', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.12)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Internal Notes
            {unreadNoteCount > 0 && (
              <span style={{ background: '#F59E0B', color: '#000', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {unreadNoteCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Internal Notes Drawer */}
      {notesOpen && caseData && (
        <InternalNotesDrawer
          accession={caseData.accession?.fullAccession ?? caseData.accession?.accessionNumber ?? caseData.id ?? ''}
          userId={user?.id ?? 'u1'}
          userName={user?.name ?? 'Unknown'}
          onClose={() => setNotesOpen(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: '6px', marginBottom: '16px', fontSize: '11px', color: '#38bdf8' }}>
        🔒 <span>Received from LIS — <strong>read-only</strong>.</span>
      </div>

      {!caseData ? (
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>No case loaded.</p>
      ) : (
        <>
          {/* Patient info grid */}
          <div style={{ background: 'rgba(8,145,178,0.06)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', border: '1px solid rgba(8,145,178,0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Accession', value: caseData.accession?.fullAccession ?? caseData.accession?.accessionNumber ?? '—', mono: true },
                { label: 'Patient',   value: caseData.patient ? `${caseData.patient.lastName}, ${caseData.patient.firstName}` : '—' },
                { label: 'DOB',       value: caseData.patient?.dateOfBirth ? new Date(caseData.patient.dateOfBirth).toLocaleDateString() : '—' },
                { label: 'MRN',       value: caseData.patient?.mrn ?? '—' },
                { label: 'Sex',       value: caseData.patient?.sex ?? '—' },
                { label: 'Priority',  value: caseData.order?.priority ?? '—' },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{label}</div>
                  <div style={{ color: '#e2e8f0', fontFamily: mono ? 'monospace' : undefined, fontSize: '13px', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Report sections */}
          {sections.map(s => (
            <div key={s.title} style={{ marginBottom: '28px', borderLeft: '3px solid rgba(8,145,178,0.4)', paddingLeft: '14px' }}>
              <h4 style={{
                fontSize: '11px', fontWeight: 800, color: '#0891B2',
                marginBottom: '10px', letterSpacing: '1px',
                textTransform: 'uppercase' as const,
              }}>
                {s.title}
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.75, margin: 0 }}>
                <HighlightedText text={s.text} highlight={matchPhrase} onMarkMount={handleMarkMount} />
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default LeftReportPanel;
