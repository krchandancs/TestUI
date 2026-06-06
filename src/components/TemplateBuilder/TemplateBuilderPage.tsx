// src/components/TemplateBuilder/TemplateBuilderPage.tsx
// ─────────────────────────────────────────────────────────────
// The main Template Builder page for PathScribe Orchestration mode.
// Wires together the Palette, Canvas, and Inspector.
// Route: /admin/templates/:templateId/edit  (or /admin/templates/new)
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ReportTemplate, TemplateNode } from '../../types/template';
import { TemplatePalette } from './TemplatePalette';
import { TemplateCanvas, updateNode } from './TemplateCanvas';
import { TemplateInspector } from './TemplateInspector';
import { TemplatePreviewPanel } from './TemplatePreviewPanel';
import {
  mockReportTemplateService,
} from '../../services/reportTemplates/mockReportTemplateService';

const svc = mockReportTemplateService;

// ── Blank template factory ─────────────────────────────────────

function blankTemplate(id: string): ReportTemplate {
  return {
    id,
    name: 'New Template',
    specialty: '',
    status: 'draft',
    nodes: [],
    orchestrationEnabled: true,
    institutionId: '',
    createdBy: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
  };
}

// ── Save state indicator ───────────────────────────────────────

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error';

// ── Main page ──────────────────────────────────────────────────

export const TemplateBuilderPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<ReportTemplate>(() =>
    blankTemplate(templateId ?? crypto.randomUUID())
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  // Load existing template from service on mount
  useEffect(() => {
    if (!templateId || templateId === 'new') return;
    svc.getById(templateId)
      .then(result => { if (result.ok) setTemplate(result.data as unknown as ReportTemplate); })
      .catch(() => { /* template not found — stay on blank */ });
  }, [templateId]);

  // Auto-save to localStorage (replace with API call in production)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveState !== 'unsaved') return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        const isNew = !templateId || templateId === 'new';
        const result = isNew
          ? await svc.create(template as any)
          : await svc.save(template as any);
        if (result.ok) {
          setTemplate(result.data as unknown as ReportTemplate);
          setSaveState('saved');
          if (isNew) navigate(`/admin/templates/${result.data.id}/edit`, { replace: true });
        } else {
          setSaveState('error');
        }
      } catch {
        setSaveState('error');
      }
    }, 1200);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [saveState, template]);

  const markUnsaved = useCallback((updated: ReportTemplate) => {
    setTemplate(updated);
    setSaveState('unsaved');
  }, []);

  // ── Node changes ─────────────────────────────────────────────

  const handleNodesChange = useCallback(
    (nodes: TemplateNode[]) =>
      markUnsaved({ ...template, nodes, updatedAt: new Date().toISOString() }),
    [template, markUnsaved]
  );

  const handleSelect = useCallback((id: string) => setSelectedId(id || null), []);

  const selectedNode = selectedId
    ? findNode(template.nodes, selectedId)
    : null;

  const handleNodeUpdate = useCallback(
    (updated: TemplateNode) => {
      const nodes = updateNode(template.nodes, updated.id, () => updated);
      markUnsaved({ ...template, nodes, updatedAt: new Date().toISOString() });
    },
    [template, markUnsaved]
  );

  // ── Template metadata ─────────────────────────────────────────

  const [metaOpen, setMetaOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <div style={styles.root}>
      {/* ── Topbar ── */}
      <header style={styles.topbar}>
        <div style={styles.topLeft}>
          <button
            onClick={() => navigate(-1)}
            style={styles.backBtn}
            title="Back to templates"
          >
            ←
          </button>
          <div style={styles.templateMeta}>
            <input
              value={template.name}
              onChange={e => markUnsaved({ ...template, name: e.target.value })}
              style={styles.templateName}
            />
            <span style={styles.templateSpecialty}>
              {template.specialty || 'No specialty set'}
            </span>
          </div>
        </div>

        <div style={styles.topCenter}>
          <span style={{
            ...styles.statusBadge,
            background: template.status === 'published'
              ? 'rgba(14,159,110,0.15)'
              : 'rgba(234,179,8,0.15)',
            color: template.status === 'published' ? '#0e9f6e' : '#eab308',
            border: `1px solid ${template.status === 'published' ? '#0e9f6e44' : '#eab30844'}`,
          }}>
            {template.status}
          </span>
          <span style={styles.saveIndicator}>
            {saveState === 'saving' && '⟳ Saving…'}
            {saveState === 'saved' && '✓ Saved'}
            {saveState === 'unsaved' && '● Unsaved'}
            {saveState === 'error' && '✕ Save failed'}
          </span>
        </div>

        <div style={styles.topRight}>
          <button
            onClick={() => setShowGrid(g => !g)}
            style={{
              ...styles.toolbarBtn,
              background: showGrid ? '#0891b2' : '#1e293b',
              color: showGrid ? '#ffffff' : '#e2e8f0',
              border: showGrid ? '1px solid #0891b2' : '1px solid #475569',
              fontWeight: showGrid ? 700 : 500,
            }}
            title="Toggle dot grid guides on the page"
          >
            ⊞ {showGrid ? 'Grid on' : 'Grid off'}
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            style={styles.toolbarBtn}
          >
            Preview
          </button>
          <button
            onClick={() => setMetaOpen(o => !o)}
            style={styles.toolbarBtn}
          >
            Settings
          </button>
          <button
            onClick={async () => {
                if (template.status === 'published') return;
                const result = await svc.publish(template.id);
                if (result.ok) setTemplate(result.data as unknown as ReportTemplate);
              }}
            style={{ ...styles.toolbarBtn, ...styles.publishBtn }}
            disabled={template.status === 'published'}
          >
            {template.status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Settings panel (slide-down) ── */}
      {metaOpen && (
        <div style={styles.metaPanel}>
          <div style={styles.metaGrid}>
            <div>
              <div style={styles.metaLabel}>Specialty</div>
              <input
                value={template.specialty}
                onChange={e => markUnsaved({ ...template, specialty: e.target.value })}
                placeholder="e.g. breast, prostate, lung"
                style={styles.metaInput}
              />
            </div>
            <div>
              <div style={styles.metaLabel}>Subspecialty</div>
              <input
                value={template.subspecialty ?? ''}
                onChange={e => markUnsaved({ ...template, subspecialty: e.target.value })}
                placeholder="e.g. invasive ductal carcinoma"
                style={styles.metaInput}
              />
            </div>
            <div>
              <div style={styles.metaLabel}>Standard</div>
              <select
                value={template.standard ?? ''}
                onChange={e => markUnsaved({ ...template, standard: e.target.value as ReportTemplate['standard'] })}
                style={styles.metaSelect}
              >
                <option value="">None</option>
                <option value="CAP">CAP</option>
                <option value="RCPath">RCPath</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <div style={styles.metaLabel}>Orchestration (AI)</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={template.orchestrationEnabled}
                  onChange={e => markUnsaved({ ...template, orchestrationEnabled: e.target.checked })}
                />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Enable AI generation</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Main 3-panel layout ── */}
      <div style={styles.body}>
        <TemplatePalette />

        <div style={styles.canvasWrapper}>
          <div style={styles.canvasToolbar}>
            <span style={styles.nodeCount}>
              {countNodes(template.nodes)} component{countNodes(template.nodes) !== 1 ? 's' : ''}
            </span>
            {selectedId && (
              <button
                onClick={() => setSelectedId(null)}
                style={styles.clearSelBtn}
              >
                Clear selection
              </button>
            )}
          </div>
          <TemplateCanvas
            nodes={template.nodes}
            selectedId={selectedId}
            onSelect={handleSelect}
            onChange={handleNodesChange}
            showGrid={showGrid}
          />
        </div>

        <TemplateInspector node={selectedNode} onUpdate={handleNodeUpdate} />
      </div>

      {previewOpen && (
        <TemplatePreviewPanel
          template={template}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};

// ── Utilities ──────────────────────────────────────────────────

function findNode(nodes: TemplateNode[], id: string): TemplateNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const children = 'children' in n ? (n as { children: TemplateNode[] }).children : [];
    if (children.length > 0) {
      const found = findNode(children, id);
      if (found) return found;
    }
  }
  return null;
}

function countNodes(nodes: TemplateNode[]): number {
  let count = nodes.length;
  for (const n of nodes) {
    const children = 'children' in n ? (n as { children: TemplateNode[] }).children : [];
    count += countNodes(children);
  }
  return count;
}

// ── Styles ─────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f172a',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#cbd5e1',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 52,
    background: '#0d1117',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
    gap: 16,
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  topCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #1e293b',
    color: '#475569',
    cursor: 'pointer',
    borderRadius: 6,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  templateMeta: {
    minWidth: 0,
  },
  templateName: {
    background: 'transparent',
    border: 'none',
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 600,
    outline: 'none',
    padding: '0 2px',
    display: 'block',
    width: '100%',
    maxWidth: 300,
  },
  templateSpecialty: {
    fontSize: 10,
    color: '#475569',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    letterSpacing: '0.04em',
    textTransform: 'capitalize',
  },
  saveIndicator: {
    fontSize: 11,
    // WCAG: #94a3b8 on #0d1117 = 5.8:1 ✓
    color: '#94a3b8',
    minWidth: 80,
    textAlign: 'center',
  },
  toolbarBtn: {
    background: '#1e293b',
    border: '1px solid #475569',
    // WCAG: #e2e8f0 on #1e293b = 11.5:1 ✓
    color: '#e2e8f0',
    cursor: 'pointer',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 500,
  },
  publishBtn: {
    background: '#0e9f6e',
    border: '1px solid #0e9f6e',
    color: '#fff',
  },
  metaPanel: {
    background: '#0d1117',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    padding: '12px 20px',
    flexShrink: 0,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#475569',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaInput: {
    width: '100%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#cbd5e1',
    fontSize: 12,
    padding: '6px 8px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  metaSelect: {
    width: '100%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#cbd5e1',
    fontSize: 12,
    padding: '6px 8px',
    outline: 'none',
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    background: '#1e2535',
  },
  canvasToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: '#1a2030',
    flexShrink: 0,
  },
  nodeCount: {
    fontSize: 11,
    // WCAG: #94a3b8 on #1a2030 = 5.5:1 ✓
    color: '#94a3b8',
  },
  clearSelBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 11,
    padding: '2px 6px',
  },
};

export default TemplateBuilderPage;
