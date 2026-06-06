// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import '../pathscribe.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@contexts/AuthContext";
import { useLogout } from '@hooks/useLogout';
import { SunIcon, MoonIcon, HelpIcon, MonitorIcon, WarningIcon } from '../components/Icons';
import CaseSearchBar from '../components/Search/CaseSearchBar';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleLogout = useLogout();
  
  // --- UI State ---
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // --- Theme State ---
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('dark');

  // --- Navigation Handler with Unsaved Data Check ---

  // --- Quick Links Data (MVP - Hardcoded) ---
const quickLinks = {
  protocols: [
    { title: 'CAP Cancer Protocols', url: 'https://www.cap.org/protocols-and-guidelines' },
    { title: 'WHO Classification', url: 'https://www.who.int/publications' }
  ],
  references: [
    { title: 'PathologyOutlines', url: 'https://www.pathologyoutlines.com' },
    { title: 'UpToDate', url: 'https://www.uptodate.com' }
  ],
  systems: [
    { title: 'Hospital LIS', url: '#' },
    { title: 'Lab Management', url: '#' }
  ]
};

  // --- Theme Engine ---
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') {
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--text-secondary', '#94a3b8');
        root.style.setProperty('--nav-bg', 'rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--bg-filter', 'brightness(0.4) contrast(1.1)');
      } else {
        root.style.setProperty('--bg-color', '#f8fafc');
        root.style.setProperty('--text-color', '#0f172a');
        root.style.setProperty('--text-secondary', '#475569');
        root.style.setProperty('--nav-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--bg-filter', 'brightness(0.7) saturate(0.8)');
      }
    };

    if (currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateAuto = () => applyTheme(mediaQuery.matches ? 'dark' : 'light');
      updateAuto();
      mediaQuery.addEventListener('change', updateAuto);
      return () => mediaQuery.removeEventListener('change', updateAuto);
    } else {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    document.body.style.margin = '0';
    return () => { clearTimeout(timer); };
  }, []);

const cards = [
  { title: 'Worklist', description: 'View and manage pending pathology cases', route: '/worklist', color: '#0891B2', image: '/worklist.webp' },
  { title: 'Configuration', description: 'System settings and AI preferences', route: '/configuration', color: '#F59E0B', image: '/config.webp' },
  { title: 'Search', description: 'Search completed and in-progress cases', route: '/search', color: '#8B5CF6', image: '/search.webp' },
  { title: 'System Audit', description: 'Review system activity and audit trails', route: '/audit', color: '#EF4444', image: '/logs.webp' },

  // ⭐ New tile
  {
    title: 'My Contribution',
    description: 'Workload • Quality • TAT • Trends',
    route: '/contribution',
    color: '#0EA5E9',
    image: '/my_contributions.webp'
  }
];

  return (
    <div className="ps-page" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.8s ease, background-color 0.4s ease' }}>
      {/* Background */}
      <div className="ps-page-bg" style={{ backgroundImage: 'url(/main_background.webp)', filter: 'var(--bg-filter)', transition: 'filter 0.5s ease' }} />
      <div className="ps-page-gradient" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, var(--bg-color) 100%)' }} />

      {/* UI Content */}
      <div className="ps-page-content">
        

        {/* Case Search Bar */}
        <div className="ps-search-strip">
          <CaseSearchBar />
        </div>

        <main className="ps-home-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 var(--ps-layout-padding-x)', overflow: 'auto' }}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 900, margin: 0, letterSpacing: 'clamp(-0.5px, -0.04em, -2px)' }}>
              Welcome back,&nbsp;<span style={{ color: '#0891B2' }}>{user?.name ? user.name.split(',')[0] : 'Doctor'}</span>
            </h1>
            <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'var(--text-secondary)', marginTop: '12px' }}>
              The AI models are updated and synchronized with the latest CAP protocols.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(260px, 22vw, 420px), 1fr))', gap: '24px' }}>
            {cards.map((card, index) => (
              <div
                key={card.title}
                onClick={() => navigate(card.route, (card as any).tab ? { state: { activeTab: (card as any).tab } } : undefined)}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative', 
                  height: 'clamp(160px, 20vh, 200px)', 
                  borderRadius: '20px', 
                  cursor: 'pointer', 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease', 
                  transform: hoveredCard === index ? 'translateY(-8px)' : 'none',
                  border: hoveredCard === index 
                    ? `2px solid ${card.color}` 
                    : '1px solid var(--border-color)', 
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: hoveredCard === index 
                    ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${card.color}40` 
                    : '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Background Image */}
                {card.image && (
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundImage: `url(${card.image})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    opacity: 0.25,
                    transition: 'opacity 0.3s ease',
                    imageRendering: '-webkit-optimize-contrast'
                  } as React.CSSProperties} />
                )}
                
                {/* Gradient Overlay - Static */}
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  transition: 'background 0.3s ease'
                }} />
                
                {/* Text Content */}
                <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{card.title}</h3>
                  <p style={{ fontSize: '14px', marginTop: '6px', opacity: 0.7 }}>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer Status */}
        <footer style={{ 
          padding: '30px var(--ps-layout-padding-x)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          color: '#64748b', 
          fontSize: '12px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>© 2026 PathScribe AI Systems • HIPAA Compliant</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              background: '#10B981', 
              borderRadius: '50%',
              boxShadow: '0 0 8px #10B981'
            }} />
            SYSTEMS OPERATIONAL
          </div>
        </footer>
      </div>

      {/* PROFILE MODAL */}
      {isProfileOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          tabIndex={-1}
          onClick={() => setIsProfileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsProfileOpen(false);
            if (e.key === 'Escape') setIsProfileOpen(false);
          }}
        >
          <div 
            style={{ 
              width: '400px',
              backgroundColor: '#111', 
              borderRadius: '20px', 
              padding: '40px', 
              border: '1px solid rgba(8, 145, 178, 0.3)', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              color: '#0891B2', 
              fontSize: '24px', 
              fontWeight: 700, 
              marginBottom: '24px'
            }}>
              User Preferences
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'left' }}>
                Appearance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => { setCurrentTheme('light'); setIsProfileOpen(false); }} 
                  style={{
                    background: currentTheme === 'light' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: currentTheme === 'light' ? '2px solid #0891B2' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== 'light') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== 'light') e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <SunIcon />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Light</span>
                </button>
                <button 
                  onClick={() => { setCurrentTheme('dark'); setIsProfileOpen(false); }} 
                  style={{
                    background: currentTheme === 'dark' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: currentTheme === 'dark' ? '2px solid #0891B2' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== 'dark') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== 'dark') e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <MoonIcon />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Dark</span>
                </button>
                <button 
                  onClick={() => { setCurrentTheme('auto'); setIsProfileOpen(false); }} 
                  style={{
                    background: currentTheme === 'auto' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: currentTheme === 'auto' ? '2px solid #0891B2' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== 'auto') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== 'auto') e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <MonitorIcon />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Auto</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => { 
                  window.open('https://www.cap.org/', '_blank'); 
                  setIsProfileOpen(false); 
                }} 
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 145, 178, 0.1)';
                  e.currentTarget.style.color = '#0891B2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <HelpIcon /> Support & Protocols
              </button>
              
              <button 
                onClick={() => { 
                  setShowAbout(true); 
                  setIsProfileOpen(false); 
                }} 
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 145, 178, 0.1)';
                  e.currentTarget.style.color = '#0891B2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <HelpIcon /> About PathScribe<span style={{ color: '#0891B2', fontSize: '0.6em', verticalAlign: 'super', marginLeft: '0.2em' }}>AI</span>
              </button>
            </div>

            <button 
              onClick={() => setIsProfileOpen(false)} 
              autoFocus
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(8, 145, 178, 0.15)',
                border: '1px solid rgba(8, 145, 178, 0.3)',
                color: '#0891B2',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(8, 145, 178, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(8, 145, 178, 0.15)';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QUICK LINKS MODAL */}
      {isResourcesOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          tabIndex={-1}
          onClick={() => setIsResourcesOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsResourcesOpen(false);
            if (e.key === 'Escape') setIsResourcesOpen(false);
          }}
        >
          <div 
            style={{ 
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto' as const,
              backgroundColor: '#111', 
              borderRadius: '20px', 
              padding: '40px', 
              border: '1px solid rgba(8, 145, 178, 0.3)', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              color: '#0891B2', 
              fontSize: '24px', 
              fontWeight: 700, 
              marginBottom: '24px',
              textAlign: 'center' as const
            }}>
              Quick Links
            </div>

            {/* Protocols Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '12px', 
                fontWeight: 700, 
                marginBottom: '12px',
                textTransform: 'uppercase' as const
              }}>
                Protocols
              </div>
              {quickLinks.protocols.map((link, i) => (
                <a            
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsResourcesOpen(false)}
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0891B2';
                    e.currentTarget.style.backgroundColor = 'rgba(8, 145, 178, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  → {link.title}
                </a>
              ))}
            </div>

            {/* References Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '12px', 
                fontWeight: 700, 
                marginBottom: '12px',
                textTransform: 'uppercase' as const
              }}>
                References
              </div>
              {quickLinks.references.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsResourcesOpen(false)}
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0891B2';
                    e.currentTarget.style.backgroundColor = 'rgba(8, 145, 178, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  → {link.title}
                </a>
              ))}
            </div>

            {/* Systems Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '12px', 
                fontWeight: 700, 
                marginBottom: '12px',
                textTransform: 'uppercase' as const
              }}>
                Systems
              </div>
              {quickLinks.systems.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsResourcesOpen(false)}
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0891B2';
                    e.currentTarget.style.backgroundColor = 'rgba(8, 145, 178, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  → {link.title}
                </a>
              ))}
            </div>

            <button 
              onClick={() => setIsResourcesOpen(false)} 
              autoFocus
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(8, 145, 178, 0.15)',
                border: '1px solid rgba(8, 145, 178, 0.3)',
                color: '#0891B2',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(8, 145, 178, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(8, 145, 178, 0.15)';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* IMPROVED SAFETY MODAL */}
      {showWarning && (
        <div 
          style={overlayStyle}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setShowWarning(false);
            if (e.key === 'Escape') setShowWarning(false);
          }}
        >
          <div style={warningCardStyle}>
             <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
               <WarningIcon color="#F59E0B" />
             </div>
             <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>
               Unsaved Data
             </h2>
             <p style={{ color: '#94a3b8', marginBottom: '30px', lineHeight: '1.6', fontSize: '15px' }}>
               You have an active session with unsaved changes. Logging out now will discard your current progress.
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {/* PRIMARY BUTTON - Solid Teal (Safe Default) */}
               <button 
                 onClick={() => setShowWarning(false)} 
                 autoFocus
                 style={{
                   padding: '16px 24px',
                   borderRadius: '12px',
                   background: '#0891B2',
                   border: 'none',
                   color: '#fff',
                   fontWeight: 700,
                   fontSize: '16px',
                   cursor: 'pointer',
                   width: '100%',
                   transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={(e) => e.currentTarget.style.background = '#0E7490'}
                 onMouseLeave={(e) => e.currentTarget.style.background = '#0891B2'}
               >
                 ← Return to Page
               </button>
               
               {/* SECONDARY BUTTON - Ghost Yellow (Warning) */}
               <button 
                 onClick={handleLogout}
                 style={{
                   padding: '16px 24px',
                   borderRadius: '12px',
                   background: 'transparent',
                   border: '2px solid #F59E0B',
                   color: '#F59E0B',
                   fontWeight: 600,
                   fontSize: '15px',
                   cursor: 'pointer',
                   width: '100%',
                   transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = '#F59E0B';
                   e.currentTarget.style.color = '#000';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = 'transparent';
                   e.currentTarget.style.color = '#F59E0B';
                 }}
               >
                 Log Out & Discard Changes
               </button>
             </div>
          </div>
        </div>
      )}

      {/* ABOUT MODAL - Light Frosted Glass Style */}
      {showAbout && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          tabIndex={-1}
          onClick={() => setShowAbout(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setShowAbout(false);
            if (e.key === 'Escape') setShowAbout(false);
          }}
        >
          <div 
            style={{
              width: '400px',
              backgroundColor: 'rgba(220, 220, 220, 0.75)',
              backdropFilter: 'blur(40px)',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
             <h2 style={{ 
               fontSize: '32px', 
               fontWeight: 700, 
               color: '#1a1a1a', 
               margin: '0 0 16px 0',
               letterSpacing: '-0.5px'
             }}>
               PathScribe<span style={{ color: '#0891B2', fontSize: '0.6em', verticalAlign: 'super', marginLeft: '0.1em' }}>AI</span>
             </h2>
             
             <p style={{ 
               color: '#3a3a3a', 
               marginBottom: '8px', 
               fontSize: '15px',
               lineHeight: '1.6'
             }}>
               Version 1.0.0 | Build: 2026-02-14
             </p>
             
             <p style={{ 
               color: '#3a3a3a', 
               marginBottom: '20px', 
               fontSize: '15px',
               lineHeight: '1.6'
             }}>
               Developed by the PathScribe AI Team
             </p>
             
             <p style={{ 
               color: '#5a5a5a', 
               marginBottom: '30px', 
               fontSize: '14px'
             }}>
               © 2026 PathScribe
             </p>
             
             <button 
               onClick={() => setShowAbout(false)} 
               autoFocus
               style={{
                 padding: '12px 32px',
                 borderRadius: '8px',
                 background: 'rgba(160, 160, 160, 0.5)',
                 border: 'none',
                 color: '#1a1a1a',
                 fontWeight: 600,
                 fontSize: '15px',
                 cursor: 'pointer',
                 width: '100%',
                 transition: 'all 0.2s ease'
               }}
               onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(140, 140, 140, 0.6)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(160, 160, 160, 0.5)'}
             >
               Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Global Styles
const overlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const warningCardStyle = { width: '400px', backgroundColor: '#111', padding: '40px', borderRadius: '28px', textAlign: 'center' as const, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' };
