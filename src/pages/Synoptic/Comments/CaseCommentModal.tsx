import React from 'react';
import '../../../pathscribe.css';
import PathScribeEditor from '../../../components/Editor/PathScribeEditor';
import { CommentModalShell } from './CommentModalShell';
import { ROLE_META } from '../synopticTypes';
import type { CaseRole } from '../synopticTypes';

interface CaseCommentModalProps {
  accession: string;
  caseComments: Partial<Record<CaseRole, string>>;
  onChangeAttending: (html: string) => void;
  onClose: () => void;
}

const CaseCommentModal: React.FC<CaseCommentModalProps> = ({
  accession,
  caseComments,
  onChangeAttending,
  onClose,
}) => (
  <CommentModalShell
    title="📋 Case Comment"
    subtitle={<>Case {accession} — applies to the entire case, not tied to any specimen</>}
    onClose={onClose}
    footerLeft="TODO: Role Dictionary — will show your role's editable comment and other roles read-only."
  >

    {/* ── Attending (editable) ── */}
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: '10px',
            background: ROLE_META.attending.bg,
            color: ROLE_META.attending.color,
            border: `1px solid ${ROLE_META.attending.border}`,
          }}
        >
          {ROLE_META.attending.label}
        </span>

        <span style={{ fontSize: '11px', color: '#94a3b8' }}>— your comment</span>

        {(!caseComments?.attending || caseComments.attending === '<p></p>')
          ? (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: 600,
              }}
            >
              No comment yet — start typing below
            </span>
          )
          : (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: '#d1fae5',
                color: '#065f46',
                fontWeight: 600,
              }}
            >
              ✓ Comment saved — click to edit
            </span>
          )}
      </div>

      <PathScribeEditor
        key="modal-case-comment-attending"
        content={caseComments?.attending ?? ''}
        placeholder="Enter attending pathologist case comment…"
        onChange={onChangeAttending}
        minHeight="320px"
        showRulerDefault={true}
        macros={[]}
        approvedFonts={['Arial', 'Times New Roman', 'Calibri', 'Courier New']}
      />
    </div>

    {/* ── Resident (read-only collapsible) ── */}
    <OtherRoleComment
      meta={ROLE_META.resident}
      content={caseComments?.resident ?? ''}
      hasContent={!!(caseComments?.resident && caseComments.resident !== '<p></p>')}
    />

  </CommentModalShell>
);

/* ────────────────────────────────────────────────────────────────
   OtherRoleComment Component
   Read-only collapsible panel showing another role's case comment.
   ──────────────────────────────────────────────────────────────── */

interface OtherRoleCommentProps {
  meta: { label: string; color: string; bg: string; border: string };
  content: string;
  hasContent: boolean;
}

const OtherRoleComment: React.FC<OtherRoleCommentProps> = ({
  meta,
  content,
  hasContent,
}) => (
  <div style={{ marginTop: '24px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: '10px',
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
        }}
      >
        {meta.label}
      </span>

      <span style={{ fontSize: '11px', color: '#94a3b8' }}>— read-only</span>

      {!hasContent && (
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 600,
          }}
        >
          No comment from this role
        </span>
      )}
    </div>

    {hasContent && (
      <div
        style={{
          border: `1px solid ${meta.border}`,
          background: meta.bg,
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )}
  </div>
);

export { CaseCommentModal };
export type { CaseCommentModalProps };