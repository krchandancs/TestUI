import React from 'react';

// Stylized MedFromix AI Logo
const MedFromixLogo = () => (
  <svg width="180" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#0891B2" />
    <path d="M10 16H22M16 10V22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <text x="42" y="25" fill="white" style={{ font: 'bold 20px sans-serif' }}>MedFromix</text>
    <text x="155" y="25" fill="#0891B2" style={{ font: '300 20px sans-serif' }}>AI</text>
  </svg>
);

const VoiceReference: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', padding: '40px' }}>
      <header style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <MedFromixLogo />
        <span style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>VOICE CONTROL v2.0</span>
      </header>

      <main style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Pathology Command Cheat Sheet</h1>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <DocSection title="Core Commands">
            <DocItem cmd="Literal [word]" note="Forces raw text without AI processing." />
            <DocItem cmd="Open Cheat Sheet" note="Returns to this view immediately." />
          </DocSection>

          <DocSection title="Grossing & Measurements">
            <DocItem cmd="[Num] by [Num]" note="Formats as pathology dimensions (3 x 2 x 1)." />
            <DocItem cmd="Percent" note="Converts to symbol: 'Five percent' → 5%." />
          </DocSection>
        </div>
      </main>
    </div>
  );
};

const DocSection = ({ title, children }: any) => (
  <section style={{ marginBottom: '20px' }}>
    <h2 style={{ fontSize: '14px', color: '#0891B2', textTransform: 'uppercase', marginBottom: '12px' }}>{title}</h2>
    <div style={{ display: 'grid', gap: '8px' }}>{children}</div>
  </section>
);

const DocItem = ({ cmd, note }: any) => (
  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
    <code style={{ color: '#38bdf8', fontSize: '15px' }}>"{cmd}"</code>
    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>{note}</p>
  </div>
);

export default VoiceReference;
