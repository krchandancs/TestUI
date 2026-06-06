import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../../pathscribe.css';
import FlagConfigPage    from './FlagConfigPage';
import SpecimenDictionary from './SpecimenDictionary';
import SubspecialtiesSection from './SubspecialtiesSection';
// REMOVED: import SystemShortcuts from './SystemShortcutsSection';
import FontsSection      from './FontsSection';
import LISSection        from './LISSection';
import RetentionSection  from './RetentionSection';
import { ClientDictionaryPage } from '../../../pages/system/ClientDictionaryPage';
import IdentifierFormatsSection from './IdentifierFormatsSection';
import GoverningBodiesSection  from './GoverningBodiesSection';
import DelegationTypeSection   from './DelegationTypeSection';
import ParticipationTypesSection from './ParticipationTypesSection';
import CaseRoutingSection   from './CaseRoutingSection';
import RoutingRulesSection  from './RoutingRulesSection';
import TerminologyServicesSection from '../Terminology/TerminologyServicesSection';

// ─── Section registry ─────────────────────────────────────────────────────────

// 1. Updated: Removed 'shortcuts'
type SystemSection = 'flags' | 'subspecialties' | 'specimens' | 'fonts' | 'lis' | 'retention' | 'clients' | 'identifiers' | 'governing_bodies' | 'delegation_types' | 'participation_types' | 'case_routing' | 'routing_rules' | 'terminology';

const SECTIONS: { id: SystemSection; emoji: string; label: string }[] = [
  { id: 'flags',            emoji: '🚩',  label: 'Flags'               },
  { id: 'subspecialties',   emoji: '🩺',  label: 'Subspecialties'      },
  { id: 'specimens',        emoji: '🔬',  label: 'Specimen Dictionary'  },
  // REMOVED: Keyboard Shortcuts entry
  { id: 'fonts',            emoji: '🔤',  label: 'Approved Fonts'       },
  { id: 'lis',              emoji: '🔗',  label: 'LIS Integration'      },
  { id: 'retention',        emoji: '🗄️', label: 'Data Retention'       },
  { id: 'clients',          emoji: '🏥',  label: 'Client Dictionary'    },
  { id: 'identifiers',      emoji: '🔍',  label: 'Identifier Formats'   },
  { id: 'governing_bodies', emoji: '📋',  label: 'Governing Bodies'     },
  { id: 'delegation_types', emoji: '🔀',  label: 'Delegation Types'     },
  { id: 'participation_types', emoji: '👥',  label: 'Participation Types'  },
  { id: 'case_routing',       emoji: '🔀',  label: 'Case Routing'         },
  { id: 'routing_rules',      emoji: '📋',  label: 'Routing Rules'        },
  { id: 'terminology',      emoji: '🔌',  label: 'Terminology Services' },
];

// ─── Main component ───────────────────────────────────────────────────────────

const SystemTab: React.FC = () => {
  const location = useLocation();
  const [active, setActive] = useState<SystemSection>(() => {
    const section = new URLSearchParams(location.search).get('section') as SystemSection | null;
    return section && SECTIONS.some(s => s.id === section) ? section : 'flags';
  });

  // Re-activate if URL changes (e.g. deep-link navigation)
  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section') as SystemSection | null;
    if (section && SECTIONS.some(s => s.id === section)) setActive(section);
  }, [location.search]);

  const renderSection = () => {
    switch (active) {
      case 'flags':         return <FlagConfigPage />;
      case 'subspecialties': return <SubspecialtiesSection />;
      case 'specimens':     return <SpecimenDictionary />;
      // REMOVED: case 'shortcuts'
      case 'fonts':     return <FontsSection />;
      case 'lis':       return <LISSection />;
      case 'retention': return <RetentionSection />;
      case 'clients':   return <ClientDictionaryPage />;
      case 'identifiers': return <IdentifierFormatsSection />;
      case 'governing_bodies': return <GoverningBodiesSection isSuperAdmin={true} />; 
      case 'delegation_types': return <DelegationTypeSection />;
      case 'participation_types': return <ParticipationTypesSection />;
      case 'case_routing':       return <CaseRoutingSection />;
      case 'routing_rules':      return <RoutingRulesSection />;
      case 'terminology':      return <TerminologyServicesSection isSuperAdmin={true} />;
      default:          return null;
    }
  };

  // ── Voice sub-navigation ─────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = (e: CustomEvent) => {
      const section = e.detail?.section as SystemSection;
      if (section) setActive(section);
    };
    window.addEventListener('PATHSCRIBE_SYSTEM_NAVIGATE', handler as EventListener);
    return () => window.removeEventListener('PATHSCRIBE_SYSTEM_NAVIGATE', handler as EventListener);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>

      {/* ── Sidebar nav ── */}
      <div style={{ width: '210px', flexShrink: 0, paddingTop: '4px' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.color = '#DEE4E7'; }}
            onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.color = '#9AA0A6'; }}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              background: active === s.id ? 'rgba(138,180,248,0.15)' : 'transparent',
              color: active === s.id ? '#8AB4F8' : '#9AA0A6',
              border: `1px solid ${active === s.id ? 'rgba(138,180,248,0.35)' : 'transparent'}`,
              borderRadius: '8px', fontSize: '13px',
              fontWeight: active === s.id ? 600 : 500,
              cursor: 'pointer', marginBottom: '4px', transition: 'all 0.15s',
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* ── Section content ── */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 20, boxSizing: 'border-box' }}>
        {renderSection()}
      </div>

    </div>
  );
};

export default SystemTab;


