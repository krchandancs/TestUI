// src/components/TemplateBuilder/PartLibraryTab.tsx
// Config tab — browse, create, edit and duplicate Report Parts.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReportPart, ReportPartType } from '../../types/reportPart';
import { mockReportPartService, onReportPartsChanged } from '../../services/reportParts/mockReportPartService';

const svc = mockReportPartService;

// ── Type config (labels/icons only — colours handled via CSS modifier classes) ──

const TYPE_CONFIG: Record<ReportPartType, { label: string; icon: string }> = {
  header: { label: 'Header', icon: '▲' },
  footer: { label: 'Footer', icon: '▼' },
  body:   { label: 'Body',   icon: '▬' },
};

// ── Protected built-in part IDs ───────────────────────────────────────────────

const PROTECTED = new Set([
  'std_header_page1', 'std_header_p2plus', 'std_footer_page1', 'std_footer_p2plus',
  'std_body_demographics', 'std_body_clinical', 'std_body_specimens', 'std_body_diagnosis',
  'std_body_synoptic', 'std_body_gross', 'std_body_microscopic', 'std_body_ancillary',
  'std_body_comment', 'std_body_signoff',
]);

// ── Part Card ─────────────────────────────────────────────────────────────────

const PartCard: React.FC<{
  part:          ReportPart;
  onEdit:        () => void;
  onDuplicate:   () => void;
  onArchive:     () => void;
  isProtected:   boolean;
  isDuplicating: boolean;
}> = ({ part, onEdit, onDuplicate, onArchive, isProtected, isDuplicating }) => {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const tc = TYPE_CONFIG[part.partType];

  return (
    <div
      className={`ps-part-card${confirmArchive ? ' confirm-active' : ''}`}
      onMouseLeave={() => setConfirmArchive(false)}
    >
      {/* Type icon */}
      <div className={`ps-part-card__icon ps-part-card__icon--${part.partType}`}>
        {tc.icon}
      </div>

      {/* Info */}
      <div className="ps-part-card__info">
        <div className="ps-part-card__name-row">
          <span className="ps-part-card__name">{part.name}</span>
          <span className={`ps-part-card__badge ps-part-card__badge--${part.status}`}>
            {part.status}
          </span>
          {isProtected && (
            <span className="ps-part-card__badge ps-part-card__badge--builtin">BUILT-IN</span>
          )}
        </div>
        <div className="ps-part-card__desc">
          {tc.label} · {part.specialty}{part.subspecialty ? ` — ${part.subspecialty}` : ''}
          {part.description && ` · ${part.description}`}
        </div>
      </div>

      {/* Actions — shown on :hover or when confirm-active via CSS */}
      <div className="ps-part-card__actions">
        {!isProtected && (
          <button onClick={onEdit} className="ps-part-card__btn ps-part-card__btn--primary">
            Edit
          </button>
        )}
        <button
          onClick={onDuplicate}
          disabled={isDuplicating}
          className="ps-part-card__btn ps-part-card__btn--secondary"
        >
          {isDuplicating ? 'Duplicating…' : 'Duplicate'}
        </button>
        {!isProtected && (
          confirmArchive ? (
            <>
              <span className="ps-part-card__confirm-text">Archive?</span>
              <button onClick={onArchive}                    className="ps-part-card__btn ps-part-card__btn--danger">Yes</button>
              <button onClick={() => setConfirmArchive(false)} className="ps-part-card__btn ps-part-card__btn--cancel">No</button>
            </>
          ) : (
            <button onClick={() => setConfirmArchive(true)} className="ps-part-card__btn ps-part-card__btn--cancel">
              Archive
            </button>
          )
        )}
      </div>
    </div>
  );
};

// ── Main tab ──────────────────────────────────────────────────────────────────

const PartLibraryTab: React.FC = () => {
  const navigate = useNavigate();
  const [parts,      setParts]      = useState<ReportPart[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ReportPartType | 'all'>('all');
  const [search,     setSearch]     = useState('');
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await svc.getAll();
    if (r.ok) setParts(r.data.filter((p: any) => p.status !== 'archived'));
    else if (r.ok === false) setError(r.error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); return onReportPartsChanged(load); }, [load]);

  const handleDuplicate = async (id: string) => {
    setDuplicating(id);
    const r = await svc.clone(id);
    if (r.ok) navigate(`/admin/parts/${r.data.id}/edit`);
    else if (r.ok === false) setError(r.error);
    setDuplicating(null);
  };

  const handleArchive = async (id: string) => {
    const r = await svc.archive(id);
    if (r.ok === false) setError(r.error);
  };

  const filtered = parts
    .filter(p => typeFilter === 'all' || p.partType === typeFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const grouped: Record<ReportPartType, ReportPart[]> = {
    header: filtered.filter(p => p.partType === 'header'),
    body:   filtered.filter(p => p.partType === 'body'),
    footer: filtered.filter(p => p.partType === 'footer'),
  };

  return (
    <div className="ps-part-lib">

      {/* Header */}
      <div className="ps-part-lib__header">
        <div>
          <h2 className="ps-part-lib__title">Part Library</h2>
          <p className="ps-part-lib__subtitle">
            Reusable report parts — headers, footers and body sections assembled into templates
          </p>
        </div>
        <button
          className="ps-part-lib__new-btn"
          onClick={() => navigate('/admin/parts/new')}
        >
          + New Part
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="ps-part-lib__error">
          {error}
          <button className="ps-part-lib__error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="ps-part-lib__filters">
        <div className="ps-part-lib__filter-group">
          {(['all', 'header', 'body', 'footer'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`ps-part-lib__filter-btn${typeFilter === f ? ' active' : ''}`}
            >
              {f === 'all' ? 'All' : `${TYPE_CONFIG[f].icon} ${TYPE_CONFIG[f].label}s`}
            </button>
          ))}
        </div>
        <input
          className="ps-part-lib__search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parts…"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="ps-part-lib__loading">Loading parts…</div>
      ) : (
        (['header', 'body', 'footer'] as ReportPartType[]).map(type => {
          if (typeFilter !== 'all' && typeFilter !== type) return null;
          const group = grouped[type];
          const tc    = TYPE_CONFIG[type];

          return (
            <div key={type}>
              <div className={`ps-part-lib__group-header ps-part-lib__group-header--${type}`}>
                <span className={`ps-part-lib__group-icon ps-part-lib__group-icon--${type}`}>
                  {tc.icon}
                </span>
                <span className={`ps-part-lib__group-label ps-part-lib__group-label--${type}`}>
                  {tc.label}s
                </span>
                <span className="ps-part-lib__group-count">{group.length}</span>
              </div>

              {group.length === 0 ? (
                <div className="ps-part-lib__empty">
                  No {tc.label.toLowerCase()} parts yet
                </div>
              ) : (
                group.map(p => (
                  <PartCard
                    key={p.id}
                    part={p}
                    isProtected={PROTECTED.has(p.id)}
                    isDuplicating={duplicating === p.id}
                    onEdit={() => navigate(`/admin/parts/${p.id}/edit`)}
                    onDuplicate={() => handleDuplicate(p.id)}
                    onArchive={() => handleArchive(p.id)}
                  />
                ))
              )}
            </div>
          );
        })
      )}

    </div>
  );
};

export default PartLibraryTab;
