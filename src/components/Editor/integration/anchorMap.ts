// src/components/Editor/integration/anchorMap.ts
// ─────────────────────────────────────────────────────────────
// Anchor Map — tracks where each narrative section lives
// inside the Tiptap document so the Orchestrator Engine can
// insert / replace content at the correct position without
// corrupting user edits elsewhere.
//
// Strategy:
//   Each section is bookmarked by a paragraph node that carries
//   a data-section-id attribute. The anchor map stores the
//   last known document position of each section heading node.
//   The Orchestrator uses these positions to insertAtAnchor().
//
// The anchor map is rebuilt whenever:
//   • The editor content changes
//   • A new section is generated
//   • The user manually edits section structure
// ─────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SectionAnchor {
  sectionId: string;
  /** Position immediately AFTER the section heading node.
   *  This is where the Orchestrator begins inserting content. */
  insertPos: number;
  /** Position of the heading node itself */
  headingPos: number;
  /** Whether this anchor was found in the current document */
  found: boolean;
}

export type AnchorMap = Map<string, SectionAnchor>;

// ─────────────────────────────────────────────────────────────
// Section heading HTML template
// Used by the Orchestrator to insert section headings before
// generating content for a new section.
// ─────────────────────────────────────────────────────────────

export function buildSectionHeadingHtml(sectionId: string, title: string): string {
  return `<h2 data-section-id="${sectionId}" data-ai-section="true">${title}</h2>`;
}

/** Paragraph inserted immediately after section heading to anchor content */
export function buildSectionAnchorHtml(sectionId: string): string {
  return `<p data-section-anchor="${sectionId}"></p>`;
}

// ─────────────────────────────────────────────────────────────
// buildAnchorMap
// Walks the Tiptap document and finds all section heading nodes
// that carry data-section-id attributes. Returns a Map of
// sectionId → SectionAnchor.
// ─────────────────────────────────────────────────────────────

export function buildAnchorMap(editor: Editor): AnchorMap {
  const map: AnchorMap = new Map();
  const doc = editor.state.doc;

  doc.descendants((node, pos) => {
    // Look for heading nodes with data-section-id
    if (node.type.name === 'heading') {
      const attrs = node.attrs as Record<string, any>;
      const sectionId = attrs['data-section-id'] as string | undefined;

      if (sectionId) {
        map.set(sectionId, {
          sectionId,
          headingPos: pos,
          // Insert position is immediately after the heading node
          insertPos: pos + node.nodeSize,
          found: true,
        });
      }
    }
  });

  return map;
}

// ─────────────────────────────────────────────────────────────
// getSectionInsertPos
// Returns the insert position for a section, or null if the
// section heading has not yet been written to the document.
// ─────────────────────────────────────────────────────────────

export function getSectionInsertPos(
  anchorMap: AnchorMap,
  sectionId: string
): number | null {
  const anchor = anchorMap.get(sectionId);
  if (!anchor || !anchor.found) return null;
  return anchor.insertPos;
}

// ─────────────────────────────────────────────────────────────
// isSectionUserEdited
// Checks whether the content between the section heading and
// the next section heading has been modified from AI-generated
// content. Uses a data-user-edited attribute written by
// aiContentMarkers when the user makes a change.
// ─────────────────────────────────────────────────────────────

export function isSectionUserEdited(editor: Editor, sectionId: string): boolean {
  let userEdited = false;
  const doc = editor.state.doc;

  let inSection = false;

  doc.descendants((node) => {
    if (node.type.name === 'heading') {
      const attrs = node.attrs as Record<string, any>;
      if (attrs['data-section-id'] === sectionId) {
        inSection = true;
        return;
      }
      // Hit a different section heading — stop
      if (inSection) {
        inSection = false;
        return false; // stop traversal
      }
    }

    if (inSection && node.attrs) {
      const attrs = node.attrs as Record<string, any>;
      if (attrs['data-user-edited'] === 'true') {
        userEdited = true;
        return false; // stop early
      }
    }
  });

  return userEdited;
}
