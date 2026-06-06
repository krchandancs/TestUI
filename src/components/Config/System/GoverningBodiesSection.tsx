/**
 * components/Config/System/GoverningBodiesSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super-admin only section for configuring which governing bodies are active
 * in pathscribe's Synoptic Library and nightly sync.
 *
 * Current scope (v1 stub):
 *   - Enable / disable each governing body
 *   - Enabled bodies appear in the Upload Protocol modal
 *   - Enabled bodies are included in the nightly sync
 *   - Super admin role required to make changes
 *
 * Deferred (pending compliance/clinical informatics input):
 *   - License / subscription number tracking
 *   - License expiry alerts
 *   - Per-body sync frequency control
 *
 * TODO: Terminology Monitoring (future feature)
 *   The nightly sync should also check whether SNOMED CT / ICD codes used
 *   in published templates have been deprecated, superseded, or updated.
 *   Alerts should surface in the Synoptic Library as a "Terminology Alerts"
 *   badge. See: services/communications/synopticNotificationService.ts
 *   for the notification infrastructure that will carry these alerts.
 *
 * Consumed by:
 *   components/Config/System/index.tsx — add as a sub-section alongside
 *   existing system settings.
 *
 * Drop-in path:
 *   src/components/Config/System/GoverningBodiesSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../../pathscribe.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoverningBody {
  id:          string;
  label:       string;
  fullName:    string;
  region:      string;
  website:     string;
  enabled:     boolean;
  syncEnabled: boolean;
  isCustom:    boolean;
}

// ─── Default governing bodies ─────────────────────────────────────────────────
// TODO: Replace with API call to GET /api/config/governing-bodies
// so settings persist across sessions.

const DEFAULT_BODIES: GoverningBody[] = [
  {
    id:          'CAP',
    label:       'CAP',
    fullName:    'College of American Pathologists',
    region:      'United States',
    website:     'https://www.cap.org',
    enabled:     true,
    syncEnabled: true,
    isCustom:    false,
  },
  {
    id:          'RCPath',
    label:       'RCPath',
    fullName:    'Royal College of Pathologists',
    region:      'United Kingdom',
    website:     'https://www.rcpath.org',
    enabled:     true,
    syncEnabled: true,
    isCustom:    false,
  },
  {
    id:          'ICCR',
    label:       'ICCR',
    fullName:    'International Collaboration on Cancer Reporting',
    region:      'International',
    website:     'https://www.iccr-cancer.org',
    enabled:     true,
    syncEnabled: true,
    isCustom:    false,
  },
  {
    id:          'RCPA',
    label:       'RCPA',
    fullName:    'Royal College of Pathologists of Australasia',
    region:      'Australia / New Zealand',
    website:     'https://www.rcpa.edu.au',
    enabled:     false,
    syncEnabled: false,
    isCustom:    false,
  },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────

const Toggle: React.FC<{
  checked:  boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  color?:   string;
}> = ({ checked, onChange, disabled = false, color = '#0891B2' }) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    style={{
      width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
      background:  checked ? color : '#334155',
      cursor:      disabled ? 'not-allowed' : 'pointer',
      opacity:     disabled ? 0.4 : 1,
      position:    'relative',
      transition:  'background 0.2s',
    }}
  >
    <div style={{
      position:   'absolute',
      top:        '3px',
      left:       checked ? '19px' : '3px',
      width:      '14px', height: '14px',
      borderRadius: '50%',
      background: '#f1f5f9',
      transition: 'left 0.2s',
      boxShadow:  '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </div>
);

// ─── Add custom body modal ────────────────────────────────────────────────────

const AddBodyModal: React.FC<{
  onClose: () => void;
  onAdd:   (body: GoverningBody) => void;
}> = ({ onClose, onAdd }) => {
  const [label,    setLabel]    = useState('');
  const [fullName, setFullName] = useState('');
  const [region,   setRegion]   = useState('');
  const [website,  setWebsite]  = useState('');

  const canSubmit = label.trim() && fullName.trim();

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({
      id:          label.trim().toUpperCase().replace(/\s+/g, '_'),
      label:       label.trim().toUpperCase(),
      fullName:    fullName.trim(),
      region:      region.trim(),
      website:     website.trim(),
      enabled:     true,
      syncEnabled: false,   // custom bodies start with sync off pending setup
      isCustom:    true,
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #334155', borderRadius: '7px',
    fontSize: '13px', color: '#f1f5f9',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '440px', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Add Governing Body</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Custom bodies start with sync disabled</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Fields */}
        <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
              Abbreviation <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. RCPA"
              style={inputStyle}
              onFocus={e  => (e.currentTarget.style.borderColor = '#0891B2')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
              Full Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Royal College of Pathologists of Australasia"
              style={inputStyle}
              onFocus={e  => (e.currentTarget.style.borderColor = '#0891B2')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>Region</label>
              <input
                value={region} onChange={e => setRegion(e.target.value)}
                placeholder="e.g. Australia / NZ"
                style={inputStyle}
                onFocus={e  => (e.currentTarget.style.borderColor = '#0891B2')}
                onBlur={e   => (e.currentTarget.style.borderColor = '#334155')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>Website</label>
              <input
                value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
                onFocus={e  => (e.currentTarget.style.borderColor = '#0891B2')}
                onBlur={e   => (e.currentTarget.style.borderColor = '#334155')}
              />
            </div>
          </div>

          {/* Note about sync */}
          <div style={{ padding: '10px 13px', borderRadius: '7px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>ℹ️ Note — </span>
            auto-sync is disabled for custom bodies by default. Enable it manually once the sync feed is configured for this body.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!canSubmit}
              style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${canSubmit ? 'rgba(8,145,178,0.4)' : '#334155'}`, background: canSubmit ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.04)', color: canSubmit ? '#0891B2' : '#334155', fontSize: '13px', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              Add Governing Body
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface GoverningBodiesSectionProps {
  isSuperAdmin?: boolean;   // gate edits — read-only for regular admins
}

const GoverningBodiesSection: React.FC<GoverningBodiesSectionProps> = ({
  isSuperAdmin = false,
}) => {
  const [bodies,    setBodies]    = useState<GoverningBody[]>(DEFAULT_BODIES);
  const [showAdd,   setShowAdd]   = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateBody = (id: string, patch: Partial<GoverningBody>) => {
    setBodies(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
    setHasChanges(true);
  };

  const removeBody = (id: string) => {
    setBodies(prev => prev.filter(b => b.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: POST /api/config/governing-bodies with bodies state
    setHasChanges(false);
  };

  const standardBodies = bodies.filter(b => !b.isCustom);
  const customBodies   = bodies.filter(b => b.isCustom);

  return (
    <div>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
            Governing Bodies
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Controls which governing bodies appear in the Synoptic Library upload modal
            and are included in the nightly protocol sync.
            {!isSuperAdmin && <span style={{ color: '#f87171' }}> · Super admin access required to make changes.</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px', alignItems: 'center' }}>
          {hasChanges && (
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>● Unsaved changes</span>
          )}
          {isSuperAdmin && hasChanges && (
            <button
              onClick={handleSave}
              style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid rgba(8,145,178,0.4)', background: 'rgba(8,145,178,0.15)', color: '#0891B2', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Save Changes
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.borderColor = '#475569'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              + Add Custom Body
            </button>
          )}
        </div>
      </div>

      {/* Terminology monitoring callout — future feature placeholder */}
      <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '9px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>🔬</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', marginBottom: '3px' }}>
            Terminology Monitoring — Coming Soon
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            The nightly sync will also monitor SNOMED CT and ICD-10/11 for deprecated, superseded,
            or updated codes used in your published templates — surfacing alerts in the Synoptic Library
            before they affect reporting accuracy.
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 32px', gap: '0 16px', padding: '0 16px 8px', marginBottom: '4px' }}>
        {['Governing Body', 'Region', 'Enabled', 'Auto-sync', ''].map(h => (
          <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
        ))}
      </div>

      {/* Standard bodies */}
      {standardBodies.map(body => (
        <BodyRow
          key={body.id}
          body={body}
          isSuperAdmin={isSuperAdmin}
          onUpdate={patch => updateBody(body.id, patch)}
          canRemove={false}
        />
      ))}

      {/* Custom bodies */}
      {customBodies.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom</span>
            <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
          </div>
          {customBodies.map(body => (
            <BodyRow
              key={body.id}
              body={body}
              isSuperAdmin={isSuperAdmin}
              onUpdate={patch => updateBody(body.id, patch)}
              canRemove={isSuperAdmin}
              onRemove={() => removeBody(body.id)}
            />
          ))}
        </>
      )}

      {showAdd && (
        <AddBodyModal
          onClose={() => setShowAdd(false)}
          onAdd={body => {
            setBodies(prev => [...prev, body]);
            setHasChanges(true);
          }}
        />
      )}
    </div>
  );
};

// ─── Body row ─────────────────────────────────────────────────────────────────

const BodyRow: React.FC<{
  body:        GoverningBody;
  isSuperAdmin: boolean;
  onUpdate:    (patch: Partial<GoverningBody>) => void;
  canRemove:   boolean;
  onRemove?:   () => void;
}> = ({ body, isSuperAdmin, onUpdate, canRemove, onRemove }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 32px',
    gap: '0 16px', alignItems: 'center',
    padding: '12px 16px', marginBottom: '6px',
    background: '#1e293b', borderRadius: '9px',
    border: `1px solid ${body.enabled ? '#334155' : '#1e293b'}`,
    opacity: body.enabled ? 1 : 0.55,
    transition: 'all 0.15s',
  }}>

    {/* Name + full name */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{body.label}</span>
        {body.isCustom && (
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>CUSTOM</span>
        )}
      </div>
      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
        <span data-phi="name">{body.fullName}</span>
        {body.website && (
          <a href={body.website} target="_blank" rel="noreferrer" style={{ color: '#334155', marginLeft: '6px', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#0891B2')} onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>↗</a>
        )}
      </div>
    </div>

    {/* Region */}
    <div style={{ fontSize: '11px', color: '#64748b' }}>{body.region}</div>

    {/* Enabled toggle */}
    <div>
      <Toggle
        checked={body.enabled}
        onChange={v => onUpdate({ enabled: v, syncEnabled: v ? body.syncEnabled : false })}
        disabled={!isSuperAdmin}
      />
    </div>

    {/* Sync toggle — only active if body is enabled */}
    <div>
      <Toggle
        checked={body.syncEnabled}
        onChange={v => onUpdate({ syncEnabled: v })}
        disabled={!isSuperAdmin || !body.enabled}
        color="#a78bfa"
      />
    </div>

    {/* Remove (custom only) */}
    <div>
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: '#475569', fontSize: '14px', cursor: 'pointer', padding: '2px', lineHeight: 1, transition: 'color 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          title="Remove governing body"
        >
          ✕
        </button>
      )}
    </div>
  </div>
);

export default GoverningBodiesSection;
