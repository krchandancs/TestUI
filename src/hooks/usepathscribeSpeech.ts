import { useVoice } from '../contexts/VoiceProvider';
import type { DictationTarget } from '../contexts/VoiceProvider';

export type { DictationTarget };

/**
 * Primary hook for all voice interactions across the app.
 * Thin wrapper over VoiceProvider — no local state, no duplicate logic.
 *
 * COMMAND MODE
 * ─────────────
 * Voice engine handles matching automatically based on current phase.
 * Components just listen for the action events they care about.
 *
 * DICTATION MODE
 * ──────────────
 * Call startDictation() from within an action handler to stream speech
 * into a specific field. Always initiated by a voice command, never by
 * the toggle button.
 *
 * Example:
 *   const { startDictation } = usepathscribeSpeech();
 *
 *   useEffect(() => {
 *     const handler = () => startDictation({
 *       fieldId: 'ENTER_GROSS',
 *       label: 'Gross Description',
 *       onText: t => setValue(v => v + t),
 *       onDone: () => ref.current?.focus(),
 *     });
 *     window.addEventListener('VOICE_ACTION_ENTER_GROSS', handler);
 *     return () => window.removeEventListener('VOICE_ACTION_ENTER_GROSS', handler);
 *   }, [startDictation]);
 */
export const usepathscribeSpeech = () => {
  const voice = useVoice();

  return {
    // State
    phase:           voice.phase,
    commandPhase:    voice.commandPhase,
    isListening:     voice.isListening,
    isAiEnabled:     voice.isAiEnabled,
    isDictating:     voice.phase === 'dictate',
    isProcessing:    voice.isProcessing,
    transcript:      voice.transcript,
    dictationTarget: voice.dictationTarget,

    // Controls
    toggleMic:       voice.toggleVoice,    // standby → ai → local → standby
    startListening:  voice.startListening, // jump straight to ai mode
    stopListening:   voice.stopListening,  // stop everything
    startDictation:  voice.startDictation, // enter dictate mode for a field
    stopDictation:   voice.stopDictation,  // commit and return to command mode
  };
};
