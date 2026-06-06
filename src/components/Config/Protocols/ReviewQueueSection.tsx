/**
 * ReviewQueueSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders protocols in the pre-publish lifecycle: draft, in_review,
 * needs_changes, approved. Consumed by index.tsx (ProtocolsTab).
 *
 * Shows warning banner with counts, expandable cards with lifecycle
 * tracker, review notes, and context-sensitive action buttons.
 *
 * Navigation:
 *   "Open Reviewer" → /template-review/:id  (TemplateRenderer)
 *   "Open Editor"   → /template-editor/:id  (SynopticEditor)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../../pathscribe.css';
import { useNavigate } from 'react-router-dom';
import {
  Protocol,
  useProtocols,
  SOURCE_STYLES,
  CATEGORY_COLORS,
  LifecycleBadge,
  UploadProtocolModal,
  BuildCustomiseModal,
} from './protocolShared';
import {
  OutlineBtn,
  TealBtn,
  SearchBar,
  CategoryGroup,
  EmptyState,
} from './ActiveProtocolsSection';

// ─── ProtocolCard ─────────────────────────────────────────────────────────────

const ProtocolCard: React.FC<{ protocol: Protocol }> = ({ protocol: p }) => {
  const navigate = useNavigate();
  const catColor = CATEGORY_COLORS[p.category] ?? '#64748b';
  const srcStyle = SOURCE_STYLES[p.source]     ?? SOURCE_STYLES.Custom;

  // Industry standard: clicking the card navigates to the appropriate view
  // based on status — reviewer route for in_review/approved, editor for needs_changes
  const handleCardClick = () => {
    if (p.status === 'needs_changes') {
      navigate(`/template-editor/${p.id}?from=review`);
    } else {
      navigate(`/template-review/${p.id}`);
    }
  };

  const actionLabel = p.status === 'needs_changes'
    ? '✏️ Open Editor to Address Changes'
    : p.status === 'approved'
    ? '🚀 Open Reviewer to Publish'
    : '🔍 Open Reviewer';

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 18px', marginBottom: '8px',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '10px',
        cursor: 'pointer', transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#243050'; e.currentTarget.style.borderColor = '#475569'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.borderColor = '#334155'; }}
      title={actionLabel}
    >
      {/* Category accent */}
      <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: catColor, flexShrink: 0 }} />

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }} data-phi="name">{p.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{p.version}</span>
          <span style={{ color: '#334155' }}>&bull;</span>
          <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', padding: '1px 7px', borderRadius: '4px', background: srcStyle.bg, color: srcStyle.color }}>{p.source}</span>
          <span style={{ color: '#334155' }}>&bull;</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{p.type}</span>
          {p.owner && <>
            <span style={{ color: '#334155' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{p.owner}</span>
          </>}
        </div>
        {/* Review note preview if present */}
        {p.reviewNote && (
          <div style={{
            marginTop: '6px', fontSize: '11px', lineHeight: 1.4,
            color: p.status === 'needs_changes' ? '#f87171' : '#fbbf24',
            display: 'flex', gap: '6px', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>{p.status === 'needs_changes' ? '↩' : '⚠'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>{p.reviewNote}</span>
          </div>
        )}
      </div>

      <LifecycleBadge state={p.status} />

      {/* Directional cue */}
      <span style={{ fontSize: '16px', color: '#475569', flexShrink: 0 }}>›</span>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ReviewQueueSection: React.FC = () => {
  const navigate                    = useNavigate();
  const [search, setSearch]         = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showBuild,  setShowBuild]  = useState(false);

  const protocols = useProtocols(p => p.status === 'in_review' || p.status === 'needs_changes' || p.status === 'approved');

  const inReviewCount     = protocols.filter(p => p.status === 'in_review').length;
  const needsChangesCount = protocols.filter(p => p.status === 'needs_changes').length;
  const approvedCount     = protocols.filter(p => p.status === 'approved').length;

  const filtered = search.trim()
    ? protocols.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.source.toLowerCase().includes(search.toLowerCase())
      )
    : protocols;

  const grouped = filtered.reduce<Record<string, Protocol[]>>((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>🕐 Review Queue</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Templates staged for clinical and informatics review. Approve or request changes before publishing.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
          <OutlineBtn onClick={() => setShowUpload(true)}>📤 Upload Protocol</OutlineBtn>
          <TealBtn    onClick={() => setShowBuild(true)}>🔬 Build / Customise</TealBtn>
        </div>
      </div>

      {/* Status summary banner */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'In Review',     count: inReviewCount,     color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
          { label: 'Needs Changes', count: needsChangesCount, color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
          { label: 'Approved',      count: approvedCount,     color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: '11px', color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 2, padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>Templates require ≥80% SNOMED coverage and clinical sign-off before publishing.</span>
        </div>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Groups */}
      {Object.entries(grouped).map(([cat, items]) => (
        <CategoryGroup key={cat} category={cat} count={items.length}>
          {items.map(p => <ProtocolCard key={p.id} protocol={p} />)}
        </CategoryGroup>
      ))}

      {filtered.length === 0 && <EmptyState search={search} />}

      {showUpload && <UploadProtocolModal onClose={() => setShowUpload(false)} />}
      {showBuild && (
        <BuildCustomiseModal
          onClose={() => setShowBuild(false)}
          onBuildBlank={() => { setShowBuild(false); navigate('/template-editor/new'); }}
          onBuildFromTemplate={id => { setShowBuild(false); navigate(`/template-editor/${id}?mode=duplicate`); }}
        />
      )}
    </div>
  );
};

export default ReviewQueueSection;
