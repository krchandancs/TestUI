import React, { useState, useEffect } from 'react';
import '../pathscribe.css';
import { useNavigate } from 'react-router-dom';

// ── Types & Data ─────────────────────────────────────────────────────────────
// Components import ONLY from services/index.ts — never directly from mock/firestore files.
import type { AuditLog, ErrorLog } from '../services/auditlog/IAuditService';
import { auditService } from '../services';

type ActiveTab = 'audit' | 'errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDateStr(ts: string): Date {
  return new Date(ts.replace(' ', 'T'));
}

function getDateThreshold(range: string): Date | null {
  const now = new Date();
  const d   = new Date(now);
  if (range === 'today')  { d.setHours(0, 0, 0, 0); return d; }
  if (range === '7days')  { d.setDate(d.getDate() - 7);  return d; }
  if (range === '30days') { d.setDate(d.getDate() - 30); return d; }
  if (range === '90days') { d.setDate(d.getDate() - 90); return d; }
  return null;
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildMetaHeader(
  reportType: string,
  requestedBy: string,
  filters: Record<string, string>,
  rowCount: number
): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const filterStr = Object.entries(filters)
    .filter(([, v]) => v && v !== 'all')
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ') || 'None';
  return [
    `${esc('PathScribe AI — System Audit Log Export')}`,
    `${esc('NOTICE: For authorised audit and compliance purposes only. Do not distribute.')}`,
    `${esc('No direct patient identifiers included (HIPAA / GDPR / Privacy Act compliant).')}`,
    ``,
    `"Report Type",${esc(reportType)}`,
    `"Exported At",${esc(now)}`,
    `"Requested By",${esc(requestedBy)}`,
    `"Active Filters",${esc(filterStr)}`,
    `"Total Records",${esc(String(rowCount))}`,
    ``,
  ].join('\n');
}

function exportAuditCSV(rows: AuditLog[], requestedBy: string, filters: Record<string, string>) {
  const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const meta = buildMetaHeader('Audit Log', requestedBy, filters, rows.length);
  const data = [
    ['ID', 'Timestamp', 'Type', 'Event', 'Detail', 'Actioned By', 'Accession No.', 'AI Confidence'].join(','),
    ...rows.map(r => [r.id, r.timestamp, r.type, r.event, r.detail, r.user, r.caseId ?? '', r.confidence ?? ''].map(esc).join(','))
  ];
  downloadCSV(meta + data.join('\n'), `pathscribe-audit-log-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportErrorCSV(rows: ErrorLog[], requestedBy: string, filters: Record<string, string>) {
  const esc = (v: string | number | boolean | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const meta = buildMetaHeader('Error Log', requestedBy, filters, rows.length);
  const data = [
    ['ID', 'Timestamp', 'Severity', 'Code', 'Message', 'Source', 'Accession No.', 'Resolved'].join(','),
    ...rows.map(r => [r.id, r.timestamp, r.severity, r.code, r.message, r.source, r.caseId ?? '', r.resolved].map(esc).join(','))
  ];
  downloadCSV(meta + data.join('\n'), `pathscribe-error-log-${new Date().toISOString().slice(0,10)}.csv`);
}

// UNIQUE_USERS is derived from loaded data — see useMemo below


// ── Component ────────────────────────────────────────────────────────────────
const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoaded,        setIsLoaded]        = useState(false);
  const [auditLogs,       setAuditLogs]       = useState<AuditLog[]>([]);
  const [errorLogs,       setErrorLogs]       = useState<ErrorLog[]>([]);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [activeTab,       setActiveTab]       = useState<ActiveTab>('audit');

  // Audit filters
  const [typeFilter,  setTypeFilter]  = useState<'all' | 'ai' | 'user' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter,  setUserFilter]  = useState('all');
  const [dateRange,   setDateRange]   = useState('7days');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  // Error filters
  const [errorSeverity, setErrorSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [errorSearch,   setErrorSearch]   = useState('');
  const [errorResolved, setErrorResolved] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    // Load audit and error logs from service layer
    auditService.getAuditLogs().then(r => { if (r.ok) setAuditLogs(r.data); });
    auditService.getErrorLogs().then(r => { if (r.ok) setErrorLogs(r.data); });
    return () => clearTimeout(t);
  }, []);


  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredAuditLogs = auditLogs.filter(log => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (userFilter !== 'all' && log.user !== userFilter) return false;
    const logDate = parseDateStr(log.timestamp);
    if (dateRange === 'custom') {
      if (dateFrom && logDate < new Date(dateFrom))                    return false;
      if (dateTo   && logDate > new Date(dateTo + 'T23:59:59'))        return false;
    } else {
      const threshold = getDateThreshold(dateRange);
      if (threshold && logDate < threshold)                            return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (![log.event, log.detail, log.user, log.caseId ?? ''].some(s => s.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const filteredErrorLogs = errorLogs.filter(log => {
    if (errorSeverity !== 'all' && log.severity !== errorSeverity)     return false;
    if (errorResolved === 'open'     &&  log.resolved)                 return false;
    if (errorResolved === 'resolved' && !log.resolved)                 return false;
    if (errorSearch) {
      const q = errorSearch.toLowerCase();
      if (![log.message, log.code, log.source, log.caseId ?? ''].some(s => s.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // ── Style helpers ────────────────────────────────────────────────────────

  const getTypeStyle = (type: string) => ({
    ai:     { bg: 'rgba(8,145,178,0.12)',   color: '#0891B2', label: 'AI'     },
    user:   { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', label: 'User'   },
    system: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'System' },
  }[type] ?? { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: type });

  const getSeverityStyle = (sev: string) => ({
    error:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Error'   },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Warning' },
    info:    { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'Info'    },
  }[sev] ?? { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: sev });

  const sel: React.CSSProperties = {
    padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
    color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', outline: 'none',
  };

  const openErrors = errorLogs.filter(e => !e.resolved).length;

  const quickLinks = {
    protocols:  [{ title: 'CAP Cancer Protocols', url: 'https://www.cap.org/protocols-and-guidelines' }, { title: 'WHO Classification', url: 'https://www.who.int/publications' }],
    references: [{ title: 'PathologyOutlines', url: 'https://www.pathologyoutlines.com' }, { title: 'UpToDate', url: 'https://www.uptodate.com' }],
    systems:    [{ title: 'Hospital LIS', url: '#' }, { title: 'Lab Management', url: '#' }],
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s ease', display: 'flex', flexDirection: 'column' }}>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/main_background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, filter: 'brightness(0.3) contrast(1.1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, #000 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Nav ── */}

        {/* ── Main ── */}
        <main style={{ flex: 1, minHeight: 0, padding: '28px 40px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header + Tab switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexShrink: 0 }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>System Logs</h1>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Complete record of AI actions, user changes, system events and errors</p>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {(['audit', 'errors'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', background: activeTab === tab ? 'rgba(8,145,178,0.25)' : 'transparent', color: activeTab === tab ? '#0891B2' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tab === 'audit' ? '📋 Audit Log' : '⚠️ Error Log'}
                  {tab === 'errors' && openErrors > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: 700, padding: '1px 6px' }}>{openErrors}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          {(() => {
            const stats = activeTab === 'audit' ? [
              { label: 'Total Events',  value: auditLogs.length,                                  color: '#0891B2', icon: '📋' },
              { label: 'AI Actions',    value: auditLogs.filter(l => l.type === 'ai').length,     color: '#8B5CF6', icon: '🤖' },
              { label: 'User Changes',  value: auditLogs.filter(l => l.type === 'user').length,   color: '#10B981', icon: '👤' },
              { label: 'System Events', value: auditLogs.filter(l => l.type === 'system').length, color: '#94a3b8', icon: '⚙️' },
            ] : [
              { label: 'Total Errors', value: errorLogs.length,                                        color: '#ef4444', icon: '🚨' },
              { label: 'Open Issues',  value: errorLogs.filter(e => !e.resolved).length,               color: '#f59e0b', icon: '🔓' },
              { label: 'Resolved',     value: errorLogs.filter(e => e.resolved).length,                color: '#10B981', icon: '✅' },
              { label: 'Warnings',     value: errorLogs.filter(e => e.severity === 'warning').length,  color: '#f59e0b', icon: '⚠️' },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '26px' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── AUDIT TAB ── */}
          {activeTab === 'audit' && (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                {/* Type pills */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {([{ id: 'all', label: 'All' }, { id: 'ai', label: '🤖 AI' }, { id: 'user', label: '👤 User' }, { id: 'system', label: '⚙️ System' }] as const).map(f => (
                    <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{ padding: '6px 13px', borderRadius: '20px', border: typeFilter === f.id ? '2px solid #0891B2' : '1px solid rgba(255,255,255,0.2)', background: typeFilter === f.id ? 'rgba(8,145,178,0.15)' : 'transparent', color: typeFilter === f.id ? '#0891B2' : '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                {/* User */}
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ ...sel, minWidth: '170px' }}>
                  {['all', ...Array.from(new Set(auditLogs.map(l => l.user))).sort()].map(u => (
                    <option key={u} value={u}>{u === 'all' ? 'All Users' : u}</option>
                  ))}
                </select>
                {/* Date range */}
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={sel}>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="custom">Custom Range…</option>
                </select>
                {dateRange === 'custom' && (
                  <>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...sel, colorScheme: 'dark' }} />
                    <span style={{ color: '#64748b', fontSize: '13px' }}>to</span>
                    <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ ...sel, colorScheme: 'dark' }} />
                  </>
                )}
                {/* Text search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search event, detail, case ID…" style={{ ...sel, paddingLeft: '30px', width: '100%', boxSizing: 'border-box', color: '#fff' }} />
                </div>
                {/* Export */}
                <button onClick={() => exportAuditCSV(
                    filteredAuditLogs,
                    'Unknown',
                    { 'Type': typeFilter, 'User': userFilter, 'Date Range': dateRange === 'custom' ? `${dateFrom} to ${dateTo}` : dateRange, 'Search': searchQuery }
                  )} style={{ padding: '7px 13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0891B2'; e.currentTarget.style.color = '#0891B2'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#94a3b8'; }}>
                  ↓ Export CSV
                </button>
              </div>

              {/* Table */}
              <div className="ps-table-scroll-wrap">
              <div style={{ flex: 1, minHeight: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '680px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '170px 75px 145px 1fr 155px 80px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                  <div>Timestamp</div><div>Type</div><div>Event</div><div>Detail</div><div>User</div><div>Case</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredAuditLogs.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#475569' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>No logs match your filters</div>
                    </div>
                  ) : filteredAuditLogs.map((log, idx) => {
                    const ts = getTypeStyle(log.type);
                    return (
                      <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '170px 75px 145px 1fr 155px 80px', padding: '12px 20px', borderBottom: idx < filteredAuditLogs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '13px', alignItems: 'center', transition: 'background 0.15s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{log.timestamp}</div>
                        <div><span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: ts.bg, color: ts.color }}>{ts.label}</span></div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{log.event}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', paddingRight: '16px' }}>{log.detail}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{log.user}</div>
                        <div>{log.caseId ? <span style={{ color: '#0891B2', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }} onClick={() => navigate(`/case/${log.caseId}/synoptic`)}>{log.caseId}</span> : <span style={{ color: '#475569' }}>—</span>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>{/* end ps-table-scroll-wrap */}
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#475569', textAlign: 'right', flexShrink: 0 }}>Showing {filteredAuditLogs.length} of {auditLogs.length} events</div>
            </>
          )}

          {/* ── ERROR TAB ── */}
          {activeTab === 'errors' && (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {([{ id: 'all', label: 'All' }, { id: 'error', label: '🚨 Error' }, { id: 'warning', label: '⚠️ Warning' }, { id: 'info', label: 'ℹ️ Info' }] as const).map(f => (
                    <button key={f.id} onClick={() => setErrorSeverity(f.id)} style={{ padding: '6px 13px', borderRadius: '20px', border: errorSeverity === f.id ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.2)', background: errorSeverity === f.id ? 'rgba(239,68,68,0.12)' : 'transparent', color: errorSeverity === f.id ? '#ef4444' : '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                <select value={errorResolved} onChange={e => setErrorResolved(e.target.value as any)} style={sel}>
                  <option value="all">All Status</option>
                  <option value="open">Open Only</option>
                  <option value="resolved">Resolved Only</option>
                </select>
                <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <input type="text" value={errorSearch} onChange={e => setErrorSearch(e.target.value)} placeholder="Search message, code, source…" style={{ ...sel, paddingLeft: '30px', width: '100%', boxSizing: 'border-box', color: '#fff' }} />
                </div>
                <button onClick={() => exportErrorCSV(
                    filteredErrorLogs,
                    'Unknown',
                    { 'Severity': errorSeverity, 'Status': errorResolved, 'Search': errorSearch }
                  )} style={{ padding: '7px 13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#94a3b8'; }}>
                  ↓ Export CSV
                </button>
              </div>

              {/* Error Table */}
              <div className="ps-table-scroll-wrap">
              <div style={{ flex: 1, minHeight: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '760px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '165px 85px 105px 1fr 145px 75px 85px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                  <div>Timestamp</div><div>Severity</div><div>Code</div><div>Message</div><div>Source</div><div>Case</div><div>Status</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredErrorLogs.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#475569' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>No errors match your filters</div>
                    </div>
                  ) : filteredErrorLogs.map((log, idx) => {
                    const ss = getSeverityStyle(log.severity);
                    return (
                      <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '165px 85px 105px 1fr 145px 75px 85px', padding: '12px 20px', borderBottom: idx < filteredErrorLogs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '13px', alignItems: 'center', transition: 'background 0.15s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{log.timestamp}</div>
                        <div><span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: ss.bg, color: ss.color }}>{ss.label}</span></div>
                        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>{log.code}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', paddingRight: '16px' }}>{log.message}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{log.source}</div>
                        <div>{log.caseId ? <span style={{ color: '#0891B2', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }} onClick={() => navigate(`/case/${log.caseId}/synoptic`)}>{log.caseId}</span> : <span style={{ color: '#475569' }}>—</span>}</div>
                        <div><span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: log.resolved ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: log.resolved ? '#10B981' : '#ef4444' }}>{log.resolved ? 'Resolved' : 'Open'}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>{/* end ps-table-scroll-wrap */}
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#475569', textAlign: 'right', flexShrink: 0 }}>Showing {filteredErrorLogs.length} of {errorLogs.length} errors</div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <div>© 2026 PathScribe AI Systems • HIPAA Compliant</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981', display: 'inline-block' }} />
            SYSTEMS OPERATIONAL
          </div>
        </footer>
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
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => setIsResourcesOpen(false)} style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', marginBottom: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0891B2'; e.currentTarget.style.backgroundColor = 'rgba(8,145,178,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; }}>→ {link.title}</a>
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

export default AuditLogPage;
