/**
 * MessageSidebar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Left panel: header w/ badge + edit toggle, search bar, message list,
 * compose + secure-email buttons at the bottom.
 *
 * All inline styles removed — uses CSS classes from messaging.css / pathscribe.css
 */

import React, { useState, useMemo } from 'react';
import { Message } from '../../services/messages/IMessageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageSidebarProps {
  messages:         Message[];
  selectedId:       string | null;
  unreadCount:      number;
  hasUrgent:        boolean;
  editMode:         boolean;
  selectedIds:      Set<string>;
  onSelect:         (id: string) => void;
  onCompose:        () => void;
  onSecureEmail:    () => void;
  onToggleEdit:     () => void;
  onToggleCheck:    (id: string) => void;
  onDeleteSelected: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string): string => {
  const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').split(' ');
  return parts.filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
};

const relativeTime = (ts: Date): string => {
  const d      = new Date(ts);
  const now    = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageSidebar: React.FC<MessageSidebarProps> = ({
  messages, selectedId, unreadCount, hasUrgent,
  editMode, selectedIds,
  onSelect, onCompose, onSecureEmail, onToggleEdit, onToggleCheck, onDeleteSelected,
}) => {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const base = messages.filter(m => !m.isDeleted);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(m =>
      m.senderName.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q)    ||
      m.body.toLowerCase().includes(q)
    );
  }, [messages, query]);

  return (
    <div className="ps-msg-sidebar">

      {/* Header */}
      <div className="ps-msg-sidebar-header">
        <div className="ps-msg-sidebar-title">
          Messages
          {unreadCount > 0 && (
            <span className={`ps-msg-unread-badge${hasUrgent ? ' urgent' : ''}`}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="ps-msg-header-actions">
          {editMode && selectedIds.size > 0 && (
            <button className="ps-msg-edit-delete-btn" onClick={onDeleteSelected} title="Delete selected">
              <IconTrash /> Delete ({selectedIds.size})
            </button>
          )}
          <button
            className={`ps-msg-icon-btn${editMode ? ' active' : ''}`}
            onClick={onToggleEdit}
            title={editMode ? 'Done editing' : 'Edit / select messages'}
          >
            {editMode
              ? <span style={{ fontSize: 12, fontWeight: 700, padding: '0 2px' }}>Done</span>
              : <IconPencil />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="ps-msg-search-wrap">
        <div className="ps-msg-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search messages…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="ps-msg-icon-btn" onClick={() => setQuery('')} style={{ fontSize: 16, padding: '0 3px' }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="ps-msg-list">
        {visible.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--msg-muted)', fontSize: 13 }}>
            {query ? 'No messages match your search.' : 'Your inbox is empty.'}
          </div>
        ) : visible.map(m => {
          const rowClass = [
            'ps-msg-row',
            selectedId === m.id ? 'selected'   : '',
            !m.isRead           ? 'unread'     : '',
            m.isUrgent          ? 'urgent-row' : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={m.id}
              className={rowClass}
              onClick={() => editMode ? onToggleCheck(m.id) : onSelect(m.id)}
            >
              {editMode && (
                <div className={`ps-msg-row-checkbox${selectedIds.has(m.id) ? ' checked' : ''}`}>
                  {selectedIds.has(m.id) && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="2,6 5,9 10,3"/>
                    </svg>
                  )}
                </div>
              )}

              <div className={`ps-msg-avatar${m.isUrgent ? ' urgent-avatar' : ''}`}>
                {initials(m.senderName)}
              </div>

              <div className="ps-msg-row-body">
                <div className="ps-msg-row-top">
                  <span className="ps-msg-row-sender">{m.senderName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {m.isUrgent && <span className="ps-msg-urgent-pill">Urgent</span>}
                    <span className="ps-msg-row-time">{relativeTime(new Date(m.timestamp))}</span>
                  </div>
                </div>
                <div className="ps-msg-row-subject">{m.subject}</div>
                <div className="ps-msg-row-preview">{m.body}</div>
              </div>

              {!m.isRead && !editMode && <div className="ps-msg-unread-dot" />}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="ps-msg-compose-row">
        <button className="ps-msg-compose-btn" onClick={onCompose}>
          <IconPencil /> New Message
        </button>
        <button
          className="ps-msg-email-btn"
          onClick={onSecureEmail}
          title="Send secure external email"
        >
          <IconLock /><IconMail />
        </button>
      </div>
    </div>
  );
};
