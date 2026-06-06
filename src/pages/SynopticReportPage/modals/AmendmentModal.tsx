import React from 'react';
import '../../../pathscribe.css';

interface AmendmentModalProps {
  show: boolean;
  overlayStyle?: React.CSSProperties;
  amendmentMode: 'amendment' | 'addendum';
  amendmentText: string;
  activeSynopticTitle: string;
  onModeChange: (mode: 'amendment' | 'addendum') => void;
  onTextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  triggeredBySynopticTitle?: string;
  prefillText?: string;
}

const AmendmentModal: React.FC<AmendmentModalProps> = ({
  show, amendmentMode, amendmentText, activeSynopticTitle,
  onModeChange, onTextChange, onClose, onSubmit,
  triggeredBySynopticTitle, prefillText,
}) => {
  React.useEffect(() => {
    if (show && prefillText && !amendmentText) onTextChange(prefillText);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  const isAmendment = amendmentMode === 'amendment';
  const canSubmit   = amendmentText.trim().length > 0;
  // Dynamic — depends on mode at runtime
  const accentColor = isAmendment ? '#d97706' : '#0891B2';

  return (
    <div data-capture-hide="true" className="ps-overlay" style={{ zIndex: 22000 }} onClick={onClose}>
      <div className="ps-modal-dark" onClick={e => e.stopPropagation()}>

        {!triggeredBySynopticTitle && (
          <div className="ps-amendment-mode-row">
            {(['amendment', 'addendum'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`ps-amendment-mode-btn${amendmentMode === mode ? ' active' : ''} ps-amendment-mode-btn--${mode}`}
              >
                {mode === 'amendment' ? '✏️ Amendment' : '📎 Addendum'}
              </button>
            ))}
          </div>
        )}

        {triggeredBySynopticTitle && (
          <div className="ps-amendment-deferred-banner">
            <span className="ps-amendment-deferred-icon">🧪</span>
            <div>
              <div className="ps-amendment-deferred-title">Deferred Synoptic Now Complete</div>
              <p className="ps-modal-dark-hint" style={{ margin: 0 }}>
                <strong style={{ color: '#e2e8f0' }}>{triggeredBySynopticTitle}</strong> was deferred at sign-out pending ancillary results.
                Review the pre-filled amendment text below, edit as needed, and actively submit to issue the amendment.
              </p>
            </div>
          </div>
        )}

        <div className="ps-modal-dark-header">
          <span className="ps-modal-dark-title">
            {isAmendment ? 'Amendment Request' : 'Addendum Request'}
          </span>
        </div>

        <p className="ps-modal-dark-body">
          {isAmendment
            ? 'An amendment is a corrective change to a finalized report. Describe the error and the correction required.'
            : 'An addendum is an official addition to a finalized report. Describe the reason for the addendum and any changes required.'
          }{' '}
          Applies to <strong style={{ color: '#e2e8f0' }}>{activeSynopticTitle}</strong>.
        </p>

        <textarea
          autoFocus
          value={amendmentText}
          onChange={e => onTextChange(e.target.value)}
          placeholder={
            isAmendment
              ? 'Describe the error and the required correction…'
              : 'Describe the reason for the addendum and any changes required…'
          }
          rows={6}
          className="ps-amendment-textarea"
        />

        <div className="ps-modal-dark-footer" style={{ justifyContent: 'stretch' }}>
          <button className="ps-btn-ghost-dark" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 14,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              background: canSubmit ? accentColor : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#fff' : '#475569',
              transition: 'background 0.15s',
            }}
          >
            {isAmendment ? '✏️ Submit Amendment' : '📎 Submit Addendum'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AmendmentModal;
