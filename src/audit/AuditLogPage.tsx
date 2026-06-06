import React, { useState, useEffect } from 'react';
import '../pathscribe.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'user' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days'>('7days');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigateHome = () => navigate('/');

  // Quick Links
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

  // Mock Audit Log Data
  const auditLogs = [
    { id: 1, timestamp: '2026-02-17 09:42:13', type: 'ai', event: 'Synoptic Generated', detail: 'AI generated synoptic v1 for case S26-4401 using CAP Breast Invasive protocol', user: 'System (AI)', caseId: 'S26-4401', confidence: 94 },
    { id: 2, timestamp: '2026-02-17 09:43:55', type: 'user', event: 'Field Updated', detail: 'Tumor Size updated from "2.1cm" to "2.3cm" by pathologist', user: 'Dr. Sarah Johnson', caseId: 'S26-4401', confidence: null },
    { id: 3, timestamp: '2026-02-17 09:45:01', type: 'user', event: 'Synoptic Finalized', detail: 'Synoptic report finalized and signed for case S26-4401', user: 'Dr. Sarah Johnson', caseId: 'S26-4401', confidence: null },
    { id: 4, timestamp: '2026-02-17 08:31:22', type: 'ai', event: 'Protocol Selected', detail: 'AI auto-selected CAP Colon Resection protocol for case S26-4398', user: 'System (AI)', caseId: 'S26-4398', confidence: 91 },
    { id: 5, timestamp: '2026-02-17 08:29:10', type: 'system', event: 'LIS Sync', detail: 'Microscopic text received from LIS for case S26-4398', user: 'System (LIS)', caseId: 'S26-4398', confidence: null },
    { id: 6, timestamp: '2026-02-17 08:15:44', type: 'ai', event: 'Synoptic Updated', detail: 'AI updated synoptic v2 based on microscopic findings for case S26-4395', user: 'System (AI)', caseId: 'S26-4395', confidence: 88 },
    { id: 7, timestamp: '2026-02-17 07:58:33', type: 'user', event: 'Protocol Changed', detail: 'Protocol changed from CAP Prostate Biopsy to CAP Prostatectomy by pathologist', user: 'Dr. Michael Chen', caseId: 'S26-4392', confidence: null },
    { id: 8, timestamp: '2026-02-17 07:44:12', type: 'system', event: 'User Login', detail: 'User logged in from 192.168.1.45', user: 'Dr. Sarah Johnson', caseId: null, confidence: null },
    { id: 9, timestamp: '2026-02-16 16:22:09', type: 'ai', event: 'Synoptic Generated', detail: 'AI generated synoptic v1 for case S26-4389 using CAP Lung Resection protocol', user: 'System (AI)', caseId: 'S26-4389', confidence: 92 },
    { id: 10, timestamp: '2026-02-16 15:11:47', type: 'user', event: 'Synoptic Finalized', detail: 'Synoptic report finalized and signed for case S26-4385', user: 'Dr. Emily Rodriguez', caseId: 'S26-4385', confidence: null },
    { id: 11, timestamp: '2026-02-16 14:55:30', type: 'system', event: 'LIS Sync', detail: 'Gross description received from LIS for case S26-4389', user: 'System (LIS)', caseId: 'S26-4389', confidence: null },
    { id: 12, timestamp: '2026-02-16 13:40:18', type: 'ai', event: 'Protocol Selected', detail: 'AI auto-selected CAP Thyroid protocol for case S26-4382', user: 'System (AI)', caseId: 'S26-4382', confidence: 96 },
  ];

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesType = activeFilter === 'all' || log.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.caseId && log.caseId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ai': return { bg: 'rgba(8,145,178,0.12)', color: '#0891B2', label: 'AI' };
      case 'user': return { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'User' };
      case 'system': return { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'System' };
      default: return { bg: '#f1f5f9', color: '#64748b', label: type };
    }
  };

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
      flexDirection: 'column'
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/main_background.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0, filter: 'brightness(0.3) contrast(1.1)'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, #000000 100%)',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Nav */}
        <nav style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <img
              src="/pathscribe-logo.svg"
              alt="pathscribe AI"
              style={{ height: '60px', width: 'auto', cursor: 'pointer' }}
              onClick={handleNavigateHome}
            />
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <span
                onClick={handleNavigateHome}
                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0891B2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Home
              </span>
              <span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#0891B2', fontWeight: 600 }}>Audit Logs</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '20px'
            }}>
              <span style={{ fontSize: '17px', fontWeight: 600 }}>{user?.name || 'Dr. Johnson'}</span>
              <span style={{ fontSize: '12px', color: '#0891B2', fontWeight: 700 }}>MD, FCAP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Initials badge */}
              <button
                style={{
                  width: '42px', height: '42px', borderRadius: '8px',
                  backgroundColor: 'transparent', border: '2px solid #0891B2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0891B2', fontWeight: 800, fontSize: '14px',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'DJ'}
              </button>

              <button
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                style={{
                  width: '42px', height: '42px', borderRadius: '8px',
                  background: 'transparent', border: '2px solid #0891B2',
                  color: '#0891B2', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                title="Quick Links"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
              <button
                onClick={logout}
                style={{
                  width: '42px', height: '42px', borderRadius: '8px',
                  background: 'transparent', border: '2px solid #0891B2',
                  color: '#0891B2', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                title="Sign Out"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
        <main style={{ flex: 1, minHeight: 0, padding: '40px 40px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>Audit Logs</h1>
            <p style={{ fontSize: '16px', color: '#94a3b8' }}>
              Complete record of AI actions, user changes, and system events
            </p>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total Events', value: '1,247', color: '#0891B2', icon: '📋' },
              { label: 'AI Actions', value: '892', color: '#8B5CF6', icon: '🤖' },
              { label: 'User Changes', value: '298', color: '#10B981', icon: '👤' },
              { label: 'System Events', value: '57', color: '#94a3b8', icon: '⚙️' },
            ].map((stat, idx) => (
              <div key={idx} style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            
            {/* Type Filter Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Events' },
                { id: 'ai', label: '🤖 AI' },
                { id: 'user', label: '👤 User' },
                { id: 'system', label: '⚙️ System' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: activeFilter === filter.id ? '2px solid #0891B2' : '1px solid rgba(255,255,255,0.2)',
                    background: activeFilter === filter.id ? 'rgba(8,145,178,0.15)' : 'transparent',
                    color: activeFilter === filter.id ? '#0891B2' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  style={{
                    padding: '8px 16px 8px 36px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    width: '220px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Export Button */}
              <button style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0891B2'; e.currentTarget.style.color = '#0891B2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* Audit Log Table */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '180px 80px 150px 1fr 160px 80px',
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Timestamp</div>
              <div>Type</div>
              <div>Event</div>
              <div>Detail</div>
              <div>User</div>
              <div>Case</div>
            </div>

            {/* Table Rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>No logs found</div>
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const typeStyle = getTypeStyle(log.type);
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 80px 150px 1fr 160px 80px',
                      padding: '14px 20px',
                      borderBottom: idx < filteredLogs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      fontSize: '13px',
                      alignItems: 'center',
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Timestamp */}
                    <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                      {log.timestamp}
                    </div>

                    {/* Type Badge */}
                    <div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: typeStyle.bg,
                        color: typeStyle.color
                      }}>
                        {typeStyle.label}
                      </span>
                    </div>

                    {/* Event */}
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{log.event}</div>

                    {/* Detail */}
                    <div style={{ color: '#94a3b8', fontSize: '12px', paddingRight: '16px' }}>{log.detail}</div>

                    {/* User */}
                    <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{log.user}</div>

                    {/* Case ID */}
                    <div>
                      {log.caseId ? (
                        <span style={{
                          color: '#0891B2',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationStyle: 'dotted'
                        }}
                          onClick={() => navigate(`/case/${log.caseId}/synoptic`)}
                        >
                          {log.caseId}
                        </span>
                      ) : (
                        <span style={{ color: '#475569' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Row Count */}
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>
            Showing {filteredLogs.length} of {auditLogs.length} events
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#64748b',
          fontSize: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>&copy; 2026 pathscribe AI Systems &bull; HIPAA Compliant</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981', display: 'inline-block' }} />
            SYSTEMS OPERATIONAL
          </div>
        </footer>
      </div>

      {/* QUICK LINKS MODAL */}
      {isResourcesOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10000
          }}
          onClick={() => setIsResourcesOpen(false)}
        >
          <div
            style={{
              width: '500px', maxHeight: '80vh', overflowY: 'auto',
              backgroundColor: '#111', borderRadius: '20px', padding: '40px',
              border: '1px solid rgba(8,145,178,0.3)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: '#0891B2', fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              Quick Links
            </div>
            {Object.entries(quickLinks).map(([section, links]) => (
              <div key={section} style={{ marginBottom: '24px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>
                  {section}
                </div>
                {links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    onClick={() => setIsResourcesOpen(false)}
                    style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', marginBottom: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0891B2'; e.currentTarget.style.backgroundColor = 'rgba(8,145,178,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >→ {link.title}</a>
                ))}
              </div>
            ))}
            <button onClick={() => setIsResourcesOpen(false)} style={{
              padding: '12px 24px', borderRadius: '10px', background: 'rgba(8,145,178,0.15)',
              border: '1px solid rgba(8,145,178,0.3)', color: '#0891B2', fontWeight: 600,
              fontSize: '15px', cursor: 'pointer', width: '100%'
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
