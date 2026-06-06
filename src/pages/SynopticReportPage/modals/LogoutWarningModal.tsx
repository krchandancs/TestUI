import React from 'react';

interface LogoutWarningModalProps {
  show: boolean;
  overlayStyle?: React.CSSProperties;
  onCancel: () => void;
  onConfirm: () => void;
}

const LogoutWarningModal: React.FC<LogoutWarningModalProps> = ({
  show, onCancel, onConfirm,
}) => {
  if (!show) return null;

  return (
    <div data-capture-hide="true" className="ps-overlay" style={{ zIndex: 25000 }} onClick={onCancel}>
      <div className="ps-modal-dark" onClick={e => e.stopPropagation()}>

        <div className="ps-modal-dark-header">
          <svg width="32" height="30" viewBox="0 0 40 36" fill="none" style={{ flexShrink: 0 }}>
            <polygon points="20,2 38,34 2,34" fill="#f59e0b" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round" />
            <text x="20" y="29" textAnchor="middle" fontSize="17" fontWeight="900" fill="#1c1007" fontFamily="Arial, sans-serif">!</text>
          </svg>
          <span className="ps-modal-dark-title">Unsaved Data</span>
        </div>

        <p className="ps-modal-dark-body">
          You have unsaved changes. Logging out now will discard your edits.
        </p>

        <div className="ps-modal-dark-footer">
          <button className="ps-btn-ghost-dark" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            className="ps-btn-danger"
          >
            Logout Anyway
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoutWarningModal;
