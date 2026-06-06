import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import '../../pathscribe.css';
import { X } from "../Icons";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
  IndentIncrease, IndentDecrease,
  Heading1, Heading2, Heading3,
  Highlighter, Baseline,
  Table as TableIcon,
  Search,
  Undo2, Redo2,
  Ruler as RulerIcon, PilcrowSquare,
  Zap, PenLine,
  ArrowUpDown, PaintBucket, SquareDashedBottom,
  SplitSquareHorizontal,
  Rows3, Columns3, Combine,
} from 'lucide-react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Macro {
  id: string;
  trigger: string;
  name: string;
  content: string;
}

export interface PathScribeEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  approvedFonts?: string[];
  macros?: Macro[];
  placeholder?: string;
  showRulerDefault?: boolean;
  minHeight?: string;
  readOnly?: boolean;
}

// ─── IMPERATIVE HANDLE ────────────────────────────────────────────────────────
// Exposed via forwardRef so the Orchestrator Engine and NarrativeEditor
// can drive the editor programmatically without going through React props.

export interface PathScribeEditorHandle {
  /** Raw Tiptap Editor instance — use for operations not covered below */
  getEditor: () => Editor | null;

  /** Insert HTML at a specific document position (undo/redo safe) */
  insertAtPos: (pos: number, html: string) => void;

  /** Append a single streaming token at the current end of the document */
  appendToken: (token: string) => void;

  /** Replace entire editor content */
  setContent: (html: string) => void;

  /** Clear all content */
  clearContent: () => void;

  /** Focus the editor */
  focus: () => void;

  /** Returns whether the editor is currently editable */
  isEditable: () => boolean;

  /**
   * Lock or unlock the editor.
   * Pass false while the Orchestrator is streaming to prevent
   * user edits from conflicting with AI insertion.
   */
  setEditable: (editable: boolean) => void;
}

// ─── MACRO HOTKEY EXTENSION ───────────────────────────────────────────────────

const createMacroExtension = (
  macros: Macro[],
  onUnknownTrigger: (partial: string) => void
) =>
  Extension.create({
    name: 'macroHotkey',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('macroHotkey'),
          props: {
            handleKeyDown(view, event) {
              if (event.key !== ' ' && event.key !== 'Enter') return false;

              const { state } = view;
              const { $from } = state.selection;
              const textBefore = $from.nodeBefore?.text ?? '';

              const match = textBefore.match(/(;[a-zA-Z0-9]+)$/);
              if (!match) return false;

              const typed = match[1];
              const macro = macros.find(m => m.trigger === typed);

              if (macro) {
                const from = $from.pos - typed.length;
                const to = $from.pos;
                const { tr } = state;
                tr.delete(from, to);
                view.dispatch(tr);

                view.dom.dispatchEvent(
                  new CustomEvent('insertMacroContent', {
                    detail: { content: macro.content },
                    bubbles: true,
                  })
                );

                if (event.key === ' ') event.preventDefault();
                return true;
              }

              if (typed.length > 1) {
                onUnknownTrigger(typed);
              }

              return false;
            },
          },
        }),
      ];
    },
  });

// ─── TAB KEY EXTENSION ────────────────────────────────────────────────────────

const TAB_DEFAULT_PX = 48;

const createTabExtension = (
  tabStops: { pos: number; type: 'left' | 'center' | 'right' | 'decimal' }[],
  pageWidthPx: number
) =>
  Extension.create({
    name: 'tabKey',
    addKeyboardShortcuts() {
      return {
        Tab: ({ editor }) => {
          const { $from } = editor.state.selection;
          const cursorRatio = $from.pos / Math.max(1, editor.state.doc.content.size);
          const cursorPx = cursorRatio * pageWidthPx;

          const stopsPx = tabStops
            .map(t => (t.pos / 8.5) * pageWidthPx)
            .sort((a, b) => a - b);

          const nextStop = stopsPx.find(px => px > cursorPx + 4);
          const tabWidthPx = nextStop != null ? nextStop - cursorPx : TAB_DEFAULT_PX;
          const width = Math.max(8, Math.min(tabWidthPx, pageWidthPx));

          editor
            .chain()
            .focus()
            .insertContent(
              `<span class="ps-tab" style="display:inline-block;width:${Math.round(width)}px;white-space:pre"> </span>`
            )
            .run();

          return true;
        },
        'Shift-Tab': ({ editor }) => {
          if (editor.can().liftListItem('listItem')) {
            editor.chain().focus().liftListItem('listItem').run();
            return true;
          }
          return true;
        },
      };
    },
  });

// ─── RULER COMPONENT ──────────────────────────────────────────────────────────

interface RulerProps {
  marginLeft: number;
  marginRight: number;
  leftIndent: number;
  firstLineIndent: number;
  rightIndent: number;
  tabStops: { pos: number; type: 'left' | 'center' | 'right' | 'decimal' }[];
  onMarginLeftChange: (v: number) => void;
  onMarginRightChange: (v: number) => void;
  onLeftIndentChange: (v: number) => void;
  onFirstLineIndentChange: (v: number) => void;
  onRightIndentChange: (v: number) => void;
  onAddTabStop: (pos: number) => void;
  onRemoveTabStop: (pos: number) => void;
  pageWidthPx: number;
}

const Ruler: React.FC<RulerProps> = ({
  marginLeft, marginRight, leftIndent, firstLineIndent, rightIndent,
  tabStops, onMarginLeftChange, onMarginRightChange, onLeftIndentChange,
  onFirstLineIndentChange, onRightIndentChange, onAddTabStop, onRemoveTabStop, pageWidthPx,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const dragStart = useRef(0);
  const dragStartVal = useRef(0);
  const [tabType, setTabType] = useState<'left' | 'center' | 'right' | 'decimal'>('left');

  const inchesTotal = 8.5;
  const pxPerInch = pageWidthPx / inchesTotal;
  const toPixel = (inches: number) => inches * pxPerInch;
  const toInches = (px: number) => px / pxPerInch;

  const handleMouseDown = (e: React.MouseEvent, which: string, currentVal: number) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = which;
    dragStart.current = e.clientX;
    dragStartVal.current = currentVal;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = toInches(e.clientX - dragStart.current);
      const newVal = Math.max(0, Math.min(8.5, dragStartVal.current + delta));
      if (dragging.current === 'marginLeft')    onMarginLeftChange(+newVal.toFixed(2));
      if (dragging.current === 'marginRight')   onMarginRightChange(+newVal.toFixed(2));
      if (dragging.current === 'leftIndent')    onLeftIndentChange(+newVal.toFixed(2));
      if (dragging.current === 'firstLine')     onFirstLineIndentChange(+newVal.toFixed(2));
      if (dragging.current === 'rightIndent')   onRightIndentChange(+newVal.toFixed(2));
    };
    const onMouseUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [pxPerInch]);

  const handleRulerClick = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const inches = toInches(clickX);
    if (inches > marginLeft && inches < inchesTotal - marginRight) {
      const existing = tabStops.find(t => Math.abs(t.pos - inches) < 0.1);
      if (existing) onRemoveTabStop(existing.pos);
      else onAddTabStop(+inches.toFixed(2));
    }
  };

  const ticks = [];
  for (let i = 0; i <= 8.5; i += 0.125) {
    const isMajor = i % 1 === 0;
    const isHalf = i % 0.5 === 0 && !isMajor;
    const isQuarter = i % 0.25 === 0 && !isMajor && !isHalf;
    ticks.push({ pos: i, isMajor, isHalf, isQuarter });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 4px 0' }}>
      <div style={{ width: '24px', height: '24px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#475569', userSelect: 'none', flexShrink: 0 }}
        title={`Tab type: ${tabType}`}
        onClick={() => {
          const types: typeof tabType[] = ['left', 'center', 'right', 'decimal'];
          const idx = types.indexOf(tabType);
          setTabType(types[(idx + 1) % types.length]);
        }}
      >
        {tabType === 'left' ? 'L' : tabType === 'center' ? 'C' : tabType === 'right' ? 'R' : 'D'}
      </div>

      <div ref={rulerRef} onClick={handleRulerClick}
        style={{ position: 'relative', width: `${pageWidthPx}px`, height: '28px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'visible', cursor: 'crosshair', userSelect: 'none', flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: toPixel(marginLeft), height: '100%', background: '#e2e8f0', borderRadius: '4px 0 0 4px' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: toPixel(marginRight), height: '100%', background: '#e2e8f0', borderRadius: '0 4px 4px 0' }} />

        {ticks.map(tick => (
          <div key={tick.pos} style={{ position: 'absolute', left: toPixel(tick.pos), bottom: 0, width: '1px', height: tick.isMajor ? '14px' : tick.isHalf ? '10px' : tick.isQuarter ? '7px' : '5px', background: tick.isMajor ? '#475569' : '#94a3b8' }}>
            {tick.isMajor && tick.pos > 0 && tick.pos < 8.5 && (
              <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{tick.pos}"</div>
            )}
          </div>
        ))}

        {tabStops.map(tab => (
          <div key={tab.pos} style={{ position: 'absolute', left: toPixel(tab.pos) - 5, top: 2, width: 10, height: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#0891B2', fontWeight: 700, zIndex: 10 }}
            title="Click to remove tab stop"
            onClick={e => { e.stopPropagation(); onRemoveTabStop(tab.pos); }}
          >
            {tab.type === 'left' ? 'L' : tab.type === 'center' ? 'C' : tab.type === 'right' ? 'R' : 'D'}
          </div>
        ))}

        <div onMouseDown={e => handleMouseDown(e, 'marginLeft', marginLeft)} style={{ position: 'absolute', left: toPixel(marginLeft) - 5, top: 0, width: 10, height: '100%', cursor: 'ew-resize', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 2, height: 20, background: '#0891B2', borderRadius: 2 }} />
        </div>
        <div onMouseDown={e => handleMouseDown(e, 'marginRight', marginRight)} style={{ position: 'absolute', right: toPixel(marginRight) - 5, top: 0, width: 10, height: '100%', cursor: 'ew-resize', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 2, height: 20, background: '#0891B2', borderRadius: 2 }} />
        </div>
        <div onMouseDown={e => handleMouseDown(e, 'firstLine', firstLineIndent)} title="First Line Indent" style={{ position: 'absolute', left: toPixel(marginLeft + firstLineIndent) - 6, top: 1, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #0891B2', cursor: 'ew-resize', zIndex: 30 }} />
        <div onMouseDown={e => handleMouseDown(e, 'leftIndent', leftIndent)} title="Left Indent (Hanging)" style={{ position: 'absolute', left: toPixel(marginLeft + leftIndent) - 6, bottom: 1, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '8px solid #475569', cursor: 'ew-resize', zIndex: 30 }} />
        <div onMouseDown={e => handleMouseDown(e, 'rightIndent', rightIndent)} title="Right Indent" style={{ position: 'absolute', right: toPixel(marginRight + rightIndent) - 6, bottom: 1, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '8px solid #475569', cursor: 'ew-resize', zIndex: 30 }} />
      </div>
    </div>
  );
};

// ─── TOOLBAR BUTTON ───────────────────────────────────────────────────────────

const TBtn: React.FC<{
  onClick: () => void; isActive?: boolean; title?: string;
  disabled?: boolean; children: React.ReactNode; width?: string;
}> = ({ onClick, isActive, title, disabled, children, width }) => (
  <button onClick={onClick} title={title} disabled={disabled}
    style={{ padding: '5px 8px', minWidth: width || '30px', height: '28px', background: isActive ? '#0891B2' : 'white', color: isActive ? 'white' : disabled ? '#cbd5e1' : '#1e293b', border: `1px solid ${isActive ? '#0891B2' : '#e2e8f0'}`, borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
    onMouseEnter={e => { if (!isActive && !disabled) e.currentTarget.style.background = '#f1f5f9'; }}
    onMouseLeave={e => { if (!isActive && !disabled) e.currentTarget.style.background = 'white'; }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 4px', flexShrink: 0 }} />
);

// ─── FIND/REPLACE PANEL ───────────────────────────────────────────────────────

const FindReplacePanel: React.FC<{ editor: any; onClose: () => void }> = ({ editor, onClose }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [mode, setMode] = useState<'find' | 'replace'>('find');
  const [matchCount, setMatchCount] = useState(0);

  const doFind = () => {
    if (!findText || !editor) return;
    const html = editor.getHTML();
    const count = (html.match(new RegExp(findText, 'gi')) || []).length;
    setMatchCount(count);
    window.find(findText);
  };

  const doReplaceAll = () => {
    if (!findText || !editor) return;
    const html = editor.getHTML();
    const newHtml = html.replace(new RegExp(findText, 'gi'), replaceText);
    editor.commands.setContent(newHtml);
    setMatchCount(0);
  };

  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMode('find')} style={{ fontSize: '13px', fontWeight: 600, color: mode === 'find' ? '#0891B2' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', borderBottom: mode === 'find' ? '2px solid #0891B2' : '2px solid transparent' }}>Find</button>
          <button onClick={() => setMode('replace')} style={{ fontSize: '13px', fontWeight: 600, color: mode === 'replace' ? '#0891B2' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', borderBottom: mode === 'replace' ? '2px solid #0891B2' : '2px solid transparent' }}>Replace</button>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>✕</button>
      </div>
      <input value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === 'Enter' && doFind()} placeholder="Find..." autoFocus style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
      {mode === 'replace' && <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />}
      {matchCount > 0 && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{matchCount} match(es) found</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={doFind} style={{ flex: 1, padding: '8px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{mode === 'find' ? 'Find Next' : 'Find'}</button>
        {mode === 'replace' && <button onClick={doReplaceAll} style={{ flex: 1, padding: '8px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Replace All</button>}
      </div>
    </div>
  );
};

// ─── INSERT TABLE MODAL ───────────────────────────────────────────────────────

const InsertTableModal: React.FC<{ onInsert: (rows: number, cols: number) => void; onClose: () => void }> = ({ onInsert, onClose }) => {
  const [hovered, setHovered] = useState<{ rows: number; cols: number } | null>(null);
  const maxR = 8, maxC = 10;
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>{hovered ? `${hovered.rows} × ${hovered.cols} table` : 'Select table size'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxC}, 20px)`, gap: '2px' }}>
        {Array.from({ length: maxR }, (_, r) =>
          Array.from({ length: maxC }, (_, c) => (
            <div key={`${r}-${c}`} onMouseEnter={() => setHovered({ rows: r + 1, cols: c + 1 })} onMouseLeave={() => setHovered(null)} onClick={() => { onInsert(r + 1, c + 1); onClose(); }} style={{ width: 20, height: 20, background: hovered && r < hovered.rows && c < hovered.cols ? '#0891B2' : '#f1f5f9', border: `1px solid ${hovered && r < hovered.rows && c < hovered.cols ? '#0891B2' : '#e2e8f0'}`, borderRadius: '2px', cursor: 'pointer', transition: 'all 0.1s' }} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── MACRO MODAL ─────────────────────────────────────────────────────────────

const MacroModal: React.FC<{ macros: Macro[]; initialSearch?: string; onSelect: (macro: Macro) => void; onClose: () => void }> = ({ macros, initialSearch = '', onSelect, onClose }) => {
  const [search, setSearch] = useState(initialSearch);
  const filtered = macros.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.trigger.toLowerCase().includes(search.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '480px', maxHeight: '70vh', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>⚡ Insert Macro</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px' }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or trigger (e.g. ;gs)..." autoFocus style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>No macros found</div>
          ) : filtered.map(macro => (
            <button key={macro.id} onClick={() => { onSelect(macro); onClose(); }} style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#0891B2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#0891B2', background: 'rgba(8,145,178,0.1)', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{macro.trigger}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{macro.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{macro.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 80)}...</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SPACING DROPDOWN ─────────────────────────────────────────────────────────

const SpacingDropdown: React.FC<{ editor: any; onClose: () => void }> = ({ editor, onClose }) => {
  const lineSpacings = [{ label: 'Single (1.0)', value: '1' }, { label: '1.15', value: '1.15' }, { label: '1.5', value: '1.5' }, { label: 'Double (2.0)', value: '2' }];
  const setLineHeight = (_lh: string) => { if (!editor) return; editor.chain().focus().run(); onClose(); };
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Line Spacing</div>
      {lineSpacings.map(s => (
        <button key={s.value} onClick={() => setLineHeight(s.value)} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{s.label}</button>
      ))}
      <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0', paddingTop: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '0 8px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paragraph Spacing</div>
        <button onClick={() => { editor?.chain().focus().run(); onClose(); }} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>Add Space Before</button>
        <button onClick={() => { editor?.chain().focus().run(); onClose(); }} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>Add Space After</button>
      </div>
    </div>
  );
};

// ─── COLOR PICKER ─────────────────────────────────────────────────────────────

const COLORS = [
  '#000000', '#1e293b', '#475569', '#94a3b8', '#e2e8f0', '#ffffff',
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#0891B2', '#7c3aed',
  '#fca5a5', '#fdba74', '#fde68a', '#bbf7d0', '#a5f3fc', '#ddd6fe',
  '#fee2e2', '#ffedd5', '#fef3c7', '#dcfce7', '#e0f2fe', '#ede9fe',
];

const ColorPicker: React.FC<{ onSelect: (color: string) => void; onClose: () => void; title: string }> = ({ onSelect, onClose, title }) => (
  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '176px' }}>
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
      {COLORS.map(color => (
        <div key={color} onClick={() => { onSelect(color); onClose(); }} style={{ width: '24px', height: '24px', background: color, borderRadius: '4px', cursor: 'pointer', border: color === '#ffffff' ? '1px solid #e2e8f0' : '1px solid transparent', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
      ))}
    </div>
    <button onClick={onClose} style={{ marginTop: '10px', width: '100%', padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>No Color</button>
  </div>
);

// ─── BORDER DROPDOWN ──────────────────────────────────────────────────────────

const BorderDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const borders = [
    { label: 'Box Border',    svg: <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="none" stroke="#1e293b" strokeWidth="1.5"/></svg> },
    { label: 'Left Border',   svg: <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="1" x2="1" y2="13" stroke="#1e293b" strokeWidth="2"/><rect x="1" y="1" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/></svg> },
    { label: 'Right Border',  svg: <svg width="14" height="14" viewBox="0 0 14 14"><line x1="13" y1="1" x2="13" y2="13" stroke="#1e293b" strokeWidth="2"/><rect x="1" y="1" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/></svg> },
    { label: 'Top Border',    svg: <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="1" x2="13" y2="1" stroke="#1e293b" strokeWidth="2"/><rect x="1" y="1" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/></svg> },
    { label: 'Bottom Border', svg: <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="13" x2="13" y2="13" stroke="#1e293b" strokeWidth="2"/><rect x="1" y="1" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/></svg> },
    { label: 'No Border',     svg: <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2"/></svg> },
  ];
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px' }}>
      {borders.map(b => (
        <button key={b.label} onClick={onClose} style={{ width: '100%', padding: '7px 12px', textAlign: 'left', background: 'none', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          {b.svg} {b.label}
        </button>
      ))}
    </div>
  );
};

// ─── MAIN EDITOR COMPONENT ───────────────────────────────────────────────────
// Wrapped with forwardRef so the Orchestrator Engine can acquire a ref
// and call imperative methods (insertAtPos, appendToken, setEditable, etc.)
// without going through React props/state.

const PathScribeEditor = forwardRef<PathScribeEditorHandle, PathScribeEditorProps>((
  {
    content = '',
    onChange,
    approvedFonts = ['Arial', 'Times New Roman', 'Courier New', 'Calibri'],
    macros = [],
    placeholder: _placeholder = 'Begin typing or use a macro trigger (e.g. ;gs)...',
    showRulerDefault = true,
    minHeight = '400px',
    readOnly = false,
  },
  ref
) => {
  // ── UI State ──────────────────────────────────────────────────────────────
  const [showRuler, setShowRuler]             = useState(showRulerDefault);
  const [showFormatMarks, setShowFormatMarks] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showMacroModal, setShowMacroModal]   = useState(false);
  const [macroModalSearch, setMacroModalSearch] = useState('');
  const [showFontColor, setShowFontColor]     = useState(false);
  const [showHighlight, setShowHighlight]     = useState(false);
  const [showBorder, setShowBorder]           = useState(false);
  const [showSpacing, setShowSpacing]         = useState(false);
  const [selectedFont, setSelectedFont]       = useState(approvedFonts[0] || 'Arial');
  const [fontSize, setFontSize]               = useState('12');

  // ── Ruler State ───────────────────────────────────────────────────────────
  const [marginLeft, setMarginLeft]               = useState(1.0);
  const [marginRight, setMarginRight]             = useState(1.0);
  const [leftIndent, setLeftIndent]               = useState(0);
  const [firstLineIndent, setFirstLineIndent]     = useState(0);
  const [rightIndent, setRightIndent]             = useState(0);
  const [tabStops, setTabStops]                   = useState<{ pos: number; type: 'left' | 'center' | 'right' | 'decimal' }[]>([]);

  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const pageWidthPx = 680;

  // ── Editor Setup ──────────────────────────────────────────────────────────
  const handleUnknownTrigger = useCallback((partial: string) => {
    setMacroModalSearch(partial);
    setShowMacroModal(true);
  }, []);

  const macroExtension = React.useMemo(
    () => createMacroExtension(macros, handleUnknownTrigger),
    [macros, handleUnknownTrigger]
  );

  const tabExtension = React.useMemo(
    () => createTabExtension(tabStops, pageWidthPx),
    [tabStops, pageWidthPx]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      TextStyle, FontFamily, Color, Underline, Subscript, Superscript,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      macroExtension, tabExtension,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'ps-editor-content', spellcheck: 'true' },
    },
  });

  // ── Imperative handle — exposes the editor to the Orchestrator ────────────
  useImperativeHandle(ref, () => ({
    getEditor: () => editor ?? null,

    insertAtPos: (pos: number, html: string) => {
      editor
        ?.chain()
        .insertContentAt(pos, html, {
          updateSelection: false,
          parseOptions: { preserveWhitespace: 'full' },
        })
        .run();
    },

    appendToken: (token: string) => {
      const end = editor?.state.doc.content.size ?? 0;
      editor
        ?.chain()
        .insertContentAt(end, token, {
          updateSelection: false,
          parseOptions: { preserveWhitespace: 'full' },
        })
        .run();
    },

    setContent: (html: string) => {
      editor?.commands.setContent(html);
    },

    clearContent: () => {
      editor?.commands.clearContent();
    },

    focus: () => {
      editor?.chain().focus().run();
    },

    isEditable: () => editor?.isEditable ?? false,

    setEditable: (editable: boolean) => {
      editor?.setEditable(editable);
    },
  }), [editor]);

  // ── Listen for macro insert events ────────────────────────────────────────
  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper || !editor) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.content) {
        editor.chain().focus().insertContent(detail.content).run();
      }
    };
    wrapper.addEventListener('insertMacroContent', handler);
    return () => wrapper.removeEventListener('insertMacroContent', handler);
  }, [editor]);

  // ── Update content when prop changes ──────────────────────────────────────
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const insertMacro = (macro: Macro) => {
    editor?.chain().focus().insertContent(macro.content).run();
  };

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setShowFindReplace(false); setShowTablePicker(false);
      setShowFontColor(false);   setShowHighlight(false);
      setShowBorder(false);      setShowSpacing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!editor) return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white', minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Loading editor…</span>
    </div>
  );

  const IC = 14;

  const renderToolbar = () => (
    <div onMouseDown={e => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRadius: '10px 10px 0 0' }}>
      <select value={selectedFont} onChange={e => { setSelectedFont(e.target.value); editor.chain().focus().setFontFamily(e.target.value).run(); }} style={{ padding: '3px 6px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: '#1e293b', background: 'white', cursor: 'pointer', maxWidth: '140px' }}>
        {approvedFonts.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={fontSize} onChange={e => setFontSize(e.target.value)} style={{ padding: '3px 4px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', color: '#1e293b', background: 'white', cursor: 'pointer', width: '52px' }}>
        {['8','9','10','11','12','14','16','18','20','24','28','32','36','48','72'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)"><Bold size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)"><Italic size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)"><UnderlineIcon size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript"><SubscriptIcon size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon size={IC} /></TBtn>
      <Divider />
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowFontColor(v => !v); setShowHighlight(false); setShowBorder(false); setShowSpacing(false); }} title="Font Color">
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}><Baseline size={IC} /><span style={{ width: '14px', height: '3px', background: '#dc2626', borderRadius: '1px', marginTop: '1px' }} /></span>
        </TBtn>
        {showFontColor && <ColorPicker title="Font Color" onSelect={color => editor.chain().focus().setColor(color).run()} onClose={() => setShowFontColor(false)} />}
      </div>
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowHighlight(v => !v); setShowFontColor(false); setShowBorder(false); setShowSpacing(false); }} title="Text Highlight Color">
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}><Highlighter size={IC} /><span style={{ width: '14px', height: '3px', background: '#fde047', borderRadius: '1px', marginTop: '1px' }} /></span>
        </TBtn>
        {showHighlight && <ColorPicker title="Highlight" onSelect={color => editor.chain().focus().setHighlight({ color }).run()} onClose={() => setShowHighlight(false)} />}
      </div>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={IC} /></TBtn>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={IC} /></TBtn>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Increase Indent" disabled={!editor.can().sinkListItem('listItem')}><IndentIncrease size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Decrease Indent" disabled={!editor.can().liftListItem('listItem')}><IndentDecrease size={IC} /></TBtn>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={IC} /></TBtn>
      <Divider />
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowSpacing(v => !v); setShowFontColor(false); setShowHighlight(false); setShowBorder(false); }} title="Line & Paragraph Spacing"><ArrowUpDown size={IC} /></TBtn>
        {showSpacing && <SpacingDropdown editor={editor} onClose={() => setShowSpacing(false)} />}
      </div>
      <TBtn onClick={() => setShowFormatMarks(v => !v)} isActive={showFormatMarks} title="Show/Hide Formatting Marks (¶)"><PilcrowSquare size={IC} /></TBtn>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().setHighlight({ color: '#e0f2fe' }).run()} title="Paragraph Shading"><PaintBucket size={IC} /></TBtn>
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowBorder(v => !v); setShowFontColor(false); setShowHighlight(false); setShowSpacing(false); }} title="Borders"><SquareDashedBottom size={IC} /></TBtn>
        {showBorder && <BorderDropdown onClose={() => setShowBorder(false)} />}
      </div>
      <Divider />
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowTablePicker(v => !v); setShowFindReplace(false); }} isActive={showTablePicker} title="Insert Table"><TableIcon size={IC} /></TBtn>
        {showTablePicker && <InsertTableModal onInsert={(rows, cols) => { editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(); }} onClose={() => setShowTablePicker(false)} />}
      </div>
      {editor.isActive('table') && (
        <>
          <Divider />
          <TBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After"><Columns3 size={IC} /></TBtn>
          <TBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After"><Rows3 size={IC} /></TBtn>
          <TBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column"><span style={{ position: 'relative', display: 'inline-flex' }}><Columns3 size={IC} /><X size={8} style={{ position: 'absolute', top: -2, right: -3, color: '#ef4444' }} /></span></TBtn>
          <TBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row"><span style={{ position: 'relative', display: 'inline-flex' }}><Rows3 size={IC} /><X size={8} style={{ position: 'absolute', top: -2, right: -3, color: '#ef4444' }} /></span></TBtn>
          <TBtn onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells"><Combine size={IC} /></TBtn>
          <TBtn onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell"><SplitSquareHorizontal size={IC} /></TBtn>
          <TBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><span style={{ position: 'relative', display: 'inline-flex' }}><TableIcon size={IC} /><X size={8} style={{ position: 'absolute', top: -2, right: -3, color: '#ef4444' }} /></span></TBtn>
        </>
      )}
      <Divider />
      <TBtn onClick={() => { setMacroModalSearch(''); setShowMacroModal(true); }} title="Insert Macro (or type trigger + Space)" width="68px"><Zap size={IC} /><span style={{ fontSize: '11px', fontWeight: 700 }}>Macro</span></TBtn>
      <Divider />
      <TBtn onClick={() => { const sig = `<p><br/></p><p>_____________________________ &nbsp;&nbsp;&nbsp; Date: ___________</p><p><em>Pathologist Signature</em></p><p><br/></p>`; editor.chain().focus().insertContent(sig).run(); }} title="Insert Signature Line"><PenLine size={IC} /></TBtn>
      <Divider />
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <TBtn onClick={() => { setShowFindReplace(v => !v); setShowTablePicker(false); }} isActive={showFindReplace} title="Find & Replace (Ctrl+F)"><Search size={IC} /></TBtn>
        {showFindReplace && <FindReplacePanel editor={editor} onClose={() => setShowFindReplace(false)} />}
      </div>
      <Divider />
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)"><Undo2 size={IC} /></TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)"><Redo2 size={IC} /></TBtn>
      <Divider />
      <TBtn onClick={() => setShowRuler(v => !v)} isActive={showRuler} title="Show/Hide Ruler"><RulerIcon size={IC} /></TBtn>
    </div>
  );

  return (
    <div ref={editorWrapperRef} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
      {renderToolbar()}

      {showRuler && (
        <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', flexShrink: 0 }}>
          <Ruler
            marginLeft={marginLeft} marginRight={marginRight}
            leftIndent={leftIndent} firstLineIndent={firstLineIndent} rightIndent={rightIndent}
            tabStops={tabStops}
            onMarginLeftChange={setMarginLeft} onMarginRightChange={setMarginRight}
            onLeftIndentChange={setLeftIndent} onFirstLineIndentChange={setFirstLineIndent}
            onRightIndentChange={setRightIndent}
            onAddTabStop={pos => setTabStops(prev => [...prev, { pos, type: 'left' }])}
            onRemoveTabStop={pos => setTabStops(prev => prev.filter(t => t.pos !== pos))}
            pageWidthPx={pageWidthPx}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', minHeight, borderRadius: '0 0 12px 12px' }}>
        <EditorContent editor={editor} />
      </div>

      {showMacroModal && (
        <MacroModal macros={macros} initialSearch={macroModalSearch} onSelect={insertMacro} onClose={() => { setShowMacroModal(false); setMacroModalSearch(''); }} />
      )}

      <style>{`
        .ps-editor-content { padding: 20px 24px; min-height: ${minHeight}; outline: none; font-size: 12pt; line-height: 1.8; color: #1e293b; font-family: ${selectedFont}, sans-serif; }
        .ps-editor-content:focus { outline: none; }
        .ps-editor-content p { margin: 0 0 10px 0; }
        .ps-editor-content strong { font-weight: 700; }
        .ps-editor-content em { font-style: italic; }
        .ps-editor-content u { text-decoration: underline; }
        .ps-editor-content s { text-decoration: line-through; }
        .ps-editor-content ul, .ps-editor-content ol { padding-left: 28px; margin: 10px 0; }
        .ps-editor-content li { margin: 4px 0; }
        .ps-editor-content h1 { font-size: 24px; font-weight: 700; margin: 16px 0 10px; }
        .ps-editor-content h2 { font-size: 20px; font-weight: 700; margin: 14px 0 8px; }
        .ps-editor-content h3 { font-size: 16px; font-weight: 700; margin: 12px 0 6px; }
        .ps-editor-content table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .ps-editor-content th, .ps-editor-content td { border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 60px; vertical-align: top; }
        .ps-editor-content th { background: #f1f5f9; font-weight: 700; text-align: left; }
        .ps-editor-content .selectedCell:after { background: rgba(8,145,178,0.12); content: ''; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; }
        .ps-editor-content .tableWrapper { overflow-x: auto; }
        .ps-editor-content .ps-tab { display: inline-block; white-space: pre; }
        .ai-generated-content { background: rgba(8,145,178,0.04); border-left: 2px solid rgba(8,145,178,0.25); padding-left: 8px; transition: background 0.2s; }
        .user-edited-content  { background: rgba(251,191,36,0.04); border-left: 2px solid rgba(251,191,36,0.25); padding-left: 8px; }
        ${showFormatMarks ? `
          .ps-editor-content p::after { content: '¶'; color: #94a3b8; font-size: 10px; margin-left: 2px; }
          .ps-editor-content br::after { content: '↵'; color: #94a3b8; font-size: 10px; }
          .ps-editor-content .ps-tab { background: rgba(8,145,178,0.08); outline: 1px dashed #bae6fd; position: relative; }
          .ps-editor-content .ps-tab::before { content: '→'; color: #94a3b8; font-size: 9px; position: absolute; left: 2px; top: 50%; transform: translateY(-50%); }
        ` : ''}
      `}</style>
    </div>
  );
});

PathScribeEditor.displayName = 'PathScribeEditor';

export default PathScribeEditor;
