// src/pages/Synoptic/Comments/OtherRoleComment.tsx
import React from 'react';
import '../../../pathscribe.css';

const OtherRoleComment: React.FC<{
  role: string;
  meta: { label: string; color: string; bg: string; border: string };
  content: string;
  hasContent: boolean;
}> = ({ role: _role, meta, content, hasContent }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className="ps-other-comment"
      style={{ border: `1px solid ${hasContent ? meta.border : '#e2e8f0'}` }}
    >
      <div
        onClick={() => { if (hasContent) setExpanded(v => !v); }}
        className={`ps-other-comment__header${hasContent ? ' has-content' : ''}`}
        style={{ background: hasContent ? meta.bg : '#f8fafc', cursor: hasContent ? 'pointer' : 'default' }}
      >
        <span
          className="ps-other-comment__badge"
          style={{
            background: hasContent ? 'white' : '#e2e8f0',
            color:      hasContent ? meta.color : '#94a3b8',
            border:     `1px solid ${hasContent ? meta.border : '#e2e8f0'}`,
          }}
        >
          {meta.label}
        </span>
        {hasContent
          ? <span className="ps-other-comment__status" style={{ color: meta.color }}>● Has comment</span>
          : <span className="ps-other-comment__status ps-other-comment__status--empty">No comment</span>
        }
        {hasContent && (
          <span
            className={`ps-other-comment__chevron${expanded ? ' expanded' : ''}`}
            style={{ color: meta.color }}
          >▼</span>
        )}
      </div>
      {expanded && hasContent && (
        <div
          className="ps-other-comment__body"
          style={{ borderTop: `1px solid ${meta.border}` }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export { OtherRoleComment };
