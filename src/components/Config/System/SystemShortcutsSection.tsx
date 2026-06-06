/**
 * SystemShortcutsSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Inline keyboard shortcuts editor for the System configuration tab.
 *
 * Architecture role:
 *   KeyboardShortcutsModal was originally a standalone full-screen overlay.
 *   This component re-implements the same functionality inline — no fixed
 *   overlay, no close button, compact width — so it sits naturally inside
 *   the System tab section panel alongside Flags, LIS, etc.
 *
 *   KeyboardShortcutsModal itself is unchanged and remains available as a
 *   standalone modal elsewhere (e.g. triggered from the editor toolbar).
 *
 * State:
 *   Shortcuts are owned here and persisted to localStorage on every change.
 *   Merges with DEFAULT_SHORTCUTS on load so new commands always have a value.
 *
 * Consumed by:
 *   components/Config/System/index.tsx  (renders this as the 'shortcuts' section)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { ShortcutMap, Shortcut } from './KeyboardShortcutsModal';

// ─── Persistence ──────────────────────────────────────────────────────────────

const SHORTCUTS_LS_KEY = 'pathscribe_shortcuts_v1';

const DEFAULT_SHORTCUTS: ShortcutMap = {
  bold:             { ctrl: true,  shift: true,  alt: false, meta: false, key: 'B' },
  italic:           { ctrl: true,  shift: true,  alt: false, meta: false, key: 'I' },
  underline:        { ctrl: true,  shift: true,  alt: false, meta: false, key: 'U' },
  bullets:          { ctrl: false, shift: false, alt: true,  meta: false, key: '8' },
  numbering:        { ctrl: false, shift: false, alt: true,  meta: false, key: '7' },
  increaseIndent:   { ctrl: true,  shift: false, alt: false, meta: false, key: ']' },
  decreaseIndent:   { ctrl: true,  shift: false, alt: false, meta: false, key: '[' },
  insertMacro:      { ctrl: false, shift: false, alt: true,  meta: false, key: 'M' },
  insertTable:      { ctrl: false, shift: true,  alt: false, meta: false, key: 'T' },
  insertSignature:  { ctrl: false, shift: true,  alt: false, meta: false, key: 'S' },
  find:             { ctrl: true,  shift: false, alt: false, meta: false, key: 'F' },
  replace:          { ctrl: true,  shift: true,  alt: false, meta: false, key: 'F' },
  selectAll:        { ctrl: true,  shift: false, alt: false, meta: false, key: 'A' },
  showRuler:        { ctrl: true,  shift: false, alt: true,  meta: false, key: 'R' },
  toggleFormatting: { ctrl: true,  shift: true,  alt: false, meta: false, key: 'P' },
};

const loadShortcuts = (): ShortcutMap => {
  try {
    const raw = localStorage.getItem(SHORTCUTS_LS_KEY);
    if (raw) return { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) };
  } catch { /* fall through */ }
  return { ...DEFAULT_SHORTCUTS };
};

const saveShortcuts = (map: ShortcutMap) => {
  try { localStorage.setItem(SHORTCUTS_LS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatShortcut = (s: Shortcut): string => {
  if (!s.key) return 'Unassigned';
  const parts: string[] = [];
  if (s.ctrl)  parts.push('Ctrl');
  if (s.shift) parts.push('Shift');
  if (s.alt)   parts.push('Alt');
  if (s.meta)  parts.push('Cmd');
  parts.push(s.key.toUpperCase());
  return parts.join('+');
};

// ─── Groups ───────────────────────────────────────────────────────────────────

const GROUPS: { title: string; commands: { id: string; label: string }[] }[] = [
  {
    title: 'Reporting Actions',
    commands: [
      { id: 'insertMacro',     label: 'Insert Macro'          },
      { id: 'insertTable',     label: 'Insert Table'          },
      { id: 'insertSignature', label: 'Insert Signature Line' },
    ],
  },
  {
    title: 'Text Formatting',
    commands: [
      { id: 'bold',      label: 'Bold'      },
      { id: 'italic',    label: 'Italic'    },
      { id: 'underline', label: 'Underline' },
    ],
  },
  {
    title: 'Paragraph Structure',
    commands: [
      { id: 'bullets',        label: 'Bullets'         },
      { id: 'numbering',      label: 'Numbered List'   },
      { id: 'increaseIndent', label: 'Increase Indent' },
      { id: 'decreaseIndent', label: 'Decrease Indent' },
    ],
  },
  {
    title: 'Navigation & Editing',
    commands: [
      { id: 'find',      label: 'Find'       },
      { id: 'replace',   label: 'Replace'    },
      { id: 'selectAll', label: 'Select All' },
    ],
  },
  {
    title: 'View Controls',
    commands: [
      { id: 'showRuler',        label: 'Show / Hide Ruler'            },
      { id: 'toggleFormatting', label: 'Show / Hide Formatting Marks' },
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

const SystemShortcutsSection: React.FC = () => {
  const [shortcuts,      setShortcutsState] = useState<ShortcutMap>(loadShortcuts);
  const [search,         setSearch]         = useState('');
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [tempShortcut,   setTempShortcut]   = useState<Shortcut | null>(null);
  const [conflict,       setConflict]       = useState<string | null>(null);
  const [savedFlash,     setSavedFlash]     = useState(false);

  const setShortcuts = (map: ShortcutMap) => {
    setShortcutsState(map);
    saveShortcuts(map);
  };

  // Capture keydown while editing
  useEffect(() => {
    if (!editingCommand) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const candidate: Shortcut = {
        ctrl:  e.ctrlKey,
        shift: e.shiftKey,
        alt:   e.altKey,
        meta:  e.metaKey,
        key:   e.key.length === 1 ? e.key.toUpperCase() : null,
      };
      setTempShortcut(candidate);
      const candidateStr = JSON.stringify(candidate);
      const conflictCmd = Object.entries(shortcuts).find(
        ([cmd, sc]) => cmd !== editingCommand && JSON.stringify(sc) === candidateStr
      )?.[0] ?? null;
      setConflict(conflictCmd);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingCommand, shortcuts]);

  const applyShortcut = () => {
    if (!editingCommand || !tempShortcut || conflict) return;
    setShortcuts({ ...shortcuts, [editingCommand]: tempShortcut });
    setEditingCommand(null);
    setTempShortcut(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const resetDefaults = () => {
    setShortcuts({ ...DEFAULT_SHORTCUTS });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div style={{ padding: '4px 0', maxWidth: '520px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            Customise shortcuts for common editor actions. Changes save automatically.
          </p>
        </div>
        {savedFlash && (
          <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, paddingTop: '4px', flexShrink: 0, marginLeft: '12px' }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* ── Search ── */}
      <input
        type="text"
        placeholder="Search commands…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: '16px',
          borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
          fontSize: '13px', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* ── Groups ── */}
      {GROUPS.map(group => {
        const filtered = group.commands.filter(cmd =>
          cmd.label.toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length === 0) return null;

        return (
          <div key={group.title} style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#0891B2',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              marginBottom: '8px', paddingLeft: '2px',
            }}>
              {group.title}
            </div>

            {filtered.map(cmd => (
              <div key={cmd.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', marginBottom: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '7px', background: 'rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '13px', color: '#DEE4E7', fontWeight: 500 }}>
                  {cmd.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '5px',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#94a3b8', fontSize: '12px',
                    fontFamily: 'monospace', whiteSpace: 'nowrap',
                  }}>
                    {formatShortcut(shortcuts[cmd.id])}
                  </span>
                  <button
                    onClick={() => {
                      setEditingCommand(cmd.id);
                      setTempShortcut(null);
                      setConflict(null);
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      background: '#0891B2', border: 'none',
                      color: 'white', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0e7490'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0891B2'}
                  >
                    Change
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* ── Reset button ── */}
      <button
        onClick={resetDefaults}
        style={{
          width: '100%', padding: '9px', borderRadius: '7px',
          background: 'rgba(8,145,178,0.1)',
          border: '1px solid rgba(8,145,178,0.3)',
          color: '#0891B2', fontWeight: 600, fontSize: '13px',
          cursor: 'pointer', marginTop: '4px',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
      >
        Reset to Defaults
      </button>

      {/* ── Key capture overlay (small centred modal, not full screen) ── */}
      {editingCommand && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            padding: '32px', background: '#111', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)', width: '340px', textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
              Press new shortcut…
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              for <strong style={{ color: '#0891B2' }}>
                {GROUPS.flatMap(g => g.commands).find(c => c.id === editingCommand)?.label}
              </strong>
            </p>

            <div style={{
              padding: '10px 16px', background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px', fontSize: '15px', fontFamily: 'monospace',
              color: '#f1f5f9', marginBottom: '12px', minHeight: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tempShortcut
                ? formatShortcut(tempShortcut)
                : <span style={{ color: '#475569' }}>Waiting…</span>
              }
            </div>

            {conflict && (
              <div style={{ color: '#F59E0B', fontSize: '12px', marginBottom: '12px' }}>
                ⚠ Conflicts with: <strong>{conflict}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => { setEditingCommand(null); setTempShortcut(null); }}
                style={{
                  padding: '8px 16px', borderRadius: '7px',
                  background: 'transparent', border: '1px solid #475569',
                  color: '#94a3b8', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={!tempShortcut || !!conflict}
                onClick={applyShortcut}
                style={{
                  padding: '8px 16px', borderRadius: '7px', border: 'none',
                  background: !tempShortcut || conflict ? '#1e293b' : '#0891B2',
                  color: !tempShortcut || conflict ? '#475569' : 'white',
                  fontWeight: 600, fontSize: '13px',
                  cursor: !tempShortcut || conflict ? 'not-allowed' : 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemShortcutsSection;
