// src/components/TemplateBuilder/ReportTemplatesSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Wrapper rendered by ConfigurationPage when the "Report Templates" top-level
// tab is active.  Exposes a pill-style sub-tab toggle so that Part Library
// lives inside Report Templates rather than as a separate top-level tab.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import TemplateListTab from './TemplateListTab';
import PartLibraryTab  from './PartLibraryTab';

type SubTab = 'templates' | 'parts';

const ReportTemplatesSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('templates');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* ── Sub-tab pill toggle ── */}
      <div style={{
        display:    'flex',
        gap:        '3px',
        marginBottom: '20px',
        padding:    '3px',
        background: 'rgba(255, 255, 255, 0.03)',
        border:     '1px solid #1e293b',
        borderRadius: '8px',
        alignSelf:  'flex-start',
      }}>
        <button
          onClick={() => setSubTab('templates')}
          className={`ps-sub-tab-btn${subTab === 'templates' ? ' active' : ''}`}
        >
          Report Templates
        </button>
        <button
          onClick={() => setSubTab('parts')}
          className={`ps-sub-tab-btn${subTab === 'parts' ? ' active' : ''}`}
        >
          Part Library
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {subTab === 'templates' ? <TemplateListTab /> : <PartLibraryTab />}
      </div>

    </div>
  );
};


export default ReportTemplatesSection;
