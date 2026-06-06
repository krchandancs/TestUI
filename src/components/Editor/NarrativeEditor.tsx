import React from 'react';
import PathScribeEditor from './PathScribeEditor';

export interface NarrativeEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  macros?: any[];
  placeholder?: string;
}

/**
 * NarrativeEditor
 * ---------------------------------------------------------------------------
 * A thin wrapper around PathScribeEditor that applies narrative‑specific
 * defaults and provides a clean integration point for Orchestrator Mode.
 *
 * This component intentionally contains **no business logic**. It simply
 * configures the editor for narrative use and exposes a stable API.
 *
 * Future additions (already scaffolded):
 *   - Section header insertion helpers
 *   - Orchestrator streaming hooks
 *   - AI‑generated section markers
 *   - Regenerate section UI
 *   - Inline provenance markers
 */
const NarrativeEditor: React.FC<NarrativeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  minHeight = '500px',
  macros = [],
  placeholder = 'Begin narrative report…',
}) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <PathScribeEditor
        content={value}
        onChange={onChange}
        readOnly={readOnly}
        minHeight={minHeight}
        placeholder={placeholder}
        macros={macros}
        approvedFonts={[
          'Arial',
          'Times New Roman',
          'Calibri',
          'Courier New',
          'Georgia',
        ]}
        showRulerDefault={true}
      />
    </div>
  );
};

export default NarrativeEditor;