import React from 'react';
import '../../../pathscribe.css';

interface CaseSignOutModalProps {
  show: boolean;
  overlayStyle?: React.CSSProperties;
  accession: string;
  signOutUser: string;
  signOutPassword: string;
  signOutError: string;
  onClose: () => void;
  onUserChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
}

const CaseSignOutModal: React.FC<CaseSignOutModalProps> = ({
  show, accession, signOutUser, signOutPassword, signOutError,
  onClose, onUserChange, onPasswordChange, onConfirm,
}) => {
  if (!show) return null;

  return (
    <div data-capture-hide="true" className="ps-overlay" style={{ zIndex: 22000 }}>
      <div className="ps-modal-dark" style={{ textAlign: 'center', width: 'min(480px, 90vw)' }}>

        <div className="ps-modal-dark-emoji">✍️</div>

        <div className="ps-modal-dark-header" style={{ justifyContent: 'center' }}>
          <span className="ps-modal-dark-title">Sign Out Case</span>
        </div>

        <p className="ps-modal-dark-body" style={{ textAlign: 'center' }}>
          All synoptic reports for <strong data-phi="accession">Case {accession}</strong> have been finalized.
        </p>
        <p className="ps-modal-dark-hint" style={{ textAlign: 'center' }}>
          Enter your username and password to sign out this case from PathScribe.
        </p>

        <div className="ps-modal-dark-fields">
          <div>
            <label className="ps-modal-dark-label">Username</label>
            <input
              type="text"
              autoFocus
              value={signOutUser}
              onChange={e => onUserChange(e.target.value)}
              placeholder="Your username"
              className={`ps-modal-dark-input${signOutError ? ' ps-modal-dark-input--error' : ''}`}
            />
          </div>
          <div>
            <label className="ps-modal-dark-label">Password</label>
            <input
              type="password"
              value={signOutPassword}
              onChange={e => onPasswordChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onConfirm()}
              placeholder="Your password"
              className={`ps-modal-dark-input${signOutError ? ' ps-modal-dark-input--error' : ''}`}
            />
          </div>
          {signOutError && <p className="ps-modal-dark-field-error">{signOutError}</p>}
        </div>

        <div className="ps-modal-dark-footer" style={{ justifyContent: 'stretch' }}>
          <button className="ps-btn-ghost-dark" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button onClick={onConfirm} className="ps-btn-green" style={{ flex: 1 }}>✍️ Sign Out Case</button>
        </div>

      </div>
    </div>
  );
};

export default CaseSignOutModal;
