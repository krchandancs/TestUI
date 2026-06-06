/**
 * Protocols/index.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrator for the Synoptic Library tab in ConfigurationPage.
 *
 * Renders a sidebar nav + one of three section components.
 * Reads ?section= from the URL on mount so that navigating back from
 * TemplateRenderer / SynopticEditor lands on the correct section rather
 * than always defaulting to Active Protocols.
 *
 * Sections:
 *   active  → ActiveProtocolsSection   (published templates in use)
 *   review  → ReviewQueueSection       (in_review | needs_changes | approved)
 *   all     → AllProtocolsSection      (full library, filterable)
 *
 * Consumed by:
 *   ConfigurationPage.tsx  when tab === 'protocols'
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import '../../../pathscribe.css';
import { useSearchParams } from 'react-router-dom';
import ActiveProtocolsSection from './ActiveProtocolsSection';
import ReviewQueueSection     from './ReviewQueueSection';
import AllProtocolsSection    from './AllProtocolsSection';

type Section = 'active' | 'review' | 'all';

const NAV_ITEMS: { id: Section; icon: string; label: string; sub: string }[] = [
  { id: 'active', icon: '✅', label: 'Active Protocols', sub: 'Validated, in-use checklists' },
  { id: 'review', icon: '📋', label: 'Review Queue',     sub: 'Staged for approval' },
  { id: 'all',    icon: '🗂',  label: 'All Protocols',   sub: 'Complete library' },
];

const ProtocolsTab: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Honour ?section= so back-navigation from editor/reviewer lands correctly.
  // Falls back to 'active' if the param is absent or unrecognised.
  const rawSection = searchParams.get('section') as Section | null;
  const activeSection: Section = ['active', 'review', 'all'].includes(rawSection ?? '')
    ? (rawSection as Section)
    : 'active';

  const setSection = (s: Section) => {
    setSearchParams(prev => {
      prev.set('section', s);
      return prev;
    }, { replace: true });
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: '210px', flexShrink: 0,
        paddingRight: '10px',
        borderRight: '1px solid #1e293b',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeSection === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                background:   isActive ? 'rgba(8,145,178,0.12)' : 'transparent',
                border:       `1px solid ${isActive ? 'rgba(8,145,178,0.25)' : 'transparent'}`,
                transition:   'all 0.12s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: isActive ? '#0891B2' : '#94a3b8',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>{item.icon}</span>
                {item.label}
              </div>
              <div style={{
                fontSize: '11px',
                color: isActive ? '#64748b' : '#475569',
                marginTop: '2px', paddingLeft: '24px',
              }}>
                {item.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: '20px 24px', boxSizing: 'border-box', background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.18)', borderRadius: '12px' }}>
        {activeSection === 'active' && <ActiveProtocolsSection />}
        {activeSection === 'review' && <ReviewQueueSection />}
        {activeSection === 'all'    && <AllProtocolsSection />}
      </div>

    </div>
  );
};

export default ProtocolsTab;
