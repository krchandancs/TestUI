import React from 'react';
import { usepathscribeSpeech } from '../../hooks/usepathscribeSpeech';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceControl: React.FC = () => {
  const { isListening, isAiEnabled, isProcessing, toggleMic } = usepathscribeSpeech();

  const getStateStyles = () => {
    if (!isListening) return { border: '#334155', icon: '#f1f5f9', glow: 'transparent' };
    
    // AI Mode (Green)
    if (isAiEnabled) return { border: '#14b8a6', icon: '#14b8a6', glow: 'rgba(20, 184, 166, 0.25)' };
    
    // Local Mode (Yellow)
    return { border: '#eab308', icon: '#eab308', glow: 'rgba(234, 179, 8, 0.25)' };
  };

  const styles = getStateStyles();

  return (
    <div className="flex items-center">
      <button
        onClick={toggleMic}
        className="ps-nav-btn"
        style={{
          borderColor: styles.border,
          color: styles.icon,
          boxShadow: isListening ? `0 0 15px ${styles.glow}` : 'none',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isListening ? (
          <Mic size={20} strokeWidth={2.5} />
        ) : (
          <MicOff size={20} />
        )}

        {/* AI Badge - Appears on FIRST click (Green mode) */}
        {isListening && isAiEnabled && (
          <div
            style={{
              position: 'absolute',
              top: '-7px',
              right: '-7px',
              backgroundColor: '#14b8a6', // Matching the Green/Teal
              color: '#020617',
              fontSize: '8px',
              fontWeight: 900,
              padding: '1px 4px',
              borderRadius: '4px',
              border: '2px solid #0f172a', // Matches Navbar background
              lineHeight: 1
            }}
          >
            AI
          </div>
        )}
      </button>
    </div>
  );
};

export default VoiceControl;
