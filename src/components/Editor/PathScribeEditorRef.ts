// src/components/Editor/PathScribeEditorRef.ts
// ─────────────────────────────────────────────────────────────
// PathScribeEditor Imperative Handle
//
// This file defines the ref interface that PathScribeEditor
// exposes via forwardRef + useImperativeHandle.
//
// The Orchestrator Engine and NarrativeEditor use this ref
// to programmatically interact with the Tiptap editor without
// going through React props / state.
//
// HOW TO ADD THIS TO PathScribeEditor.tsx:
// ─────────────────────────────────────────────────────────────
// 1. Import this file:
//      import type { PathScribeEditorHandle } from './PathScribeEditorRef';
//
// 2. Wrap the component with forwardRef:
//      const PathScribeEditor = React.forwardRef<
//        PathScribeEditorHandle,
//        PathScribeEditorProps
//      >((props, ref) => {
//        ...existing component body...
//
// 3. Add useImperativeHandle inside the component body
//    (after the useEditor call, where `editor` is available):
//
//      useImperativeHandle(ref, () => ({
//        getEditor:            () => editor,
//        insertAtPos:          (pos, html) => {
//                                editor?.chain().focus()
//                                  .insertContentAt(pos, html, { updateSelection: false })
//                                  .run();
//                              },
//        appendToken:          (token) => {
//                                const end = editor?.state.doc.content.size ?? 0;
//                                editor?.chain()
//                                  .insertContentAt(end, token, { updateSelection: false })
//                                  .run();
//                              },
//        setContent:           (html)  => editor?.commands.setContent(html),
//        clearContent:         ()      => editor?.commands.clearContent(),
//        focus:                ()      => editor?.chain().focus().run(),
//        isEditable:           ()      => editor?.isEditable ?? false,
//        setEditable:          (val)   => editor?.setEditable(val),
//      }), [editor]);
//
// 4. Change the export from:
//      export default PathScribeEditor;
//    to the forwardRef version (no change needed if using forwardRef wrapper).
// ─────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/react';

export interface PathScribeEditorHandle {
  /**
   * Returns the raw Tiptap Editor instance.
   * Use for advanced operations not covered by other methods.
   */
  getEditor: () => Editor | null;

  /**
   * Inserts HTML content at a specific document position.
   * Used by insertAtAnchor.ts to place section content.
   */
  insertAtPos: (pos: number, html: string) => void;

  /**
   * Appends a single token (string) at the current end of the document.
   * Used by streamingWriter.ts during token-by-token streaming.
   */
  appendToken: (token: string) => void;

  /**
   * Replaces the entire editor content with the provided HTML.
   * Use sparingly — prefer insertAtPos for section-level writes.
   */
  setContent: (html: string) => void;

  /**
   * Clears all content from the editor.
   */
  clearContent: () => void;

  /**
   * Focuses the editor.
   */
  focus: () => void;

  /**
   * Returns whether the editor is currently editable.
   */
  isEditable: () => boolean;

  /**
   * Sets the editor's editable state.
   * Pass false to lock the editor while AI is generating.
   */
  setEditable: (editable: boolean) => void;
}
