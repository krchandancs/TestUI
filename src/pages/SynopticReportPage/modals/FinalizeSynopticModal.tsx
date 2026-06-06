import React from 'react';
type SynopticReport = any;

interface FinalizeSynopticModalProps {
  show: boolean;
  overlayStyle?: React.CSSProperties;
  activeSynoptic: SynopticReport | null;
  finalizePassword: string;
  finalizeError: string;
  finalizeAndNext: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
}

const FinalizeSynopticModal: React.FC<FinalizeSynopticModalProps> = ({
  show, activeSynoptic, finalizePassword, finalizeError,
  finalizeAndNext, onClose, onPasswordChange, onConfirm,
}) => {
  if (!show) return null;

  return (
    <div data-capture-hide="true" className="ps-overlay" style={{ zIndex: 22000 }}>
      <div className="ps-modal-dark" style={{ textAlign: 'center', width: 'min(440px, 90vw)' }}>

        <div style={{ fontSize: 40, marginBottom: 4 }}>🔒</div>

        <div className="ps-modal-dark-header" style={{ justifyContent: 'center' }}>
          <span className="ps-modal-dark-title">
            Finalize {activeSynoptic?.title ?? 'Synoptic Report'}
          </span>
        </div>

        <p className="ps-modal-dark-body" style={{ textAlign: 'center' }}>
          Finalizing this report locks it for editing and creates an audit entry.
          <br />Enter your password to confirm.
        </p>

        <input
          type="password"
          autoFocus
          value={finalizePassword}
          onChange={e => onPasswordChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          placeholder="Your password"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
            boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.05)',
            border: `2px solid ${finalizeError ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
            color: '#e2e8f0',
          }}
        />

        {finalizeError && (
          <p style={{ color: '#ef4444', fontSize: 12, margin: '0', textAlign: 'left' }}>
            {finalizeError}
          </p>
        )}

        <div className="ps-modal-dark-footer" style={{ justifyContent: 'stretch' }}>
          <button className="ps-btn-ghost-dark" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0891B2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0E7490'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0891B2'; }}
          >
            🔒 Confirm &amp; Finalize{finalizeAndNext ? ' →' : ''}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FinalizeSynopticModal;
