// src/components/UI/ConfirmModal.tsx
// Reusable dark confirmation dialog — replaces window.confirm() throughout the app.

import React from 'react';
import '@/pathscribe.css';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  overlayStyle?: React.CSSProperties;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  overlayStyle,
}) => {
  if (!show) return null;

  return (
    <div className="ps-overlay" style={{ zIndex: 30000, ...overlayStyle }}>
      <div className="ps-modal-dark ps-modal-sm">
        {title && <span className="ps-modal-dark-title" style={{ display: 'block', marginBottom: 10 }}>{title}</span>}
        <p className="ps-modal-dark-body" style={{ marginBottom: 24 }}>{message}</p>
        <div className="ps-modal-dark-footer">
          <button type="button" className="ps-btn-ghost-dark" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="ps-btn-amber" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
