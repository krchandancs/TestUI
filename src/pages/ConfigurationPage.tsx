/**
 * ConfigurationPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level configuration page, accessible from the Home screen nav tile.
 * Voice context: CONFIGURATION — tab navigation commands active while here.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuditLog } from '../components/Audit/useAuditLog';
import { mockActionRegistryService } from '../services/actionRegistry/mockActionRegistryService';
import { VOICE_CONTEXT } from '../constants/systemActions';
import AITab         from '../components/Config/AI/index';
import ModelsTab     from '../components/Config/Models/index';
import ProtocolsTab  from '../components/Config/Protocols/index';
import StaffTab      from '../components/Config/Staff/StaffTab';
import SystemTab     from '../components/Config/System/index';
import MacrosTab     from '../components/Config/Macros/index';
import VoiceSettings from '../components/Voice/VoiceSettings';
import { ActionsTab }  from '../components/Config/Actions/ActionsTab';
import DemoResetTab    from '../components/Config/System/DemoResetTab';
import ReportTemplatesSection from '../components/TemplateBuilder/ReportTemplatesSection';

const VALID_TABS = ['ai', 'protocols', 'staff', 'voice', 'system', 'actions', 'macros', 'templates', 'demo'] as const;
type TabId = typeof VALID_TABS[number];

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: 'ai',        label: 'AI Behavior'        },
  { id: 'protocols', label: 'Synoptic Library'   },
  { id: 'staff',     label: 'Staff'              },
  { id: 'voice',     label: 'Voice'              },
  { id: 'system',    label: 'System'             },
  { id: 'actions',   label: 'Action Registry'    },
  { id: 'macros',    label: 'Macros'             },
  { id: 'templates', label: 'Report Templates'   },
  { id: 'demo',      label: '⟳ Demo Reset'       },
];

function getTabFromSearch(search: string): TabId {
  const t = new URLSearchParams(search).get('tab') as TabId | null;
  return t && (VALID_TABS as readonly string[]).includes(t) ? t : 'ai';
}

const ConfigurationPage: React.FC = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { log }    = useAuditLog();

  const [activeTab,   setActiveTab]   = useState<TabId>(() => getTabFromSearch(location.search));
  const [isLoaded,    setIsLoaded]    = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => { setActiveTab(getTabFromSearch(location.search)); }, [location.search]);
  useEffect(() => { const t = setTimeout(() => setIsLoaded(true), 100); return () => clearTimeout(t); }, []);

  // ── Voice: set context on mount ─────────────────────────────────────────────
  useEffect(() => {
    mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.CONFIGURATION);
    return () => mockActionRegistryService.setCurrentContext(VOICE_CONTEXT.WORKLIST);
  }, []);

  // ── Voice: tab navigation listeners ────────────────────────────────────────
  useEffect(() => {
    const tabIds = VALID_TABS as readonly TabId[];

    const nextTab = () => {
      setActiveTab(current => {
        const idx = tabIds.indexOf(current);
        const next = tabIds[Math.min(idx + 1, tabIds.length - 1)];
        navigate(`/configuration?tab=${next}`);
        log('navigate_tab', { tabId: next });
        return next;
      });
    };

    const prevTab = () => {
      setActiveTab(current => {
        const idx = tabIds.indexOf(current);
        const prev = tabIds[Math.max(idx - 1, 0)];
        navigate(`/configuration?tab=${prev}`);
        log('navigate_tab', { tabId: prev });
        return prev;
      });
    };

    window.addEventListener('PATHSCRIBE_NEXT_TAB',     nextTab);
    window.addEventListener('PATHSCRIBE_PREVIOUS_TAB', prevTab);
    return () => {
      window.removeEventListener('PATHSCRIBE_NEXT_TAB',     nextTab);
      window.removeEventListener('PATHSCRIBE_PREVIOUS_TAB', prevTab);
    };
  }, [navigate, log]);

  const handleTabChange = (tabId: TabId) => {
    navigate(`/configuration?tab=${tabId}`);
    log('navigate_tab', { tabId });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'ai':        return <AITab ModelsPanel={ModelsTab} />;
      case 'protocols': return <ProtocolsTab />;
      case 'staff':     return <StaffTab />;
      case 'system':    return <SystemTab />;
      case 'actions':   return <ActionsTab />;
      case 'macros':    return <MacrosTab />;
      case 'voice':     return <VoiceSettings />;
      case 'templates': return <ReportTemplatesSection />;
      case 'demo':      return <DemoResetTab />;
      default:          return null;
    }
  };

  if (!isLoaded) return <div style={{ padding: '24px', color: '#e2e8f0' }}>Loading configuration…</div>;

  return (
    <div style={{
      height:        '100%',
      width:         '100%',
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
      color:         '#f1f5f9',
    }}>

      {/* ── Header + Tab bar — full width, never scrolls ── */}
      <div style={{
        width:      '100%',
        padding:    '32px 40px 0',
        boxSizing:  'border-box',
        flexShrink: 0,
      }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>Configuration</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Control AI behavior, templates, users, and system settings</p>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '0', borderBottom: '1px solid #1e293b' }}>
          {TAB_LABELS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#94a3b8'; }}
              style={{
                padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: '13px', whiteSpace: 'nowrap' as const,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color:      activeTab === tab.id ? '#0891b2' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #0891b2' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content — FULL WIDTH so scrollbar lands at viewport edge ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', width: '100%' }}>
        {/* Inner content: full width, padding on sides */}
        <div style={{
          padding:    '24px 40px 80px',
          boxSizing:  'border-box',
          width:      '100%',
        }}>
          {renderActiveTab()}
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      {showWarning && (
        <div
          onClick={() => setShowWarning(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '420px', background: '#1e293b', borderRadius: '16px', padding: '32px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>Unsaved Changes</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>You have unsaved changes. Are you sure you want to leave?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowWarning(false)}
                style={{ padding: '10px 20px', border: '1px solid #334155', borderRadius: '8px', background: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Stay
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ padding: '10px 20px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
