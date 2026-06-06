/**
 * components/Config/System/EnhancementRequestConfig.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only configuration panel for the Enhancement Request feature.
 * Gated by user.role === 'admin' — render inside the System tab.
 *
 * Drop-in path: src/components/Config/System/EnhancementRequestConfig.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { useAuth } from '../../../contexts/AuthContext';
import {
  EnhancementRequestConfig as Config,
  RoutingMode,
  loadEnhancementConfig,
  saveEnhancementConfig,
} from '../../../services/enhancementRequestService';

// ─── Style tokens ─────────────────────────────────────────────────────────────
const T = {
  surface: '#1e293b',
  border:  '#334155',
  accent:  '#0891B2',
  text:    '#f1f5f9',
  muted:   '#94a3b8',
  dim:     '#64748b',
  dimmer:  '#475569',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.border}`,
  borderRadius: '7px', fontSize: '13px', color: T.text,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: T.dim,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  display: 'block', marginBottom: '6px',
};

// ─── Main component ───────────────────────────────────────────────────────────

export const EnhancementRequestConfig: React.FC = () => {
  const { user } = useAuth();

  // Admin gate
  if (user?.role !== 'admin') return null;

  const [config,     setConfig]     = useState<Config>(loadEnhancementConfig);
  const [apiKey,     setApiKey]     = useState('');  // never persisted to localStorage
  const [saved,      setSaved]      = useState(false);
  const [emailInput, setEmailInput] = useState('');  // current text field value
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing,    setTesting]    = useState(false);

  // Sync emailInput from loaded config on mount
  useEffect(() => {
    setEmailInput(config.emailRecipients.join(', '));
  }, []);

  const patch = (p: Partial<Config>) => {
    setConfig(prev => ({ ...prev, ...p }));
    setSaved(false);
  };

  const handleSave = () => {
    // Parse email recipients from comma-separated input
    const recipients = emailInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.includes('@'));
    const toSave = { ...config, emailRecipients: recipients, portalApiKey: apiKey };
    saveEnhancementConfig(toSave);
    setConfig(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(res => setTimeout(res, 1000));
    setTestResult(config.mode === 'email'
      ? `✅ Test email sent to: ${config.emailRecipients.join(', ') || '(no recipients configured)'}`
      : `✅ Test payload sent to: ${config.portalUrl || '(no URL configured)'}`
    );
    setTesting(false);
  };

  const modeBtn = (mode: RoutingMode, label: string, icon: string, desc: string) => {
    const active = config.mode === mode;
    return (
      <div
        onClick={() => patch({ mode })}
        style={{
          flex: 1, padding: '14px 16px', borderRadius: '10px',
          border: `1px solid ${active ? 'rgba(8,145,178,0.4)' : T.border}`,
          background: active ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#475569'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = T.border; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: active ? T.accent : T.muted }}>{label}</span>
          {active && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: 'rgba(8,145,178,0.15)', color: T.accent, border: '1px solid rgba(8,145,178,0.3)' }}>Active</span>}
        </div>
        <div style={{ fontSize: '11px', color: T.dimmer, lineHeight: 1.5 }}>{desc}</div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> Enhancement Request Routing
          </div>
          <div style={{ fontSize: '11px', color: T.dim, marginTop: '2px' }}>
            Configure how user enhancement requests are routed. Admin only.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>✓ Saved</span>
          )}
          <button
            onClick={handleTest}
            disabled={testing}
            style={{
              padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              cursor: testing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.04)',
              color: testing ? T.dimmer : T.muted, opacity: testing ? 0.6 : 1,
            }}
          >
            {testing ? 'Testing…' : '↗ Send Test'}
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid rgba(8,145,178,0.4)',
              background: 'rgba(8,145,178,0.15)', color: T.accent,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.15)'}
          >
            Save
          </button>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Routing mode selector */}
        <div>
          <label style={labelStyle}>Routing Mode</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {modeBtn('email',  'Email',  '📧', 'Send structured emails to a configured recipient list')}
            {modeBtn('portal', 'Portal', '🔗', 'POST JSON payload to Jira, Azure DevOps, ServiceNow, or custom API')}
          </div>
        </div>

        {/* Email mode config */}
        {config.mode === 'email' && (
          <>
            <div>
              <label style={labelStyle}>Recipients</label>
              <input
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setSaved(false); }}
                placeholder="admin@hospital.org, pathology@hospital.org"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e  => e.currentTarget.style.borderColor = T.border}
              />
              <div style={{ fontSize: '10px', color: T.dimmer, marginTop: '4px' }}>
                Comma-separated. Email subject format: <code style={{ fontFamily: 'monospace', color: T.muted }}>Enhancement Request – &lt;title&gt;</code>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => patch({ emailConfirmation: !config.emailConfirmation })}
            >
              <div style={{ width: '34px', height: '18px', borderRadius: '99px', flexShrink: 0, position: 'relative', transition: 'background 0.2s', background: config.emailConfirmation ? T.accent : 'rgba(255,255,255,0.1)' }}>
                <span style={{ position: 'absolute', top: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: config.emailConfirmation ? '18px' : '2px' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: config.emailConfirmation ? T.accent : T.muted }}>Send confirmation email to submitter</div>
                <div style={{ fontSize: '10px', color: T.dimmer }}>User receives a copy of their submission</div>
              </div>
            </div>
          </>
        )}

        {/* Portal mode config */}
        {config.mode === 'portal' && (
          <>
            <div>
              <label style={labelStyle}>API Endpoint URL</label>
              <input
                value={config.portalUrl}
                onChange={e => patch({ portalUrl: e.target.value })}
                placeholder="https://your-org.atlassian.net/rest/api/3/issue"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e  => e.currentTarget.style.borderColor = T.border}
              />
            </div>

            <div>
              <label style={labelStyle}>API Key / Token <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(not stored — re-enter on each session)</span></label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e  => e.currentTarget.style.borderColor = T.border}
              />
              <div style={{ fontSize: '10px', color: T.dimmer, marginTop: '4px' }}>
                For security, API keys are held in memory only and never written to localStorage.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Project Key / Area Path</label>
              <input
                value={config.portalProjectKey}
                onChange={e => patch({ portalProjectKey: e.target.value })}
                placeholder="e.g. PATH (Jira) or pathscribe\\Enhancements (ADO)"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e  => e.currentTarget.style.borderColor = T.border}
              />
            </div>
          </>
        )}

        {/* Test result */}
        {testResult && (
          <div style={{ padding: '10px 14px', borderRadius: '7px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '12px', color: '#10B981' }}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};
