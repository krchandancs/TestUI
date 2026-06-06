import React from 'react';
import '../../../pathscribe.css';
import PathScribeEditor from '../../../components/Editor/PathScribeEditor';
import { CommentModalShell } from './CommentModalShell';

interface ReportCommentModalProps {
  specimenName: string;     // full breadcrumb string, e.g. "Left Breast Mastectomy › Breast — Invasive Carcinoma"
  specimenId: string;
  content: string;
  isFinalized: boolean;
  onChange: (html: string) => void;
  onClose: () => void;
}

const ReportCommentModal: React.FC<ReportCommentModalProps> = ({
  specimenName, specimenId, content, isFinalized, onChange, onClose,
}) => {
  const isEmpty = !content || content === '<p></p>';
  // Use first breadcrumb segment as the modal title, rest as context
  const parts = specimenName.split(' › ');
  const titleName = parts[0] ?? specimenName;
  return (
    <CommentModalShell
      title={`💬 ${titleName}`}
      subtitle={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {parts.length > 1 && <span style={{ color: '#94a3b8' }}>{parts.slice(1).join(' › ')}</span>}
          {isFinalized
            ? <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#f1f5f9', color: '#94a3b8', fontWeight: 600 }}>🔒 Finalized — read only</span>
            : isEmpty
              ? <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>No comment yet — start typing below</span>
              : <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✓ Comment saved — click to edit</span>
          }
        </div>
      }
      onClose={onClose}
      editorMode
      footerLeft="Sent to LIS on finalization. Protocol-defined fields are in the Tumor, Margins & Biomarkers tabs."
    >
      <PathScribeEditor
        key={`modal-report-comment-${specimenId}`}
        content={content}
        placeholder={`Start typing your report comment for ${titleName}…`}
        onChange={onChange}
        minHeight="480px"
        readOnly={isFinalized}
        showRulerDefault={true}
        macros={[]}
        approvedFonts={['Arial', 'Times New Roman', 'Calibri', 'Courier New']}
      />
    </CommentModalShell>
  );
};

// ─── CaseCommentModal ─────────────────────────────────────────────────────────

export { ReportCommentModal };
export type { ReportCommentModalProps };
