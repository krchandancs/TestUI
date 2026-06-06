// src/components/Editor/integration/aiContentMarkers.ts
// ─────────────────────────────────────────────────────────────
// AI Content Markers — manages the marking of AI-generated
// content within the PathScribeEditor (Tiptap).
//
// Responsibilities:
//   • Mark nodes as AI-generated (data-ai-generated)
//   • Detect when a user edits AI-generated content
//   • Mark edited nodes as user-edited (data-user-edited)
//   • Provide CSS class names for visual styling
//   • Support regeneration by identifying AI-owned ranges
//
// Design principle:
//   Markers are stored as node attributes, NOT as marks/decorations.
//   This keeps them stable across undo/redo and content replacement.
// ─────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/react';
import type { Transaction } from '@tiptap/pm/state';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const AI_GENERATED_ATTR   = 'data-ai-generated';
export const AI_SECTION_ATTR     = 'data-ai-section';
export const USER_EDITED_ATTR    = 'data-user-edited';
export const SECTION_ID_ATTR     = 'data-section-id';
export const SECTION_ANCHOR_ATTR = 'data-section-anchor';

/** CSS class applied to AI-generated paragraphs */
export const AI_GENERATED_CLASS  = 'ai-generated-content';
/** CSS class applied after user edits */
export const USER_EDITED_CLASS   = 'user-edited-content';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MarkedRange {
  sectionId: string;
  from: number;
  to: number;
  isUserEdited: boolean;
}

// ─────────────────────────────────────────────────────────────
// markAiGeneratedRange
// Marks all nodes in a position range as AI-generated.
// Called by streamingWriter after completing a section.
// ─────────────────────────────────────────────────────────────

export function markAiGeneratedRange(
  editor: Editor,
  from: number,
  to: number,
  sectionId: string
): void {
  const { state, view } = editor;
  const tr: Transaction = state.tr;
  let changed = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isBlock) return;

    const newAttrs = {
      ...node.attrs,
      [AI_GENERATED_ATTR]: 'true',
      [SECTION_ID_ATTR]: sectionId,
      class: [node.attrs.class, AI_GENERATED_CLASS]
        .filter(Boolean)
        .join(' '),
    };

    tr.setNodeMarkup(pos, undefined, newAttrs);
    changed = true;
  });

  if (changed) {
    // setMeta prevents this transaction from being treated as a user edit
    tr.setMeta('addToHistory', false);
    tr.setMeta('aiGenerated', true);
    view.dispatch(tr);
  }
}

// ─────────────────────────────────────────────────────────────
// markUserEdited
// Called when the user modifies content inside an AI-generated
// range. Switches the node from ai-generated to user-edited.
// ─────────────────────────────────────────────────────────────

export function markUserEdited(
  editor: Editor,
  pos: number
): void {
  const { state, view } = editor;
  const node = state.doc.nodeAt(pos);
  if (!node) return;

  const isAiGenerated = node.attrs[AI_GENERATED_ATTR] === 'true';
  if (!isAiGenerated) return; // nothing to do

  const tr = state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    [USER_EDITED_ATTR]: 'true',
    class: [
      (node.attrs.class ?? '').replace(AI_GENERATED_CLASS, ''),
      USER_EDITED_CLASS,
    ]
      .filter(Boolean)
      .join(' ')
      .trim(),
  });

  tr.setMeta('addToHistory', false);
  view.dispatch(tr);
}

// ─────────────────────────────────────────────────────────────
// clearSectionMarkers
// Removes AI/user-edit markers from all nodes in a section.
// Called before regenerating a section so fresh content
// gets clean markers.
// ─────────────────────────────────────────────────────────────

export function clearSectionMarkers(editor: Editor, sectionId: string): void {
  const { state, view } = editor;
  const tr: Transaction = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (!node.isBlock) return;
    if (node.attrs[SECTION_ID_ATTR] !== sectionId) return;

    const { [AI_GENERATED_ATTR]: _a, [USER_EDITED_ATTR]: _u, ...rest } = node.attrs;
    const cleanClass = (rest.class ?? '')
      .replace(AI_GENERATED_CLASS, '')
      .replace(USER_EDITED_CLASS, '')
      .trim();

    tr.setNodeMarkup(pos, undefined, { ...rest, class: cleanClass || undefined });
    changed = true;
  });

  if (changed) {
    tr.setMeta('addToHistory', false);
    view.dispatch(tr);
  }
}

// ─────────────────────────────────────────────────────────────
// getAiGeneratedRanges
// Returns all marked ranges in the document, grouped by section.
// Useful for the Orchestrator to know which sections are
// AI-generated vs user-edited before deciding to regenerate.
// ─────────────────────────────────────────────────────────────

export function getAiGeneratedRanges(editor: Editor): MarkedRange[] {
  const ranges: MarkedRange[] = [];
  const doc = editor.state.doc;

  const sectionMap = new Map<string, { from: number; to: number; isUserEdited: boolean }>();

  doc.descendants((node, pos) => {
    if (!node.isBlock) return;
    const sectionId = node.attrs[SECTION_ID_ATTR] as string | undefined;
    if (!sectionId) return;

    const isUserEdited = node.attrs[USER_EDITED_ATTR] === 'true';
    const existing = sectionMap.get(sectionId);

    if (!existing) {
      sectionMap.set(sectionId, { from: pos, to: pos + node.nodeSize, isUserEdited });
    } else {
      sectionMap.set(sectionId, {
        from: Math.min(existing.from, pos),
        to: Math.max(existing.to, pos + node.nodeSize),
        isUserEdited: existing.isUserEdited || isUserEdited,
      });
    }
  });

  sectionMap.forEach((range, sectionId) => {
    ranges.push({ sectionId, ...range });
  });

  return ranges;
}

// ─────────────────────────────────────────────────────────────
// CSS to inject globally (call once at app startup)
// ─────────────────────────────────────────────────────────────

export const AI_MARKER_CSS = `
  .${AI_GENERATED_CLASS} {
    background: rgba(8, 145, 178, 0.04);
    border-left: 2px solid rgba(8, 145, 178, 0.25);
    padding-left: 8px;
    transition: background 0.2s;
  }
  .${USER_EDITED_CLASS} {
    background: rgba(251, 191, 36, 0.04);
    border-left: 2px solid rgba(251, 191, 36, 0.25);
    padding-left: 8px;
  }
`;
