import React, { useState, useEffect } from 'react';
import { mockActionRegistryService } from '../../services/actionRegistry/mockActionRegistryService';
import { SystemAction } from '../../services/actionRegistry/IActionRegistryService';
import { useVoice } from '../../contexts/VoiceProvider';

interface VoiceCommandOverlayProps {
  /**
   * Show the success flash when a command is recognised.
   * Default: false (production behaviour — the UI change is confirmation enough).
   * Set to true during development/testing for visibility.
   */
  showSuccess?: boolean;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({
  showSuccess = false,
}) => {
  const { phase, transcript, dictationTarget, stopDictation, isRefining } = useVoice();

  const [status, setStatus]   = useState<'success' | 'fail' | null>(null);
  const [data, setData]       = useState<{ label?: string; shortcut?: string; transcript?: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showSuccessToast = (action: SystemAction) => {
      if (!showSuccess) return;
      setData({ label: action.label, shortcut: action.shortcut });
      setStatus('success');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    };

    const showFailToast = (transcript: string) => {
      // Failure feedback is always shown — it's actionable, not noise.
      // VoiceMissPrompt handles the "did you mean?" candidates above this.
      setData({ transcript });
      setStatus('fail');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    };

    const unSubSuccess = mockActionRegistryService.onActionExecuted(showSuccessToast);
    const unSubFail    = mockActionRegistryService.onActionFailed(showFailToast);

    return () => { unSubSuccess(); unSubFail(); };
  }, [showSuccess]);

  // ── Dictation banner — always shown while dictating ───────────────────────
  if (phase === 'dictate' && dictationTarget) {
    return (
      <div style={{
        position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
        background: '#0f172aee',
        border: `1px solid ${isRefining ? '#38bdf8' : '#22c55e'}`,
        borderRadius: '12px', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '14px',
        zIndex: 10000, color: '#fff',
        boxShadow: '0 0 24px rgba(34,197,94,0.2)',
        minWidth: '320px',
        animation: 'popIn 0.2s ease-out',
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: isRefining ? '#38bdf8' : '#22c55e', flexShrink: 0,
          animation: 'dictPulse 1s ease-in-out infinite',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: '#86efac', fontWeight: 700, letterSpacing: '0.06em' }}>
            DICTATING INTO
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
            {dictationTarget.label}
          </div>
          {isRefining ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8',
                animation: 'dictPulse 0.6s ease-in-out infinite',
              }} />
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8',
                animation: 'dictPulse 0.6s ease-in-out infinite 0.2s',
              }} />
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8',
                animation: 'dictPulse 0.6s ease-in-out infinite 0.4s',
              }} />
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginLeft: '4px' }}>
                Refining…
              </span>
            </div>
          ) : transcript ? (
            <div style={{
              fontSize: '12px', color: '#94a3b8', fontStyle: 'italic',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px',
            }}>
              "{transcript}"
            </div>
          ) : null}
        </div>
        <button
          onClick={stopDictation}
          title='Say "done" or click to stop'
          style={{
            background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e',
            color: '#22c55e', borderRadius: '6px', padding: '4px 10px',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          Done
        </button>
        <style>{`
          @keyframes popIn {
            from { transform: translate(-50%, 16px); opacity: 0; }
            to   { transform: translate(-50%, 0);    opacity: 1; }
          }
          @keyframes dictPulse {
            0%, 100% { opacity: 1;   transform: scale(1);   }
            50%       { opacity: 0.3; transform: scale(1.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Command feedback flash ────────────────────────────────────────────────
  if (!visible || !data) return null;

  const isSuccess = status === 'success';

  return (
    <div style={{
      position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
      background: '#0f172aee',
      border: `1px solid ${isSuccess ? '#38bdf8' : '#f59e0b'}`,
      borderRadius: '12px', padding: '12px 24px',
      display: 'flex', alignItems: 'center', gap: '16px',
      zIndex: 10000, color: '#fff',
      boxShadow: `0 0 20px ${isSuccess ? '#38bdf844' : '#f59e0b44'}`,
      animation: 'popIn 0.2s ease-out',
    }}>
      <span style={{ fontSize: '20px' }}>{isSuccess ? '⚡' : '❓'}</span>
      <div style={{ minWidth: '150px' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>
          {isSuccess ? 'VOICE COMMAND EXECUTED' : 'UNRECOGNISED COMMAND'}
        </div>
        <div style={{ fontWeight: '600', fontSize: '15px' }}>
          {isSuccess ? data.label : `"${data.transcript}"`}
        </div>
      </div>
      {isSuccess && data.shortcut && (
        <div style={{
          background: '#38bdf822', color: '#38bdf8', padding: '4px 10px',
          borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold',
        }}>
          {data.shortcut}
        </div>
      )}
      <style>{`
        @keyframes popIn {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};
