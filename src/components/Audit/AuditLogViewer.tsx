import React, { useEffect, useState } from "react";
import '../../pathscribe.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { useLogout } from "@hooks/useLogout";
import { getAuditLog, clearAuditLog, logEvent } from "../../audit/auditLogger";
import { AuditEvent } from "../../types/AuditEvent";

export const AuditLogViewer: React.FC = () => {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const handleLogout  = useLogout();
  const [events,      setEvents]      = useState<AuditEvent[]>([]);
  const [isLoaded,    setIsLoaded]    = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

  const quickLinks = {
    protocols: [
      { title: 'CAP Cancer Protocols', url: 'https://www.cap.org/protocols-and-guidelines' },
      { title: 'WHO Classification',   url: 'https://www.who.int/publications' },
    ],
    references: [
      { title: 'PathologyOutlines', url: 'https://www.pathologyoutlines.com' },
      { title: 'UpToDate',          url: 'https://www.uptodate.com' },
    ],
    systems: [
      { title: 'Hospital LIS',    url: '#' },
      { title: 'Lab Management',  url: '#' },
    ],
  };

  const load = () => {
    setEvents(getAuditLog().sort((a: AuditEvent, b: AuditEvent) => b.timestamp.localeCompare(a.timestamp)));
  };

  useEffect(() => {
    load();
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleClear = () => {
    logEvent({ user: "System", category: "system", action: "clear_audit_log", templateId: "system", detail: "Audit log cleared by user" });
    clearAuditLog();
    load();
  };

  const handleNavigateHome = () => navigate('/');

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.6s ease',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/main_background.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0, filter: 'brightness(0.3) contrast(1.1)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, #000000 100%)',
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Nav Bar */}
        <nav style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <img
              src="/pathscribe-logo-dark.svg"
              alt="PathScribe AI"
              style={{ height: '60px', width: 'auto', cursor: 'pointer' }}
              onClick={handleNavigateHome}
            />
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <span
                onClick={handleNavigateHome}
                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0891B2'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                Home
              </span>
              <span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#0891B2', fontWeight: 600 }}>Audit Log</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: 600 }}>{user?.name || 'Dr. Johnson'}</span>
              <span style={{ fontSize: '12px', color: '#0891B2', fontWeight: 700 }}>MD, FCAP</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Initials badge */}
              <button
                style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'transparent', border: '2px solid #0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891B2', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'DJ'}
              </button>

              {/* Quick Links */}
              <button
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                title="Quick Links"
                style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'transparent', border: '2px solid #0891B2', color: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'transparent', border: '2px solid #0891B2', color: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main style={{ flex: 1, minHeight: 0, padding: '40px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>Audit Log</h1>
                <p style={{ fontSize: '16px', color: '#94a3b8' }}>Session-level record of all user and system actions</p>
              </div>
              <button
                onClick={handleClear}
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Table card */}
          <div style={{ flex: 1, minHeight: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 160px 200px 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              <div>Timestamp</div>
              <div>User</div>
              <div>Action</div>
              <div>Details</div>
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {events.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>No log entries</div>
                </div>
              ) : (
                events.map((ev, idx) => (
                  <div
                    key={ev.id}
                    style={{ display: 'grid', gridTemplateColumns: '200px 160px 200px 1fr', padding: '14px 20px', borderBottom: idx < events.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '13px', alignItems: 'start' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{new Date(ev.timestamp).toLocaleString()}</div>
                    <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{ev.user}</div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{ev.action}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {ev.questionId  && <div><span style={{ color: '#64748b' }}>Question:</span> {ev.questionId}</div>}
                      {ev.stateFrom && ev.stateTo && <div><span style={{ color: '#64748b' }}>State:</span> {ev.stateFrom} → {ev.stateTo}</div>}
                      {ev.oldValue !== undefined && <div><span style={{ color: '#64748b' }}>Old:</span> {JSON.stringify(ev.oldValue)}</div>}
                      {ev.newValue !== undefined && <div><span style={{ color: '#64748b' }}>New:</span> {JSON.stringify(ev.newValue)}</div>}
                      {ev.note       && <div><span style={{ color: '#64748b' }}>Note:</span> {ev.note}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </main>
      </div>

      {/* Quick Links Modal */}
      {isResourcesOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setIsResourcesOpen(false)}>
          <div style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: '#111', borderRadius: '20px', padding: '40px', border: '1px solid rgba(8,145,178,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#0891B2', fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Quick Links</div>
            {Object.entries(quickLinks).map(([section, links]) => (
              <div key={section} style={{ marginBottom: '24px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>{section}</div>
                {links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    onClick={() => setIsResourcesOpen(false)}
                    style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', marginBottom: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0891B2'; e.currentTarget.style.backgroundColor = 'rgba(8,145,178,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >→ {link.title}</a>
                ))}
              </div>
            ))}
            <button onClick={() => setIsResourcesOpen(false)} style={{ padding: '12px 24px', borderRadius: '10px', background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.3)', color: '#0891B2', fontWeight: 600, fontSize: '15px', cursor: 'pointer', width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
