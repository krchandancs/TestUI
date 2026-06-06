import React, { useState, useEffect } from 'react';
import { mockActionRegistryService } from '../../services/actionRegistry/mockActionRegistryService';
import { SystemAction, PendingMiss } from '../../services/actionRegistry/IActionRegistryService';
import { useVoice } from '../../contexts/VoiceProvider';

/**
 * Appears briefly when a voice command isn't recognised.
 * Shows up to 3 fuzzy candidates passed by the registry.
 * If the user clicks one, the miss is confirmed and that transcript is
 * learned for next time.
 *
 * If the user ignores it, it auto-dismisses after 6 seconds.
 * If the user fires a keyboard shortcut within 8 seconds, VoiceProvider
 * confirms the miss automatically (no UI needed).
 *
 * Not shown during dictate phase — word misses in dictation are not
 * command misses and should never surface this prompt.
 */
export const VoiceMissPrompt: React.FC = () => {
  const { phase } = useVoice();

  const [miss,       setMiss]       = useState<PendingMiss | null>(null);
  const [candidates, setCandidates] = useState<SystemAction[]>([]);
  const [visible,    setVisible]    = useState(false);

  useEffect(() => {
    const unsub = mockActionRegistryService.onMissRecorded((m: PendingMiss, c: SystemAction[]) => {
      // Suppress during dictation — word misses are not command misses
      if (phase === 'dictate') return;
      setMiss(m);
      setCandidates(c);
      setVisible(true);
    });
    return unsub;
  }, [phase]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [visible, miss]);

  const confirm = (actionId: string) => {
    if (!miss) return;
    mockActionRegistryService.confirmMiss(miss.id, actionId, 'manual');
    setVisible(false);
  };

  const dismiss = () => {
    if (miss) mockActionRegistryService.dismissMiss(miss.id);
    setVisible(false);
  };

  if (!visible || !miss) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '104px', left: '50%', transform: 'translateX(-50%)',
      background: '#0f172a',
      border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: '12px', padding: '14px 18px',
      zIndex: 10001, color: '#fff', minWidth: '300px', maxWidth: '420px',
      boxShadow: '0 0 24px rgba(245,158,11,0.15)',
      animation: 'missIn 0.2s ease-out',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '10px',
      }}>
        <div>
          <div style={{
            fontSize: '10px', color: '#f59e0b',
            fontWeight: 700, letterSpacing: '0.06em',
          }}>
            NOT RECOGNISED
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
            "{miss.transcript}"
          </div>
        </div>
        <button onClick={dismiss} style={{
          background: 'transparent', border: 'none', color: '#475569',
          cursor: 'pointer', fontSize: '16px', padding: '0 0 0 12px', lineHeight: 1,
        }}>x</button>
      </div>

      {candidates.length > 0 ? (
        <>
          <div style={{
            fontSize: '10px', color: '#64748b',
            marginBottom: '8px', fontWeight: 600,
          }}>
            DID YOU MEAN?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => confirm(c.id)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px', padding: '8px 12px',
                  color: '#e2e8f0', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{c.label}</span>
                <span style={{ fontSize: '10px', color: '#475569' }}>tap to learn</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: '#475569' }}>
          No similar commands found. Try rephrasing or use the keyboard shortcut — it will be learned automatically.
        </div>
      )}

      <style>{`
        @keyframes missIn {
          from { transform: translate(-50%, 12px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};
