import React from 'react';
import { useCasePreview } from '../../hooks/useCasePreview';
import { CasePreviewDrawer } from './CasePreviewDrawer';
import { useNavigate } from "react-router-dom";
import '../../pathscribe.css';

export interface SimilarCase {
  accession: string;
  diagnosis?: string;
  similarity: number;
  matchReason?: string;
}

interface CasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  mrn: string;
  patientHistory: string;
  similarCases: SimilarCase[];
  onRefineSearch: () => void;
}

// ── AI star mark — filled Unicode star in pathscribe teal ────────────────────
const AiStar = ({ size = 13 }: { size?: number }) => (
  <span style={{ color: '#0891B2', fontSize: `${size}px`, marginLeft: '5px', verticalAlign: 'middle', lineHeight: 1 }}>★</span>
);

const CasePanel: React.FC<CasePanelProps> = ({
  isOpen,
  onClose,
  patientName,
  mrn,
  patientHistory,
  similarCases,
  onRefineSearch,
}) => {
  const navigate = useNavigate();

  const {
    selectedCase,
    isOpen: drawerOpen,
    openPreview,
    closePreview,
  } = useCasePreview();

  if (!isOpen) return null;

  return (
    <>
      {/* Main panel */}
      <div
        data-capture-hide="true"
        className="ps-overlay"
        style={{ zIndex: 20000, backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="ps-research-modal"
          style={{ width: '980px', maxHeight: '85vh', minHeight: '560px' }}
        >
          {/* Header */}
          <div className="ps-research-header">
            <div>
              <div className="ps-research-eyebrow">Patient History</div>
              <div className="ps-research-title" style={{ display: 'block' }}>
                {patientName}
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '15px' }}> · MRN {mrn}</span>
              </div>
            </div>
            <button onClick={onClose} className="ps-research-close">✕</button>
          </div>

          {/* Body */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Left: Patient history */}
            <div className="ps-research-left">
              <div className="ps-research-label">Prior Pathology</div>
              <div className="ps-research-body" style={{ whiteSpace: 'pre-wrap' }}>
                {patientHistory || (
                  <span style={{ color: '#334155', fontStyle: 'italic' }}>No patient history available.</span>
                )}
              </div>
            </div>

            {/* Right: AI Matched Cases */}
            <div className="ps-research-right" style={{ minHeight: '420px' }}>
              {/* Section title */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#cbd5f5', margin: 0 }}>
                  AI Matched Cases<AiStar size={14} />
                </h3>
                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                  {similarCases.length} result{similarCases.length !== 1 ? 's' : ''}
                </span>
              </div>

              {similarCases.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#475569', padding: '24px', borderRadius: '10px', border: '1px dashed rgba(51,65,85,0.8)', textAlign: 'center' }}>
                  No matched cases found for the current context.
                </div>
              ) : (
                similarCases.map((sc) => {
                  const pct = Math.round(sc.similarity * 100);
                  const barColor = pct >= 80 ? '#0ea5e9' : pct >= 60 ? '#0891B2' : '#334155';

                  return (
                    <button
                      key={sc.accession}
                      onClick={() => openPreview(sc)}
                      className="ps-card-dark"
                      style={{ width: '100%', textAlign: 'left', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }} data-phi="accession">
                          {sc.accession}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {pct}% match
                        </span>
                      </div>

                      {sc.diagnosis && (
                        <div style={{ fontSize: '12px', color: '#cbd5f5', lineHeight: 1.4 }}>
                          {sc.diagnosis}
                        </div>
                      )}

                      {sc.matchReason && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Matched on: {sc.matchReason}
                        </div>
                      )}

                      <div className="ps-similarity-bar">
                        <div className="ps-similarity-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(30,41,59,0.9)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(15,23,42,0.98)', flexShrink: 0 }}>
            <button
              onClick={onRefineSearch}
              style={{
                }}
              className="ps-btn-pill"
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#38bdf8'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#0ea5e9'}
            >
              Refine search <AiStar size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Drawer */}
      <CasePreviewDrawer
        report={selectedCase}
        isOpen={drawerOpen}
        onClose={closePreview}
        onOpenFull={() => {
          navigate(`/report/${selectedCase?.accession}`);
        }}
      />
    </>
  );
};

export default CasePanel;
