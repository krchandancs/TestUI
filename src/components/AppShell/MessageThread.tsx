/**
 * MessageThread.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Right panel: subject header, meta row, chat bubbles, reply bar.
 * All inline styles removed — uses messaging.css / pathscribe.css classes.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../../services/messages/IMessageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  message:        Message;
  userId:         string;
  onSend:         (text: string) => void;
  onDelete:       () => void;
  onMarkUnread:   () => void;
  isListening:    boolean;
  onVoiceTrigger: () => void;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const IconMic = ({ active }: { active: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
);

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const IconDot = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="19" cy="12" r="1" fill="currentColor"/>
    <circle cx="5"  cy="12" r="1" fill="currentColor"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageThread: React.FC<Props> = ({
  message, userId, onSend, onDelete, onMarkUnread, isListening, onVoiceTrigger,
}) => {
  const [replyText, setReplyText] = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const bubbleEndRef = useRef<HTMLDivElement>(null);
  const navigate     = useNavigate();

  // Auto-scroll to bottom when thread updates
  useEffect(() => {
    bubbleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message.thread]);

  const handleSend = () => {
    const t = replyText.trim();
    if (!t) return;
    onSend(t);
    setReplyText('');
  };

  const thread = message.thread?.length
    ? message.thread
    : [{ senderId: message.senderId, sender: message.senderName, text: message.body, timestamp: message.timestamp }];

  return (
    <div className="ps-msg-thread-panel">

      {/* Header */}
      <div className="ps-msg-thread-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="ps-msg-thread-subject">{message.subject}</div>
            {message.isUrgent && <span className="ps-msg-urgent-tag">⚡ Urgent</span>}
            {message.caseNumber && (
              <span className="ps-msg-case-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Case {message.caseNumber}
              </span>
            )}
            {message.configLink && (
              <button
                onClick={() => navigate(message.configLink!)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid rgba(99,102,241,0.4)',
                  background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                  fontFamily: 'inherit', lineHeight: 1.4,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
                title="Open configuration page"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Open Configuration
              </button>
            )}
          </div>

          <div className="ps-msg-thread-meta">
            <span className="ps-msg-thread-meta-item">
              From: <strong>{message.senderName}</strong>
            </span>
            <span className="ps-msg-thread-meta-item">
              To: <strong>{message.recipientName}</strong>
            </span>
            <span className="ps-msg-thread-meta-item">
              {new Date(message.timestamp).toLocaleString([], {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Thread actions */}
        <div className="ps-msg-thread-actions" style={{ position: 'relative' }}>
          <button
            className="ps-msg-icon-btn"
            onClick={() => setMenuOpen(v => !v)}
            title="More options"
          >
            <IconDot />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50,
              background: 'var(--msg-surface-2)',
              border: '1px solid var(--msg-border-hover)',
              borderRadius: 10, overflow: 'hidden', minWidth: 180,
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            }}>
              {([
                { label: 'Mark as unread', icon: <span style={{ fontSize: 14 }}>●</span>,    action: () => { onMarkUnread(); setMenuOpen(false); }, danger: false },
                { label: 'Delete message', icon: <span style={{ fontSize: 14, display: 'flex', alignItems: 'center' }}><IconTrash /></span>, action: () => { onDelete(); setMenuOpen(false); }, danger: true  },
              ] as { label: string; icon: React.ReactNode; action: () => void; danger: boolean }[]).map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '11px 14px', background: 'none', border: 'none',
                    color: item.danger ? 'var(--msg-urgent)' : 'var(--msg-text)',
                    fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid var(--msg-border)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bubbles */}
      <div className="ps-msg-bubbles">
        {thread.map((t, i) => {
          const isMe = t.senderId === userId;
          return (
            <div key={i} className={`ps-msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
              <div className="ps-msg-bubble-meta" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <span>{t.sender}</span>
                <span>·</span>
                <span>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`ps-msg-bubble ${isMe ? 'me' : 'them'}`}>
                {t.text}
              </div>
            </div>
          );
        })}
        <div ref={bubbleEndRef} />
      </div>

      {/* Reply bar */}
      <div className="ps-msg-reply-bar">
        <div className="ps-msg-reply-inner">
          <button
            className={`ps-msg-reply-icon-btn${isListening ? ' listening' : ''}`}
            onClick={onVoiceTrigger}
            title={isListening ? 'Stop voice input' : 'Voice reply'}
          >
            <IconMic active={isListening} />
          </button>

          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a reply…"
          />

          <button
            className="ps-msg-send-btn"
            onClick={handleSend}
            disabled={!replyText.trim()}
            title="Send reply"
          >
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
};
