/**
 * LookupModal.tsx — src/components/Common/LookupModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared full-screen search-and-select modal used across pathscribe.
 * Currently used by: SearchPage (SNOMED, ICD-10, ICD-O, Specimen, Synoptic,
 *                                Flags, Pathologist, Attending)
 *
 * Usage:
 *   <LookupModal
 *     title="SNOMED CT"
 *     subtitle="Select clinical findings or morphology codes"
 *     onClose={() => setOpen(false)}
 *   >
 *     <CodeLookupContent ... />
 *   </LookupModal>
 *
 * The modal shell handles:
 *   - Fixed full-screen overlay with blur backdrop
 *   - Close on overlay click or Escape key
 *   - Consistent header with title, subtitle, selection count, and close button
 *   - Scrollable content area via .ps-scroll
 *
 * Content is passed as children — see the *Content components below for
 * reusable content implementations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import '../../pathscribe.css';

// ─── Shell ────────────────────────────────────────────────────────────────────

interface LookupModalProps {
  title:       string;
  subtitle?:   string;
  selectedCount?: number;   // shown as "N selected" badge in header
  onClose:     () => void;
  children:    React.ReactNode;
}

export const LookupModal: React.FC<LookupModalProps> = ({
  title, subtitle, selectedCount, onClose, children,
}) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '680px', maxWidth: '92vw',
          height: '82vh',
          maxHeight: '82vh',
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>{title}</span>
              {selectedCount != null && selectedCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: 'rgba(8,145,178,0.2)',
                  border: '1px solid rgba(8,145,178,0.4)',
                  color: '#7dd3fc',
                  borderRadius: 99, padding: '2px 9px',
                }}>
                  {selectedCount} selected
                </span>
              )}
            </div>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, color: '#64748b', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: '4px 9px', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >×</button>
        </div>

        {/* Content — scrollable */}
        <div className="ps-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer — Done button */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 28px',
              borderRadius: 8,
              border: 'none',
              background: '#22c55e',
              color: '#022c22',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#22c55e'; }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Shared search input used inside content components ───────────────────────

interface LookupSearchProps {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
}

export const LookupSearch: React.FC<LookupSearchProps> = ({ value, onChange, placeholder = 'Search…' }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div style={{ position: 'relative', margin: '16px 24px 12px' }}>
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 12px 9px 32px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(8,145,178,0.5)'}
        onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16,
        }}>×</button>
      )}
    </div>
  );
};

// ─── LookupItem — single row used by all content types ───────────────────────

interface LookupItemProps {
  selected:  boolean;
  onToggle:  () => void;
  primary:   string;
  secondary?: string;
  badge?:    string;
  badgeColor?: string;
}

export const LookupItem: React.FC<LookupItemProps> = ({
  selected, onToggle, primary, secondary, badge, badgeColor = '#0891B2',
}) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 24px', cursor: 'pointer',
      background: selected ? 'rgba(8,145,178,0.12)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: selected ? '2px solid #0891B2' : '2px solid transparent',
      transition: 'all 0.12s',
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = selected ? 'rgba(8,145,178,0.12)' : 'transparent'; }}
  >
    {/* Label */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 13, color: selected ? '#7dd3fc' : '#e2e8f0', fontWeight: selected ? 600 : 400 }}>{primary}</span>
      {secondary && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{secondary}</span>}
    </div>

    {/* Badge */}
    {badge && (
      <span style={{
        fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
        color: badgeColor, background: `${badgeColor}18`,
        border: `1px solid ${badgeColor}30`,
        borderRadius: 6, padding: '2px 7px', flexShrink: 0,
      }}>{badge}</span>
    )}

    {/* Checkmark — only shown when selected */}
    <div style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {selected && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="7" fill="#0891B2"/>
          <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  </div>
);

// ─── Section divider used inside grouped content ──────────────────────────────

export const LookupSection: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div style={{
    padding: '10px 24px 6px',
    display: 'flex', alignItems: 'center', gap: 8,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  }}>
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#475569' }}>{label}</span>
    <span style={{ fontSize: 10, color: '#334155', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '1px 6px' }}>{count}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

export const LookupEmpty: React.FC<{ query: string }> = ({ query }) => (
  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#475569' }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>No results for "{query}"</div>
    <div style={{ fontSize: 12, marginTop: 4 }}>Try a shorter or different search term</div>
  </div>
);
