// src/components/TemplateBuilder/TemplateListTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReportTemplate } from '../../types/reportPart';
import {
  mockReportTemplateService,
  onReportTemplatesChanged,
  STANDARD_TEMPLATE_ID,
} from '../../services/reportTemplates/mockReportTemplateService';

const svc = mockReportTemplateService;

// ── Status badge ───────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ReportTemplate['status'] }> = ({ status }) => {
  return <span className={`tmpl-badge tmpl-badge--${status}`}>{status}</span>;
};

// ── Empty state ────────────────────────────────────────────────

const EmptyState: React.FC<{ onBlank: () => void; onStandard: () => void }> = ({ onBlank, onStandard }) => (
  <div className="tmpl-empty">
    <div className="tmpl-empty__icon">⊞</div>
    <div className="tmpl-empty__title">No report templates yet</div>
    <div className="tmpl-empty__desc">
      Report templates define the structure, fields, and AI generation rules for Orchestration mode.
      Start from the standard surgical pathology layout or build from scratch.
    </div>
    <div className="tmpl-empty__actions">
      <button onClick={onStandard} className="ps-btn-ghost-teal">Use Standard Template</button>
      <button onClick={onBlank}    className="ps-btn-ghost-teal">Start Blank</button>
    </div>
  </div>
);

// ── Template row ───────────────────────────────────────────────

const TemplateRow: React.FC<{
  template:      ReportTemplate;
  onEdit:        () => void;
  onDuplicate:   () => void;
  onDelete:      () => void;
  isDeleting:    boolean;
  isDuplicating: boolean;
}> = ({ template, onEdit, onDuplicate, onDelete, isDeleting, isDuplicating }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isStandard = template.id === STANDARD_TEMPLATE_ID;

  const nodeCount = countNodes(template);
  const updatedAt = new Date(template.updatedAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div
      onMouseLeave={() => setConfirmDelete(false)}
      className="tmpl-row"
    >
      {/* Icon */}
      <div className={`tmpl-row-icon${isStandard ? ' tmpl-row-icon--standard' : ''}`}>
        ⊞
      </div>

      {/* Name + meta */}
      <div className="tmpl-row-info">
        <div className="tmpl-row-title-row">
          <span className="tmpl-row-name">
            {template.name}
          </span>
          <StatusBadge status={template.status} />
          {template.orchestrationEnabled && <span className="tmpl-badge tmpl-badge--ai">AI</span>}
          {isStandard && <span className="tmpl-badge tmpl-badge--standard">STANDARD</span>}
        </div>
        <div className="tmpl-row-meta">
          {template.specialty && (
            <span>{template.specialty}{template.subspecialty ? ` — ${template.subspecialty}` : ''}</span>
          )}
          {template.standard && <span>{template.standard}</span>}
          <span>{nodeCount} active slot{nodeCount !== 1 ? 's' : ''}</span>
          <span>Updated {updatedAt}</span>
        </div>
      </div>

      {/* Actions — shown via CSS :hover on .tmpl-row */}
      <div className="tmpl-row-actions">
          {!isStandard && (
            <button onClick={onEdit} className="tmpl-row-btn tmpl-row-btn--edit">Edit</button>
          )}
          <button onClick={onDuplicate} disabled={isDuplicating} className="tmpl-row-btn">
            {isDuplicating ? '…' : 'Duplicate'}
          </button>
          {!isStandard && (
            confirmDelete ? (
              <>
                <span className="tmpl-delete-confirm-label">Delete?</span>
                <button onClick={onDelete} disabled={isDeleting} className="tmpl-row-btn tmpl-row-btn--confirm-delete">
                  {isDeleting ? '…' : 'Yes'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="tmpl-row-btn">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="tmpl-row-btn tmpl-row-btn--delete">Delete</button>
            )
          )}
        </div>
    </div>
  );
};

// ── Main tab ───────────────────────────────────────────────────

const TemplateListTab: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates]           = useState<ReportTemplate[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [filter, setFilter]                 = useState<'all' | ReportTemplate['status']>('all');
  const [search, setSearch]                 = useState('');
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await svc.getAll();
      if (result.ok) setTemplates(result.data);
      else if (result.ok === false) setError(result.error);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return onReportTemplatesChanged(load);
  }, [load]);

  const handleCreate = async (fromStandardId?: string) => {
    if (fromStandardId) {
      const result = await svc.clone(fromStandardId, 'My Surgical Pathology Report');
      if (result.ok) navigate(`/admin/templates/${result.data.id}/edit`);
      else if (result.ok === false) setError(result.error);
    } else {
      navigate('/admin/templates/new');
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const result = await svc.clone(id);
      if (result.ok) navigate(`/admin/templates/${result.data.id}/edit`);
      else if (result.ok === false) setError(result.error);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to duplicate');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await svc.remove(id);
      if (result.ok === false) setError(result.error);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = templates
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty ?? '').toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all:       templates.length,
    published: templates.filter(t => t.status === 'published').length,
    draft:     templates.filter(t => t.status === 'draft').length,
    archived:  templates.filter(t => t.status === 'archived').length,
  };

  return (
    <div className="tmpl-list-root">

      {/* Header */}
      <div className="tmpl-list-header">
        <div>
          <h2 className="tmpl-list-title">Report Templates</h2>
          <p className="tmpl-list-subtitle">
            Define structure, fields, and AI generation for Orchestration mode
          </p>
        </div>
        <div className="tmpl-header-actions">
          <button
            onClick={() => handleCreate(STANDARD_TEMPLATE_ID)}
            className="ps-btn-ghost-teal"
            title="Copy the standard surgical pathology layout as a starting point"
          >
            From Standard
          </button>
          <button onClick={() => handleCreate()} className="ps-btn-ghost-teal">
            + New Template
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="tmpl-error">
          {error}
          <button onClick={() => setError(null)}
className="tmpl-error-dismiss">✕</button>
        </div>
      )}

      {/* Filter + search */}
      {!loading && templates.length > 0 && (
        <div className="tmpl-filter-row">
          <div className="tmpl-filter-bar">
            {(['all', 'published', 'draft', 'archived'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`tmpl-filter-btn${filter === f ? ' active' : ''}`}>
                {f}{counts[f] > 0 && <span className="tmpl-filter-count"> ({counts[f]})</span>}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="tmpl-search"
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="tmpl-loading">Loading templates…
        </div>
      ) : filtered.length === 0 && templates.length === 0 ? (
        <EmptyState
          onBlank={() => handleCreate()}
          onStandard={() => handleCreate(STANDARD_TEMPLATE_ID)}
        />
      ) : filtered.length === 0 ? (
        <div className="tmpl-loading">No templates match your search
        </div>
      ) : (
        <div className="tmpl-list-body">
          {filtered.map(t => (
            <TemplateRow
              key={t.id}
              template={t}
              onEdit={() => navigate(`/admin/templates/${t.id}/edit`)}
              onDuplicate={() => handleDuplicate(t.id)}
              onDelete={() => handleDelete(t.id)}
              isDeleting={deletingId === t.id}
              isDuplicating={duplicatingId === t.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateListTab;

// ── Helpers ────────────────────────────────────────────────────

function countNodes(template: ReportTemplate): number {
  return template.assembly?.filter(s => s.enabled).length ?? 0;
}

function btn(color: string, small = false): React.CSSProperties {
  return {
    background: color, border: 'none', borderRadius: small ? 5 : 7,
    color: '#fff', cursor: 'pointer', fontSize: small ? 11 : 12,
    fontWeight: 600, padding: small ? '4px 10px' : '7px 16px', whiteSpace: 'nowrap',
  };
}
