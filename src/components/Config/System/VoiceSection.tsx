// src/components/Config/System/VoiceSection.tsx
// PathScribe admin toggle — enables or disables voice for a client deployment.
// One switch only. If the deployment has a Gemini key, users get AI + Local.
// If not, they get Local only. That's handled automatically — no config needed.

import React from 'react';
import '../../../pathscribe.css';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';

export const VoiceSection: React.FC = () => {
  const { config, updateConfig } = useSystemConfig();
  const enabled = config.voiceEnabled;

  return (
    <div className="config-section-container">
      <div className="config-section-header">
        <h2 className="config-section-title">🎙️ Voice Integration</h2>
        <p className="config-section-description">
          Enable or disable voice commands and dictation for this client deployment.
          When off, the mic button is greyed out and voice is unavailable to all users.
        </p>
      </div>

      <div className="config-section-body">
        <div className="ps-form-row" style={{ padding: '16px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '3px' }}>
              Voice Commands &amp; Dictation
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              When enabled, users can control PathScribe by voice and dictate into
              report fields. AI-powered dictation refinement is available automatically
              if this deployment has a Gemini API key configured.
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0, marginLeft: '24px' }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => updateConfig({ voiceEnabled: e.target.checked })}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px',
              position: 'relative', transition: 'background 0.2s',
              background: enabled ? '#0891B2' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                position: 'absolute', top: '3px', left: '3px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#fff', transition: 'transform 0.2s',
                transform: enabled ? 'translateX(18px)' : 'translateX(0)',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: enabled ? '#0891B2' : '#475569', minWidth: '24px' }}>
              {enabled ? 'On' : 'Off'}
            </span>
          </label>
        </div>

        <div style={{
          marginTop: '8px', padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          fontSize: '12px', color: '#64748b', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#94a3b8', fontWeight: 600 }}>PathScribe staff note:</strong>{' '}
          To hard-disable voice at the environment level (removes the mic button entirely),
          set{' '}
          <code style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
            VITE_VOICE_ENABLED=false
          </code>{' '}
          in the client's environment file. This overrides the toggle above.
        </div>
      </div>
    </div>
  );
};
