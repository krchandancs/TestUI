// src/components/Editor/integration/insertAtAnchor.ts
// ─────────────────────────────────────────────────────────────
// Insert At Anchor — safe content insertion into Tiptap
// at section-specific positions.
//
// Responsibilities:
//   • Insert section headings into the document
//   • Insert/replace content at a section's anchor position
//   • Protect user-edited content from being overwritten
//   • Maintain undo/redo history integrity
//   • Support both full-replacement and append modes
// ─────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/react';
import {
  buildAnchorMap,
  buildSectionHeadingHtml,
  getSectionInsertPos,
  isSectionUserEdited,
} from './anchorMap';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface InsertOptions {
  /** If true, overwrites existing AI content. If false, only inserts if empty. */
  replace?: boolean;
  /** If true, skips sections the user has already edited */
  respectUserEdits?: boolean;
  /** If true, does not add this operation to undo history */
  silent?: boolean;
}

export interface InsertResult {
  success: boolean;
  reason?: 'user_edited' | 'anchor_not_found' | 'editor_not_ready' | 'ok';
  insertPos?: number;
}

// ─────────────────────────────────────────────────────────────
// ensureSectionHeading
// Guarantees a section heading exists in the document.
// If not found, appends it at the end of the document.
// Returns the insert position immediately after the heading.
// ─────────────────────────────────────────────────────────────

export function ensureSectionHeading(
  editor: Editor,
  sectionId: string,
  sectionTitle: string
): number {
  // Use the dedicated helper — avoids duplicating anchorMap.get() logic here
  const existingPos = getSectionInsertPos(buildAnchorMap(editor), sectionId);
  if (existingPos !== null) {
    return existingPos;
  }

  // Section not found — append heading at end of document
  const docSize = editor.state.doc.content.size;
  const headingHtml = buildSectionHeadingHtml(sectionId, sectionTitle);

  editor
    .chain()
    .focus()
    .insertContentAt(docSize, headingHtml, {
      updateSelection: false,
      parseOptions: { preserveWhitespace: 'full' },
    })
    .run();

  // Rebuild to get the freshly inserted heading's position
  return getSectionInsertPos(buildAnchorMap(editor), sectionId) ?? editor.state.doc.content.size;
}

// ─────────────────────────────────────────────────────────────
// insertAtAnchor
// Core insertion function. Inserts HTML content at the
// position immediately after a section's heading node.
//
// Safety guarantees:
//   • Will not overwrite user-edited content unless replace=true
//     AND respectUserEdits=false
//   • Uses insertContentAt (not setContent) to preserve
//     content outside the target range
//   • Marks the transaction as non-history when silent=true
// ─────────────────────────────────────────────────────────────

export function insertAtAnchor(
  editor: Editor,
  sectionId: string,
  sectionTitle: string,
  html: string,
  options: InsertOptions = {}
): InsertResult {
  const {
    replace = false,
    respectUserEdits = true,
    silent = false,
  } = options;

  if (!editor || editor.isDestroyed) {
    return { success: false, reason: 'editor_not_ready' };
  }

  // Guard: respect user edits
  if (respectUserEdits && isSectionUserEdited(editor, sectionId)) {
    return { success: false, reason: 'user_edited' };
  }

  // Ensure heading exists and get insert position
  const insertPos = ensureSectionHeading(editor, sectionId, sectionTitle);

  if (insertPos === null) {
    return { success: false, reason: 'anchor_not_found' };
  }

  if (replace) {
    // Replace existing content between this heading and the next
    const rangeEnd = findSectionEnd(editor, sectionId, insertPos);

    editor
      .chain()
      .focus()
      .deleteRange({ from: insertPos, to: rangeEnd })
      .insertContentAt(insertPos, html, {
        updateSelection: false,
        parseOptions: { preserveWhitespace: 'full' },
      })
      .run();
  } else {
    // Append at the insert position
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, html, {
        updateSelection: false,
        parseOptions: { preserveWhitespace: 'full' },
      })
      .run();
  }

  if (silent) {
    // Collapse last transaction out of history
    const { state, view } = editor;
    const tr = state.tr.setMeta('addToHistory', false);
    view.dispatch(tr);
  }

  return { success: true, reason: 'ok', insertPos };
}

// ─────────────────────────────────────────────────────────────
// findSectionEnd
// Finds the document position where a section's content ends
// (i.e. just before the next section heading, or end of doc).
// ─────────────────────────────────────────────────────────────

function findSectionEnd(
  editor: Editor,
  sectionId: string,
  afterPos: number
): number {
  const doc = editor.state.doc;
  let endPos = doc.content.size;
  let passedSection = false;

  doc.descendants((node, pos) => {
    if (pos < afterPos) return; // skip nodes before our section

    if (node.type.name === 'heading') {
      const attrs = node.attrs as Record<string, any>;

      if (attrs['data-section-id'] === sectionId) {
        passedSection = true;
        return; // this is our heading, keep going
      }

      if (passedSection) {
        // Hit the NEXT section heading — content ends here
        endPos = pos;
        return false; // stop traversal
      }
    }
  });

  return endPos;
}

// ─────────────────────────────────────────────────────────────
// clearSectionContent
// Removes all content between a section heading and the next,
// leaving the heading intact. Used before regeneration.
// ─────────────────────────────────────────────────────────────

export function clearSectionContent(
  editor: Editor,
  sectionId: string
): boolean {
  if (!editor || editor.isDestroyed) return false;

  const anchorMap = buildAnchorMap(editor);
  const anchor = anchorMap.get(sectionId);
  if (!anchor?.found) return false;

  const rangeEnd = findSectionEnd(editor, sectionId, anchor.insertPos);

  if (anchor.insertPos >= rangeEnd) return true; // already empty

  editor
    .chain()
    .focus()
    .deleteRange({ from: anchor.insertPos, to: rangeEnd })
    .run();

  return true;
}
