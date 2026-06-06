/**
 * ActiveProtocolsSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders validated/published protocols available in the reporting workflow.
 * Consumed by components/Config/Protocols/index.tsx (ProtocolsTab).
 *
 * Shows:
 *   - "Import CAP / RCPath" + "Build from Scratch" action buttons
 *   - Search bar
 *   - Protocols grouped by anatomical category
 *   - Each row expands to show stats, lifecycle tracker, and actions
 *
 * Navigation:
 *   "View Protocol" → /template-review/:id   (TemplateRenderer, read-only)
 *   "New Version"   → /template-editor/:id   (SynopticEditor, creates draft fork)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../../pathscribe.css';
import { useNavigate } from 'react-router-dom';
import {
  Protocol,
  useProtocols,
  LIFECYCLE_STYLES,
  SOURCE_STYLES,
  CATEGORY_COLORS,
  LIFECYCLE_ORDER,
  LifecycleBadge,
  CoverageBar,
  UploadProtocolModal,
  BuildCustomiseModal,
} from './protocolShared';

// ─── ProtocolCard ─────────────────────────────────────────────────────────────

const ProtocolCard: React.FC<{ protocol: Protocol }> = ({ protocol: p }) => {
  const navigate        = useNavigate();
  const [open, setOpen] = useState(false);
  const catColor        = CATEGORY_COLORS[p.category] ?? '#64748b';
  const srcStyle        = SOURCE_STYLES[p.source]     ?? SOURCE_STYLES.Custom;

  const stepIndex = LIFECYCLE_ORDER.indexOf(
    p.status === 'needs_changes' ? 'in_review' : p.status
  );

  return (
    <div style={{ marginBottom: '8px' }}>

      {/* Collapsed row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 18px',
          background:   open ? 'var(--ps-conf-surface-2)' : 'var(--ps-conf-surface)',
          border:       `1px solid ${open ? 'var(--ps-conf-border-active)' : 'var(--ps-conf-border)'}`,
          borderRadius: open ? '10px 10px 0 0' : '10px',
          cursor: 'pointer', transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'var(--ps-conf-surface-2)'; e.currentTarget.style.borderColor = '#475569'; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'var(--ps-conf-surface)'; e.currentTarget.style.borderColor = '#334155'; }}}
      >
        <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: catColor, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }} data-phi="name">{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{p.version}</span>
            <span style={{ color: '#334155' }}>&bull;</span>
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', padding: '1px 7px', borderRadius: '4px', background: srcStyle.bg, color: srcStyle.color }}>{p.source}</span>
            <span style={{ color: '#334155' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{p.type}</span>
          </div>
        </div>

        <LifecycleBadge state={p.status} />
        <span style={{ fontSize: '16px', color: '#475569', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', marginLeft: '4px', flexShrink: 0 }}>›</span>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ background: 'var(--ps-conf-surface-3)', border: '1px solid rgba(8,145,178,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px 20px 18px' }}>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid #1e293b' }}>
            {[
              { label: 'Sections',      value: Math.max(1, Math.round(p.fields / 7)) },
              { label: 'Fields',        value: p.fields },
              { label: 'Last Modified', value: p.lastModified },
              { label: 'Owner',         value: p.owner },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '220px', alignItems: 'flex-end' }}>
              <CoverageBar pct={p.snomedPct} label="SNOMED CT" />
              <CoverageBar pct={p.icdPct}    label="ICD-10/11" />
            </div>
          </div>

          {/* Lifecycle tracker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            {LIFECYCLE_ORDER.map((s, i) => {
              const sStyle    = LIFECYCLE_STYLES[s];
              const isCurrent = i === stepIndex;
              const isPast    = i < stepIndex;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0, background: isPast ? 'rgba(16,185,129,0.2)' : isCurrent ? sStyle.bg : '#1e293b', color: isPast ? '#10B981' : isCurrent ? sStyle.color : '#334155', border: `1px solid ${isPast ? 'rgba(16,185,129,0.4)' : isCurrent ? sStyle.border : '#334155'}` }}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? sStyle.color : isPast ? '#475569' : '#334155', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {s.replace('_', ' ')}
                    </span>
                  </div>
                  {i < LIFECYCLE_ORDER.length - 1 && <span style={{ color: '#1e293b', fontSize: '12px', flexShrink: 0 }}>—</span>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <ActionBtn color="#38bdf8" bg="rgba(56,189,248,0.1)" border="rgba(56,189,248,0.25)" onClick={() => navigate(`/template-review/${p.id}`)}>👁 View Protocol</ActionBtn>
            <ActionBtn onClick={() => navigate(`/template-editor/${p.id}`)}>📋 Duplicate</ActionBtn>
            <ActionBtn onClick={() => {}}>{'{ }'} Export JSON</ActionBtn>
            <ActionBtn onClick={() => navigate(`/template-editor/${p.id}`)}>🔁 New Version</ActionBtn>
            <ActionBtn danger onClick={() => {}}>🗑 Archive</ActionBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ActiveProtocolsSection: React.FC = () => {
  const navigate                      = useNavigate();
  const [search,     setSearch]       = useState('');
  const [showUpload,  setShowUpload]  = useState(false);
  const [showBuild,   setShowBuild]   = useState(false);

  const protocols = useProtocols(p => p.status === 'published');

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
      {/* Header + buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>✅ Active Protocols</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Validated CAP checklists currently available in the synoptic reporting workflow. Click any protocol to open the editor.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
          <OutlineBtn onClick={() => setShowUpload(true)}>📤 Upload Protocol</OutlineBtn>
          <TealBtn    onClick={() => setShowBuild(true)}>🔬 Build / Customise</TealBtn>
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

export default ActiveProtocolsSection;

// ─── Shared mini-components (local) ──────────────────────────────────────────

export const ActionBtn: React.FC<{ children: React.ReactNode; onClick: () => void; color?: string; bg?: string; border?: string; danger?: boolean }> = ({ children, onClick, color, bg, border, danger }) => (
  <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : border ?? '#334155'}`, background: danger ? 'rgba(239,68,68,0.06)' : bg ?? 'rgba(255,255,255,0.04)', color: danger ? '#f87171' : color ?? '#94a3b8', marginLeft: danger ? 'auto' : undefined, fontFamily: 'inherit' }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
  >{children}</button>
);

export const OutlineBtn: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
    onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.borderColor = '#475569'; }}
    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
  >{children}</button>
);

export const TealBtn: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid rgba(8,145,178,0.4)', background: 'rgba(8,145,178,0.1)', color: '#0891B2', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.18)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
  >{children}</button>
);

export const SearchBar: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div style={{ position: 'relative', marginBottom: '16px' }}>
    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search protocols…"
      style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--ps-conf-surface)', border: '1px solid var(--ps-conf-border)', borderRadius: '8px', fontSize: '13px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#0891B2')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#334155')}
    />
  </div>
);

export const CategoryGroup: React.FC<{ category: string; count: number; children: React.ReactNode }> = ({ category, count, children }) => {
  const catColor = CATEGORY_COLORS[category] ?? '#64748b';
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: catColor }}>● {category}</span>
        <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
        <span style={{ fontSize: '10px', color: '#334155' }}>{count} {count === 1 ? 'protocol' : 'protocols'}</span>
      </div>
      {children}
    </div>
  );
};

export const EmptyState: React.FC<{ search: string }> = ({ search }) => (
  <div style={{ padding: '60px 0', textAlign: 'center' }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>No protocols found</div>
    <div style={{ fontSize: '12px', color: '#475569' }}>{search ? `No results for "${search}"` : 'No protocols in this section yet.'}</div>
  </div>
);
