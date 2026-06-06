// src/pages/SynopticReportPage/components/OrchestratorReportPanel.tsx
// ─────────────────────────────────────────────────────────────
// AI-generated report draft — section-by-section editable output.
//
// Streaming:  plain div (avoids re-rendering a rich text editor per token)
// Complete:   NarrativeEditor — full rich text editing, same as Case Comment
// Re-run:     edited sections show amber "new draft" banner (Replace / Keep)
// ─────────────────────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import NarrativeEditor from '@/components/Editor/NarrativeEditor';

// ── Types ──────────────────────────────────────────────────────

export interface OrchestratorSection {
  id: string;
  label: string;
  /** 'narrative' = AI-generated editable prose; 'synoptic' = locked structured data block */
  type?: 'narrative' | 'synoptic';
  /** When type === 'synoptic', the instance this block is sourced from */
  synopticInstanceId?: string;
  /** HTML content in the editor; plain text while streaming */
  text: string;
  /** Last AI-generated HTML — baseline for userEdited detection */
  aiGenerated: string;
  /** True once the pathologist has changed text since last generation */
  userEdited: boolean;
  /** True while tokens are actively streaming into this section */
  isStreaming: boolean;
  /**
   * On re-generate, if the pathologist edited this section the new AI
   * output accumulates here instead of overwriting. The banner lets them
   * accept or discard it.
   */
  pendingDraft?: string;
}

/** Convert plain-text AI output to minimal HTML for the rich text editor */
export function textToHtml(text: string): string {
  if (!text.trim()) return '';
  if (text.trimStart().startsWith('<')) return text; // already HTML
  return '<p>' + text.split(/\n\n+/).filter(Boolean).join('</p><p>') + '</p>';
}

// ── Props ──────────────────────────────────────────────────────

interface Props {
  sections: OrchestratorSection[];
  isGenerating: boolean;
  onSectionChange: (sectionId: string, html: string) => void;
  onAcceptDraft: (sectionId: string) => void;
  onKeepVersion: (sectionId: string) => void;
  onRegenerateSection?: (sectionId: string) => void;
  onEditSynoptic?: (instanceId: string) => void;
  lastGeneratedAt?: Date | null;
}

// ── Main panel ─────────────────────────────────────────────────

const OrchestratorReportPanel: React.FC<Props> = ({
  sections,
  isGenerating,
  onSectionChange,
  onAcceptDraft,
  onKeepVersion,
  onRegenerateSection,
  onEditSynoptic,
  lastGeneratedAt,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom while streaming so pathologist sees live output
  useEffect(() => {
    if (isGenerating) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sections.map(s => s.text).join('').length, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Empty state ──────────────────────────────────────────────
  if (sections.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center',
        background: '#111827',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>✍️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
          Report Draft
        </div>
        <div style={{ fontSize: 12, color: '#64748b', maxWidth: 320, lineHeight: 1.75 }}>
          Complete the synoptic fields on the right, then press{' '}
          <span style={{ color: '#0891b2', fontWeight: 600 }}>⚡ Generate Report</span>{' '}
          to create an AI-drafted narrative.
        </div>
        <div style={{ marginTop: 20, fontSize: 11, color: '#334155', lineHeight: 1.7, maxWidth: 300 }}>
          Sections appear here as they generate. Every section is fully
          editable — your changes are preserved if you regenerate.
        </div>
      </div>
    );
  }

  const editedCount = sections.filter(s => s.userEdited).length;

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      padding: '16px 28px 48px',
      background: '#111827',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes ps-orch-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes ps-orch-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isGenerating ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#38bdf8', display: 'inline-block',
                animation: 'ps-orch-pulse 0.8s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                Generating…
              </span>
            </>
          ) : lastGeneratedAt ? (
            <span style={{ fontSize: 11, color: '#475569' }}>
              Generated {lastGeneratedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>

        {editedCount > 0 && (
          <span style={{
            fontSize: 10, color: '#94a3b8',
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px', borderRadius: 99,
          }}>
            {editedCount} section{editedCount !== 1 ? 's' : ''} edited
          </span>
        )}
      </div>

      {/* Section blocks */}
      {sections.map(section => (
        <SectionBlock
          key={section.id}
          section={section}
          onChange={html => onSectionChange(section.id, html)}
          onAcceptDraft={() => onAcceptDraft(section.id)}
          onKeepVersion={() => onKeepVersion(section.id)}
          onRegenerate={onRegenerateSection ? () => onRegenerateSection(section.id) : undefined}
          onEditSynoptic={onEditSynoptic}
          isAnyGenerating={isGenerating}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};

// ── Section block ──────────────────────────────────────────────

const SectionBlock: React.FC<{
  section: OrchestratorSection;
  onChange: (html: string) => void;
  onAcceptDraft: () => void;
  onKeepVersion: () => void;
  onRegenerate?: () => void;
  onEditSynoptic?: (instanceId: string) => void;
  isAnyGenerating: boolean;
}> = ({ section, onChange, onAcceptDraft, onKeepVersion, onRegenerate, onEditSynoptic, isAnyGenerating }) => {

  const isSynoptic  = section.type === 'synoptic';
  const accentColor = section.isStreaming ? '#38bdf8' : isSynoptic ? '#10b981' : '#0891b2';

  // ── Synoptic locked block ────────────────────────────────────
  if (isSynoptic) {
    return (
      <div style={{ marginBottom: 32 }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#10b981',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            borderLeft: '3px solid #10b981', paddingLeft: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {section.label}
          </span>
          {section.synopticInstanceId && onEditSynoptic && (
            <button
              onClick={() => onEditSynoptic(section.synopticInstanceId!)}
              style={{
                fontSize: 10, color: '#0891b2', background: 'rgba(8,145,178,0.1)',
                border: '1px solid rgba(8,145,178,0.25)', borderRadius: 4,
                padding: '3px 10px', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.1)'; }}
            >
              Edit in Synoptic Panel →
            </button>
          )}
        </div>

        {/* Locked content block */}
        <div style={{
          background: 'rgba(16,185,129,0.03)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 6, padding: '12px 14px',
          color: '#cbd5e1', fontSize: 13, lineHeight: 1.8,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          userSelect: 'text', cursor: 'default', position: 'relative',
        }}>
          <div
            dangerouslySetInnerHTML={{ __html: section.text || '<em style="color:#475569">No synoptic data — complete fields in the synoptic panel.</em>' }}
          />
          {/* Subtle lock watermark */}
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontSize: 9, color: '#1e3a2f', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Synoptic data — read only
          </div>
        </div>
      </div>
    );
  }

  // ── Narrative editable block (existing behaviour) ────────────
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Label row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800,
            color: accentColor,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            borderLeft: `3px solid ${accentColor}`,
            paddingLeft: 8,
            transition: 'color 0.2s, border-color 0.2s',
          }}>
            {section.label}
          </span>

          {section.isStreaming && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#38bdf8', display: 'inline-block',
              animation: 'ps-orch-pulse 0.7s ease-in-out infinite',
            }} />
          )}

          {section.userEdited && !section.isStreaming && !section.pendingDraft && (
            <span style={{
              fontSize: 9, color: '#94a3b8',
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 6px', borderRadius: 99,
            }}>
              edited
            </span>
          )}
        </div>

        {/* Per-section regenerate — hidden while anything is generating */}
        {onRegenerate && !section.isStreaming && !isAnyGenerating && (
          <button
            onClick={onRegenerate}
            style={{
              fontSize: 10, color: '#475569',
              background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0891b2'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            ↺ regenerate
          </button>
        )}
      </div>

      {/* Pending draft banner — shown on re-generate when section was edited */}
      {section.pendingDraft && (
        <div style={{
          background: 'rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 6, padding: '8px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 11, color: '#fbbf24', lineHeight: 1.5 }}>
            ⚡ AI has an updated draft for this section
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={onAcceptDraft}
              style={{
                fontSize: 11, fontWeight: 600, color: '#fbbf24',
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.35)',
                borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Replace
            </button>
            <button
              onClick={onKeepVersion}
              style={{
                fontSize: 11, color: '#94a3b8', background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Keep mine
            </button>
          </div>
        </div>
      )}

      {/* Content area — streaming div OR NarrativeEditor */}
      {section.isStreaming ? (
        // During streaming: simple div so we're not re-rendering a rich text
        // editor on every token. Switches to NarrativeEditor when done.
        <div style={{
          minHeight: 80,
          background: 'rgba(8,145,178,0.04)',
          border: '1px solid rgba(8,145,178,0.2)',
          borderRadius: 6,
          padding: '12px 14px',
          color: '#94a3b8',
          fontSize: 13,
          lineHeight: 1.8,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {section.text}
          {/* Blinking cursor */}
          <span style={{
            display: 'inline-block', width: 2, height: '1em',
            background: '#38bdf8', marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'ps-orch-cursor 0.9s ease-in-out infinite',
          }} />
        </div>
      ) : (
        // After streaming: full NarrativeEditor — same component as Case Comment
        <NarrativeEditor
          value={textToHtml(section.text)}
          onChange={onChange}
          readOnly={false}
          minHeight="120px"
          placeholder="No content generated for this section."
        />
      )}
    </div>
  );
};

export default OrchestratorReportPanel;
