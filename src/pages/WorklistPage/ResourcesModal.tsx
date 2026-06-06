import React from 'react';

interface ResourcesModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  quickLinks: {
    protocols: { title: string; url: string }[];
    references: { title: string; url: string }[];
    systems: { title: string; url: string }[];
  };
}

const ResourcesModal: React.FC<ResourcesModalProps> = ({ isOpen, onClose, quickLinks }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        style={{ width: '400px', backgroundColor: '#111', borderRadius: '20px', padding: '40px', border: '1px solid rgba(8,145,178,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: '#0891B2', fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Quick Links
        </div>

        {/* Protocols */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Protocols</div>
          {quickLinks.protocols.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: '10px 16px', marginBottom: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#cbd5e1', fontSize: '14px', textDecoration: 'none' }}
            >{link.title}</a>
          ))}
        </div>

        {/* Guidelines */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>References</div>
          {quickLinks.references.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: '10px 16px', marginBottom: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#cbd5e1', fontSize: '14px', textDecoration: 'none' }}
            >{link.title}</a>
          ))}
        </div>

        {/* Systems */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Systems</div>
          {quickLinks.systems.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: '10px 16px', marginBottom: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#cbd5e1', fontSize: '14px', textDecoration: 'none' }}
            >{link.title}</a>
          ))}
        </div>

        <button onClick={onClose} style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ResourcesModal;
