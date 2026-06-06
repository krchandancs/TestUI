/**
 * SecurityTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuration → Security. Admin-only institution-level biometric policy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import {
  getBiometricPolicy, saveBiometricPolicy,
  BiometricPolicy, BiometricCadence, BIOMETRIC_POLICY_DEFAULTS,
} from '@/services/biometric/mockBiometricService';

const TEAL  = '#0891B2'; const PANEL = '#1e293b'; const BORDER = '#334155';
const TEXT  = '#f1f5f9'; const MUTED = '#94a3b8'; const GREEN  = '#10b981';

const s = {
  row:   { display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, padding:'18px 0', borderBottom:`1px solid ${BORDER}` } as React.CSSProperties,
  label: { fontSize:14, fontWeight:600, color:TEXT, marginBottom:4 } as React.CSSProperties,
  desc:  { fontSize:12, color:MUTED, lineHeight:1.5 } as React.CSSProperties,
};

export const SecurityTab: React.FC = () => {
  const [policy, setPolicy] = React.useState<BiometricPolicy>(getBiometricPolicy);
  const [saved,  setSaved]  = React.useState(false);
  const [dirty,  setDirty]  = React.useState(false);

  const update = (changes: Partial<BiometricPolicy>) => {
    setPolicy(p => ({ ...p, ...changes }));
    setDirty(true); setSaved(false);
  };

  const handleSave = () => {
    saveBiometricPolicy(policy);
    setDirty(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ToggleBtn = ({ field, val, label }: { field: keyof BiometricPolicy; val: boolean; label: string }) => (
    <button onClick={() => update({ [field]: val } as any)} style={{
      padding:'6px 18px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer',
      border:`1px solid ${BORDER}`,
      background: (policy[field] as boolean) === val ? TEAL : 'transparent',
      color: (policy[field] as boolean) === val ? '#fff' : MUTED,
      transition:'all 0.15s',
    }}>{label}</button>
  );

  const RadioOpt = ({ cadence, label, desc }: { cadence: BiometricCadence; label: string; desc: string }) => (
    <label style={{ display:'flex', gap:10, cursor:'pointer', marginBottom:12, alignItems:'flex-start', opacity: policy.enabled ? 1 : 0.4 }}>
      <input type="radio" name="cadence" checked={policy.cadence === cadence}
        disabled={!policy.enabled}
        onChange={() => update({ cadence })}
        style={{ marginTop:3, accentColor:TEAL }} />
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>{label}</div>
        <div style={{ fontSize:12, color:MUTED, marginTop:1 }}>{desc}</div>
      </div>
    </label>
  );

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:TEXT, margin:'0 0 4px' }}>Security</h2>
        <p style={{ fontSize:13, color:MUTED, margin:0 }}>
          Institution-level biometric e-signature policy. Pathologists cannot override these settings.
        </p>
      </div>

      {/* Master enable/disable */}
      <div style={{ background:PANEL, borderRadius:12, border:`1px solid ${BORDER}`, padding:'20px 24px', marginBottom:20 }}>
        <div style={{ ...s.row, borderBottom:'none', paddingBottom:0 }}>
          <div>
            <div style={s.label}>Biometric sign-off</div>
            <div style={s.desc}>
              When enabled, pathologists are prompted to verify via Touch ID, Face ID, or Windows Hello
              when finalising reports. Password is <strong style={{ color:TEXT }}>always</strong> available
              as a fallback — biometric failure never blocks report sign-off.
              Disabled by default.
            </div>
          </div>
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            <ToggleBtn field="enabled" val={true}  label="On" />
            <ToggleBtn field="enabled" val={false} label="Off" />
          </div>
        </div>
      </div>

      {/* Cadence */}
      <div style={{ background:PANEL, borderRadius:12, border:`1px solid ${BORDER}`, padding:'20px 24px', marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:TEXT, margin:'0 0 4px' }}>
          Re-authentication frequency
        </h3>
        <p style={{ fontSize:12, color:MUTED, margin:'0 0 20px', lineHeight:1.5 }}>
          How often the biometric prompt appears. In shared workstation environments,
          <strong style={{ color:TEXT }}> every sign-off</strong> provides the strongest identity assurance
          — it confirms who is signing each individual report, not just who logged in.
        </p>

        <RadioOpt cadence="per_sign_off" label="Every report sign-off"
          desc="Re-verify on each finalisation. Best for shared workstations and high-assurance labs." />
        <RadioOpt cadence="per_session"  label="Once per session"
          desc="Verify at first sign-off after login. Subsequent sign-offs in the same session skip the prompt." />
        <RadioOpt cadence="per_days"     label="Every N days"
          desc="Re-verify periodically. Suits single-user workstations." />
        <RadioOpt cadence="never"        label="Once at enrolment"
          desc="Verify only at enrolment. Valid indefinitely until credential is revoked." />

        {policy.cadence === 'per_days' && policy.enabled && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:26, marginTop:4 }}>
            <span style={{ fontSize:13, color:MUTED }}>Re-verify every</span>
            <input type="number" min={1} max={365} value={policy.cadenceDays}
              onChange={e => update({ cadenceDays: Math.max(1, Math.min(365, Number(e.target.value))) })}
              style={{ width:64, padding:'6px 10px', borderRadius:6, fontSize:13,
                border:`1px solid ${BORDER}`, background:'#0f172a', color:TEXT, textAlign:'center' }} />
            <span style={{ fontSize:13, color:MUTED }}>days</span>
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div style={{ padding:'12px 16px', borderRadius:8, marginBottom:24,
        background:'rgba(8,145,178,0.07)', border:'1px solid rgba(8,145,178,0.2)',
        fontSize:12, color:MUTED, lineHeight:1.6 }}>
        <strong style={{ color:TEXT }}>Regulatory note</strong> — PathScribe uses the Web Authentication
        API (WebAuthn/FIDO2). Biometric data never leaves the device. PathScribe stores only a
        cryptographic public credential ID. Satisfies 21 CFR Part 11 (US FDA), MHRA (UK), and
        EU Annex 11 electronic signature requirements. Password pre-fill at sign-off is intentionally
        disabled to comply with these standards — the pathologist must actively enter their credential.
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <button onClick={handleSave} disabled={!dirty} style={{
          padding:'10px 24px', borderRadius:8, fontSize:14, fontWeight:600,
          cursor: dirty ? 'pointer' : 'default', border:'none',
          background: dirty ? TEAL : '#334155', color:'#fff', transition:'all 0.2s',
        }}>
          {saved ? '✓ Saved' : 'Save policy'}
        </button>
        <button onClick={() => { setPolicy({ ...BIOMETRIC_POLICY_DEFAULTS }); setDirty(true); }}
          style={{ padding:'10px 16px', borderRadius:8, fontSize:13, cursor:'pointer',
            border:`1px solid ${BORDER}`, background:'transparent', color:MUTED }}>
          Reset to defaults
        </button>
        {saved && <span style={{ fontSize:12, color:GREEN }}>Policy saved</span>}
      </div>
    </div>
  );
};

export default SecurityTab;
