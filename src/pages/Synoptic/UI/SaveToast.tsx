import React from 'react';
import '../../../pathscribe.css';

const SaveToast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div style={{
    position: 'fixed', bottom: '90px', right: '40px', zIndex: 9999,
    background: '#1e293b', color: 'white', padding: '10px 18px',
    borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    pointerEvents: 'none',
    display: 'flex', alignItems: 'center', gap: '8px',
  }}>
    <span style={{ color: '#10B981' }}>✓</span> {message}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export { SaveToast };
