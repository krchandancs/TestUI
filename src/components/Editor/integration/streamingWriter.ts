// src/components/Editor/integration/streamingWriter.ts
// ─────────────────────────────────────────────────────────────
// Streaming Writer — bridges the Orchestrator Engine and
// the PathScribeEditor (Tiptap).
//
// Responsibilities:
//   • Receives streaming tokens from the Orchestrator Engine
//   • Buffers tokens into coherent text chunks
//   • Writes chunks into the correct section via insertAtAnchor
//   • Tracks the current write position per section
//   • Marks completed sections as AI-generated
//   • Supports cancellation mid-stream
//   • Preserves undo/redo integrity throughout
//
// Design:
//   Each section gets its own StreamingSession. The session
//   tracks the last insert position and appends tokens as
//   they arrive. On completion, it marks the written range.
// ─────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/react';
import { buildAnchorMap } from './anchorMap';
import { markAiGeneratedRange, clearSectionMarkers } from './aiContentMarkers';
import { ensureSectionHeading, clearSectionContent } from './insertAtAnchor';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface StreamingSession {
  sectionId: string;
  sectionTitle: string;
  /** Position where this session started inserting */
  startPos: number;
  /** Running buffer of tokens not yet written */
  buffer: string;
  /** Whether the session has been cancelled */
  cancelled: boolean;
  /** Whether the session has completed */
  completed: boolean;
  /** Accumulated full text (for post-processing) */
  fullText: string;
}

export interface StreamingWriterOptions {
  /** Minimum characters to buffer before flushing to editor */
  flushThreshold?: number;
  /** Whether to clear existing section content before streaming */
  clearExisting?: boolean;
  /** Whether to respect user-edited sections */
  respectUserEdits?: boolean;
}

// ─────────────────────────────────────────────────────────────
// StreamingWriter class
// One instance per Orchestrator run. Manages multiple
// concurrent section sessions (though sections run serially).
// ─────────────────────────────────────────────────────────────

export class StreamingWriter {
  private editor: Editor;
  private sessions: Map<string, StreamingSession> = new Map();
  private options: Required<StreamingWriterOptions>;

  constructor(editor: Editor, options: StreamingWriterOptions = {}) {
    this.editor = editor;
    this.options = {
      flushThreshold: options.flushThreshold ?? 20,
      clearExisting:  options.clearExisting  ?? true,
      respectUserEdits: options.respectUserEdits ?? true,
    };
  }

  // ── beginSection ──────────────────────────────────────────
  // Called by Orchestrator Engine before streaming starts for
  // a section. Sets up the section heading and clears old content.
  //
  // Returns false if the section should be skipped (user edited).

  beginSection(sectionId: string, sectionTitle: string): boolean {
    if (!this.editor || this.editor.isDestroyed) return false;

    // Clear old AI markers
    clearSectionMarkers(this.editor, sectionId);

    // Ensure heading is in document and get start position
    const startPos = ensureSectionHeading(this.editor, sectionId, sectionTitle);

    // Optionally clear existing section content
    if (this.options.clearExisting) {
      clearSectionContent(this.editor, sectionId);
    }

    // Rebuild anchor after clearing to get fresh position
    const anchorMap = buildAnchorMap(this.editor);
    const anchor = anchorMap.get(sectionId);
    const insertStart = anchor?.insertPos ?? startPos;

    const session: StreamingSession = {
      sectionId,
      sectionTitle,
      startPos: insertStart,
      buffer: '',
      cancelled: false,
      completed: false,
      fullText: '',
    };

    this.sessions.set(sectionId, session);
    return true;
  }

  // ── appendToken ───────────────────────────────────────────
  // Called by Orchestrator Engine for each streaming token.
  // Buffers until flushThreshold is reached, then writes.

  appendToken(sectionId: string, token: string): void {
    const session = this.sessions.get(sectionId);
    if (!session || session.cancelled || session.completed) return;

    session.buffer += token;
    session.fullText += token;

    if (session.buffer.length >= this.options.flushThreshold) {
      this.flush(session);
    }
  }

  // ── flush ─────────────────────────────────────────────────
  // Writes buffered text into the editor at the current
  // session insert position.

  private flush(session: StreamingSession): void {
    if (!session.buffer || session.cancelled) return;
    if (!this.editor || this.editor.isDestroyed) return;

    const anchorMap = buildAnchorMap(this.editor);
    const anchor = anchorMap.get(session.sectionId);

    // Find the current end of this section to append there
    const insertPos = anchor
      ? this.findCurrentEnd(session.sectionId, anchor.insertPos)
      : session.startPos;

    // Wrap buffered text in a paragraph for Tiptap
    const html = `<p>${escapeHtml(session.buffer)}</p>`;

    this.editor
      .chain()
      .insertContentAt(insertPos, html, {
        updateSelection: false,
        parseOptions: { preserveWhitespace: 'full' },
      })
      .run();

    session.buffer = '';
  }

  // ── completeSection ───────────────────────────────────────
  // Called by Orchestrator Engine when streaming finishes for
  // a section. Flushes remaining buffer and marks AI content.

  completeSection(sectionId: string): void {
    const session = this.sessions.get(sectionId);
    if (!session || session.cancelled) return;

    // Flush any remaining buffer
    if (session.buffer) this.flush(session);

    session.completed = true;

    // Mark the written range as AI-generated
    const anchorMap = buildAnchorMap(this.editor);
    const anchor = anchorMap.get(sectionId);

    if (anchor) {
      const endPos = this.findCurrentEnd(sectionId, anchor.insertPos);
      if (endPos > anchor.insertPos) {
        markAiGeneratedRange(this.editor, anchor.insertPos, endPos, sectionId);
      }
    }
  }

  // ── cancelSection ─────────────────────────────────────────
  // Cancels streaming for a specific section mid-generation.

  cancelSection(sectionId: string): void {
    const session = this.sessions.get(sectionId);
    if (!session) return;
    session.cancelled = true;
    session.buffer = '';
  }

  // ── cancelAll ─────────────────────────────────────────────
  // Cancels all active sessions (user hits global Stop).

  cancelAll(): void {
    this.sessions.forEach(session => {
      session.cancelled = true;
      session.buffer = '';
    });
  }

  // ── isActive ──────────────────────────────────────────────
  isActive(sectionId: string): boolean {
    const session = this.sessions.get(sectionId);
    return !!session && !session.cancelled && !session.completed;
  }

  // ── getFullText ───────────────────────────────────────────
  // Returns the accumulated text for a section after streaming.
  getFullText(sectionId: string): string {
    return this.sessions.get(sectionId)?.fullText ?? '';
  }

  // ── findCurrentEnd ────────────────────────────────────────
  // Finds the current end position of a section in the doc.
  private findCurrentEnd(sectionId: string, afterPos: number): number {
    const doc = this.editor.state.doc;
    let endPos = doc.content.size;
    let passedSection = false;

    doc.descendants((node, pos) => {
      if (pos < afterPos) return;

      if (node.type.name === 'heading') {
        const attrs = node.attrs as Record<string, any>;
        if (attrs['data-section-id'] === sectionId) {
          passedSection = true;
          return;
        }
        if (passedSection) {
          endPos = pos;
          return false;
        }
      }
    });

    return endPos;
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
