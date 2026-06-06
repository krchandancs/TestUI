import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../pathscribe.css';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { EnhancementRequestButton } from '../EnhancementRequest/EnhancementRequestButton';
import { loadEnhancementConfig } from '../../services/enhancementRequestService';
import { VoiceToggleButton } from '../Voice/VoiceToggleButton';
import { VoiceCommandOverlay } from '../Voice/VoiceCommandOverlay';
import { VoiceMissPrompt } from '../Voice/VoiceMissPrompt';

const VOICE_SHOW_SUCCESS = import.meta.env.DEV;

const EXTERNAL_LINKS = [
  { name: 'CAP Cancer Protocols',          url: 'https://www.cap.org/protocols/cancer-protocols-templates' },
  { name: 'WHO Classification of Tumours', url: 'https://tumourclassification.iarc.who.int/' },
  { name: 'PathologyOutlines',             url: 'https://www.pathologyoutlines.com/' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/'))     return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''}`;
  if (ua.includes('Chrome/'))  return `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`;
  if (ua.includes('Firefox/')) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`;
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}`;
  return 'Unknown';
}

function getOSInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows NT 10')) return 'Windows 10/11';
  if (ua.includes('Windows'))       return 'Windows';
  if (ua.includes('Mac OS X'))      return `macOS ${ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? ''}`;
  if (ua.includes('Linux'))         return 'Linux';
  if (ua.includes('Android'))       return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

// ── System Info Modal sub-components ─────────────────────────────────────────

const StatusDot: React.FC<{ ok: boolean | null }> = ({ ok }) => (
  <span className={`ps-sysinfo-status-dot${ok === true ? ' ps-sysinfo-status-dot--ok' : ok === false ? ' ps-sysinfo-status-dot--error' : ''}`} />
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="ps-sysinfo-row">
    <span className="ps-sysinfo-row-label">{label}</span>
    <span className="ps-sysinfo-row-value">{value}</span>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ps-sysinfo-section">{children}</div>
);

// ── System Info Modal ─────────────────────────────────────────────────────────

interface SystemInfoModalProps { onClose: () => void; }

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [copied,     setCopied]     = useState(false);
  const [anthropicOk, setAnthropicOk] = useState<boolean | null>(null);
  const [geminiOk,   setGeminiOk]   = useState<boolean | null>(null);

  const aiProvider = import.meta.env.VITE_AI_PROVIDER   ?? 'anthropic';
  const aiModel    = import.meta.env.VITE_AI_MODEL       ?? 'claude-sonnet-4-20250514';
  const aiDevMode  = import.meta.env.VITE_AI_DEV_MODE   === 'true';
  const geminiKey  = import.meta.env.VITE_GEMINI_API_KEY ?? '';
  const envMode    = import.meta.env.MODE ?? 'development';
  const buildDate  = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': import.meta.env.VITE_AI_API_KEY ?? '', 'anthropic-version': '2023-06-01' }
    }).then(r => setAnthropicOk(r.ok)).catch(() => setAnthropicOk(false));
    setGeminiOk(!!geminiKey);
  }, []);

  const handleCopy = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const text = [
      `PathScribe AI v0.9.0 — Support Report`,
      `Generated: ${now}`,
      `─────────────────────────────────────`,
      `USER`,
      `  Role:     ${user?.role ?? 'Unknown'}`,
      `  Voice:    ${user?.voiceProfile ?? 'Unknown'}`,
      `  (Name/ID redacted — provide separately if requested)`,
      ``,
      `APP`,
      `  Product:  PathScribe AI`,
      `  Company:  ForMedrix`,
      `  Version:  0.9.0`,
      `  Build:    ${buildDate}`,
      `  Env:      ${envMode}`,
      ``,
      `AI PROVIDER`,
      `  Provider: ${aiProvider}`,
      `  Model:    ${aiModel}`,
      `  Mode:     ${aiDevMode ? 'Dev (direct API)' : 'Proxy'}`,
      `  Voice AI: ${geminiKey ? 'Gemini active' : 'Local only'}`,
      ``,
      `SYSTEM`,
      `  Browser:  ${getBrowserInfo()}`,
      `  OS:       ${getOSInfo()}`,
      `  Screen:   ${window.screen.width}×${window.screen.height}`,
      `  Language: ${navigator.language}`,
      ``,
      `API STATUS`,
      `  Anthropic: ${anthropicOk === null ? 'Checking...' : anthropicOk ? '✅ Connected' : '❌ Failed'}`,
      `  Gemini:    ${geminiOk ? '✅ Configured' : '⚠️  Not configured'}`,
      `─────────────────────────────────────`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const modal = (
    <div className="fm-overlay" onClick={onClose}>
      <div
        className="ps-research-modal"
        style={{ width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ps-research-header">
          <div>
            <div className="fm-eyebrow">ForMedrix · PathScribe AI</div>
            <div className="fm-title-row">
              <h2 className="fm-title">System Information</h2>
              <span className="fm-active-badge">v0.9.0</span>
            </div>
          </div>
          <button className="ps-close-btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="ps-sysinfo-body">
          <SectionLabel>User</SectionLabel>
          <Row label="Name"          value={user?.name ?? '—'} />
          <Row label="Role"          value={user?.role ?? '—'} />
          <Row label="User ID"       value={<code>{user?.id ?? '—'}</code>} />
          <Row label="Voice Profile" value={user?.voiceProfile ?? '—'} />

          <SectionLabel>Application</SectionLabel>
          <Row label="Product"     value="PathScribe AI" />
          <Row label="Company"     value="ForMedrix" />
          <Row label="Version"     value="0.9.0" />
          <Row label="Build"       value={buildDate} />
          <Row label="Environment" value={envMode} />

          <SectionLabel>AI Provider</SectionLabel>
          <Row label="Provider" value={aiProvider} />
          <Row label="Model"    value={<code>{aiModel}</code>} />
          <Row label="API Mode" value={aiDevMode ? '⚠ Dev — direct API calls' : 'Proxy'} />
          <Row label="Voice AI" value={geminiKey ? '✓ Gemini active' : 'Local only'} />

          <SectionLabel>Browser &amp; System</SectionLabel>
          <Row label="Browser"    value={getBrowserInfo()} />
          <Row label="OS"         value={getOSInfo()} />
          <Row label="Resolution" value={`${window.screen.width} × ${window.screen.height}`} />
          <Row label="Language"   value={navigator.language} />

          <SectionLabel>API Connectivity</SectionLabel>
          <Row label="Anthropic"       value={<><StatusDot ok={anthropicOk} />{anthropicOk === null ? 'Checking…' : anthropicOk ? 'Connected' : 'Failed'}</>} />
          <Row label="Gemini"          value={<><StatusDot ok={geminiOk} />{geminiOk ? 'Configured' : 'Not configured'}</>} />
          <Row label="NLM Terminology" value={<><StatusDot ok={true} />Available</>} />
          <Row label="Secure Email"    value={<><StatusDot ok={null} />Not wired (stub)</>} />
        </div>

        {/* Footer */}
        <div className="ps-sysinfo-footer">
          <span className="ps-sysinfo-footer-hint">
            ⚠ Name &amp; ID redacted. Share only with PathScribe support.
          </span>
          <button
            onClick={handleCopy}
            className={`ps-sysinfo-copy-btn${copied ? ' ps-sysinfo-copy-btn--copied' : ''}`}
          >
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy to Clipboard</>
            }
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to document.body so it renders outside the nav stacking context
  return ReactDOM.createPortal(modal, document.body);
};

// ── NavBar ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  onLogoClick:    () => void;
  onLogout:       () => void;
  onProfileClick: () => void;
  logoHeight?:    string;
}

const NavBar: React.FC<NavBarProps> = ({ onLogoClick, onLogout, onProfileClick, logoHeight = '32px' }) => {
  const { user }                                   = useAuth();
  const { unreadCount, hasUrgent, setPortalOpen } = useMessaging();
  const [linksOpen, setLinksOpen]                 = useState(false);
  const [sysInfoOpen, setSysInfoOpen]             = useState(false);
  const qaEnabled = loadEnhancementConfig().qaEnabled;

  const userInitials = user?.name
    ? (() => { const p = user.name.split(' ').filter(Boolean); return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : p[0]?.[0]?.toUpperCase() ?? '?'; })()
    : 'DSJ';

  useEffect(() => {
    const openEnhancement = () => document.querySelector<HTMLElement>('[data-voice-target="enhancement-request"] button')?.click();
    const openFeedback    = () => document.querySelector<HTMLElement>('[data-voice-target="testing-feedback"] button')?.click();
    window.addEventListener('PATHSCRIBE_HOME_OPEN_ENHANCEMENT_REQUEST', openEnhancement);
    window.addEventListener('PATHSCRIBE_HOME_OPEN_TESTING_FEEDBACK',    openFeedback);
    return () => {
      window.removeEventListener('PATHSCRIBE_HOME_OPEN_ENHANCEMENT_REQUEST', openEnhancement);
      window.removeEventListener('PATHSCRIBE_HOME_OPEN_TESTING_FEEDBACK',    openFeedback);
    };
  }, []);

  const handleAvatarClick = () => {
    // Badge modal (aboutOpen) is shown by AppShell via onProfileClick.
    // SystemInfoModal opens only from within the badge modal — do NOT open both at once.
    onProfileClick();
  };

  const linksModal = linksOpen && ReactDOM.createPortal(
    <div className="fm-overlay" onClick={() => setLinksOpen(false)}>
      <div className="ps-research-modal" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
        <div className="ps-research-header">
          <div>
            <div className="fm-eyebrow">External Resources</div>
            <h2 className="fm-title">Clinical Links</h2>
          </div>
          <button className="ps-close-btn" onClick={() => setLinksOpen(false)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div>
          {EXTERNAL_LINKS.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer"
              className="ps-clinical-link">
              {link.name}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ))}
        </div>
        <div className="ps-clinical-links-footer">
          <button className="fm-btn-cancel" onClick={() => setLinksOpen(false)}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <nav className="ps-nav">
        {/* Left */}
        <div className="ps-nav-left">
          <img
            src="/pathscribe-logo-dark.svg"
            alt="PathScribe AI"
            style={{ height: logoHeight, cursor: 'pointer' }}
            onClick={onLogoClick}
          />
          <div className="ps-nav-divider" />
          <span data-voice-target="enhancement-request"><EnhancementRequestButton /></span>
          {qaEnabled && <span data-voice-target="testing-feedback"><EnhancementRequestButton mode="qa" /></span>}
        </div>

        {/* Right */}
        <div className="ps-nav-right">

          {/* User avatar — opens system info + fires onProfileClick */}
          <div className="ps-nav-user-info" onClick={handleAvatarClick}>
            <div className="ps-nav-user-text">
              <div className="ps-nav-user-name">{user?.name || 'Dr. Sarah Johnson'}</div>
              <div className="ps-nav-user-role">MD, FCAP</div>
            </div>
            <div className="ps-nav-avatar">{userInitials}</div>
          </div>

          <div className="ps-nav-divider" />

          {/* Voice */}
          <div onMouseDown={e => e.preventDefault()}>
            <VoiceToggleButton />
          </div>

          {/* Messages */}
          <button type="button" className="ps-nav-btn" onMouseDown={e => e.preventDefault()}
            onClick={() => setPortalOpen(true)}
            style={{ color: hasUrgent ? '#FF453A' : undefined }}>
            <div style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadCount > 0 && <div className="ps-nav-badge">{unreadCount}</div>}
            </div>
          </button>

          {/* Clinical Links */}
          <button type="button" className="ps-nav-btn" onMouseDown={e => e.preventDefault()}
            onClick={() => setLinksOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>

          {/* Logout */}
          <button type="button" className="ps-nav-btn" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      {sysInfoOpen && <SystemInfoModal onClose={() => setSysInfoOpen(false)} />}
      {linksModal}

      <VoiceCommandOverlay showSuccess={VOICE_SHOW_SUCCESS} />
      <VoiceMissPrompt />
    </>
  );
};

export default NavBar;
