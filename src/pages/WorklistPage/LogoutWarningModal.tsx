import React from 'react';

interface LogoutWarningModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onLogout: () => void;
}

const LogoutWarningModal: React.FC<LogoutWarningModalProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div style={{ width: '400px', backgroundColor: '#111', padding: '40px', borderRadius: '28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>Unsaved Data</h2>
        <p style={{ color: '#94a3b8', marginBottom: '30px', lineHeight: '1.6', fontSize: '15px' }}>
          You have an active session with unsaved changes. Logging out now will discard your current progress.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onClose}
            autoFocus
            style={{ padding: '16px 24px', borderRadius: '12px', background: '#0891B2', border: 'none', color: '#fff', fontWeight: 700, fontSize: '16px', cursor: 'pointer', width: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0E7490'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#0891B2'}
          >
            ← Return to Page
          </button>
          <button
            onClick={onLogout}
            style={{ padding: '16px 24px', borderRadius: '12px', background: 'transparent', border: '2px solid #F59E0B', color: '#F59E0B', fontWeight: 600, fontSize: '15px', cursor: 'pointer', width: '100%' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F59E0B'; }}
          >
            Log Out & Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutWarningModal;
