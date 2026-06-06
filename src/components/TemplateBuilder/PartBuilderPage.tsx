// src/components/TemplateBuilder/PartBuilderPage.tsx
// ─────────────────────────────────────────────────────────────
// Full-screen editor for a single ReportPart.
// Reuses TemplateCanvas, TemplateInspector, and TemplatePalette
// exactly as-is — they operate on TemplateNode[] regardless of
// whether they're inside a Part or an old-style Template.
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ReportPart, ReportPartType } from '../../types/reportPart';
import type { TemplateNode } from '../../types/template';
import { TemplatePalette }   from './TemplatePalette';
import { TemplateCanvas, updateNode } from './TemplateCanvas';
import { TemplateInspector } from './TemplateInspector';
import { mockReportPartService } from '../../services/reportParts/mockReportPartService';

const svc = mockReportPartService;

// ── Type config ────────────────────────────────────────────────

const TYPE_CONFIG: Record<ReportPartType, { label: string; icon: string; color: string }> = {
  header: { label: 'Header Part',  icon: '▲', color: '#1e40af' },
  footer: { label: 'Footer Part',  icon: '▼', color: '#7c3aed' },
  body:   { label: 'Body Part',    icon: '▬', color: '#166534' },
};

// ── Save state ─────────────────────────────────────────────────

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error';

// ── Main page ──────────────────────────────────────────────────

const PartBuilderPage: React.FC = () => {
  const { partId } = useParams<{ partId: string }>();
  const navigate   = useNavigate();

  const [part, setPart]         = useState<ReportPart | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ───────────────────────────────────────────────────

  useEffect(() => {
    if (!partId || partId === 'new') {
      // Blank part — start with a picker
      setLoading(false);
      return;
    }
    svc.getById(partId).then(r => {
      if (r.ok) setPart(r.data);
      setLoading(false);
    });
  }, [partId]);

  // ── Auto-save ──────────────────────────────────────────────

  useEffect(() => {
    if (saveState !== 'unsaved' || !part) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveState('saving');
      const isNew = !partId || partId === 'new';
      const r = isNew
        ? await svc.create(part)
        : await svc.save(part);
      if (r.ok) {
        setPart(r.data);
        setSaveState('saved');
        if (isNew) navigate(`/admin/parts/${r.data.id}/edit`, { replace: true });
      } else {
        setSaveState('error');
      }
    }, 1000);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [saveState, part, partId, navigate]);

  const markUnsaved = useCallback((updated: ReportPart) => {
    setPart(updated);
    setSaveState('unsaved');
  }, []);

  // ── Node operations ────────────────────────────────────────

  const handleNodesChange = useCallback((nodes: TemplateNode[]) => {
    if (!part) return;
    markUnsaved({ ...part, nodes });
  }, [part, markUnsaved]);

  const handleNodeUpdate = useCallback((updated: TemplateNode) => {
    if (!part) return;
    const nodes = updateNode(part.nodes, updated.id, () => updated);
    markUnsaved({ ...part, nodes });
  }, [part, markUnsaved]);

  const selectedNode = selectedId && part
    ? findNode(part.nodes, selectedId)
    : null;

  // ── New part type picker ───────────────────────────────────

  if (!loading && !part && (!partId || partId === 'new')) {
    return <NewPartTypePicker onPick={type => {
      const blank: ReportPart = {
        id: crypto.randomUUID(), name: `New ${TYPE_CONFIG[type].label}`,
        partType: type, specialty: 'General', status: 'draft',
        nodes: [], institutionId: '', createdBy: 'current-user',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      setPart(blank);
      setSaveState('unsaved');
    }} onBack={() => navigate(-1)} />;
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontSize: 14, color: '#94a3b8', background: '#f8fafc' }}>
      Loading part…
    </div>
  );

  if (!part) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontSize: 14, color: '#ef4444', background: '#f8fafc' }}>
      Part not found.
    </div>
  );

  const tc = TYPE_CONFIG[part.partType];

  return (
    <div style={S.root}>
      {/* ── Topbar ── */}
      <header style={S.topbar}>
        <div style={S.topLeft}>
          <button onClick={() => navigate(-1)} style={S.backBtn}>←</button>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `${tc.color}15`, color: tc.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {tc.icon}
          </div>
          <div>
            <input
              value={part.name}
              onChange={e => markUnsaved({ ...part, name: e.target.value })}
              style={S.nameInput}
            />
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {tc.label} · {part.specialty}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {saveState === 'saving' ? '⟳ Saving…'
              : saveState === 'saved' ? '✓ Saved'
              : saveState === 'unsaved' ? '● Unsaved'
              : '✕ Error'}
          </span>
          <button
            onClick={() => setShowGrid(g => !g)}
            style={{
              ...S.btn,
              background: showGrid ? '#0891b2' : undefined,
              color: showGrid ? '#fff' : undefined,
              border: showGrid ? '1px solid #0891b2' : '1px solid #475569',
              fontWeight: showGrid ? 700 : 500,
            }}
          >
            ⊞ {showGrid ? 'Grid on' : 'Grid off'}
          </button>
          <button onClick={() => setMetaOpen(o => !o)} style={S.btn}>
            Settings
          </button>
          <button
            onClick={async () => {
              const r = await svc.publish(part.id);
              if (r.ok) setPart(r.data);
            }}
            disabled={part.status === 'published'}
            style={{
              ...S.btn,
              background: part.status === 'published' ? '#e2e8f0' : '#0891b2',
              color: part.status === 'published' ? '#94a3b8' : '#fff',
              border: 'none',
            }}
          >
            {part.status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Settings panel ── */}
      {metaOpen && (
        <div style={S.metaPanel}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {(['header','body','footer'] as ReportPartType[]).map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="partType" value={type} checked={part.partType === type}
                  onChange={() => markUnsaved({ ...part, partType: type })} />
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>
                  {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label}
                </span>
              </label>
            ))}
            <div>
              <div style={S.metaLabel}>Specialty</div>
              <input value={part.specialty} onChange={e => markUnsaved({ ...part, specialty: e.target.value })}
                placeholder="General" style={S.metaInput} />
            </div>
            <div>
              <div style={S.metaLabel}>Description</div>
              <input value={part.description ?? ''} onChange={e => markUnsaved({ ...part, description: e.target.value })}
                placeholder="What this part contains" style={S.metaInput} />
            </div>
            <div>
              <div style={S.metaLabel}>Standard</div>
              <select value={part.standard ?? ''} onChange={e => markUnsaved({ ...part, standard: e.target.value as ReportPart['standard'] })}
                style={S.metaSelect}>
                <option value="">None</option>
                <option value="CAP">CAP</option>
                <option value="RCPath">RCPath</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-panel layout ── */}
      <div style={S.body}>
        <TemplatePalette />

        <div style={S.canvasWrapper}>
          <div style={S.canvasToolbar}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {countNodes(part.nodes)} component{countNodes(part.nodes) !== 1 ? 's' : ''}
            </span>
            {selectedId && (
              <button onClick={() => setSelectedId(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}>
                Clear selection
              </button>
            )}
          </div>
          <TemplateCanvas
            nodes={part.nodes}
            selectedId={selectedId}
            onSelect={id => setSelectedId(id || null)}
            onChange={handleNodesChange}
            showGrid={showGrid}
            partType={part.partType}
          />
        </div>

        <TemplateInspector node={selectedNode} onUpdate={handleNodeUpdate} />
      </div>
    </div>
  );
};

// ── New part type picker ───────────────────────────────────────

const NewPartTypePicker: React.FC<{
  onPick: (type: ReportPartType) => void;
  onBack: () => void;
}> = ({ onPick, onBack }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', background: '#f8fafc',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", gap: 32 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
        What kind of part are you creating?
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        Parts are reusable building blocks assembled into report templates.
      </div>
    </div>
    <div style={{ display: 'flex', gap: 16 }}>
      {(['header', 'body', 'footer'] as ReportPartType[]).map(type => {
        const tc = TYPE_CONFIG[type];
        const descriptions: Record<ReportPartType, string> = {
          header: 'Institution branding, accession number, patient demographics. Appears at the top of pages.',
          body:   'Clinical content — diagnosis, gross description, microscopic, synoptic data. The main report substance.',
          footer: 'Page numbers, confidentiality notice, patient identity line. Appears at the bottom of pages.',
        };
        return (
          <button key={type} onClick={() => onPick(type)} style={{
            width: 200, padding: '28px 20px', borderRadius: 14, border: `2px solid ${tc.color}30`,
            background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = tc.color;
              e.currentTarget.style.background = `${tc.color}08`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${tc.color}30`;
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12, color: tc.color }}>{tc.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {tc.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              {descriptions[type]}
            </div>
          </button>
        );
      })}
    </div>
    <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8',
      cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
      ← Back
    </button>
  </div>
);

// ── Helpers ────────────────────────────────────────────────────

function findNode(nodes: TemplateNode[], id: string): TemplateNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const children = 'children' in n ? (n as { children: TemplateNode[] }).children : [];
    if (children.length > 0) { const f = findNode(children, id); if (f) return f; }
  }
  return null;
}

function countNodes(nodes: TemplateNode[]): number {
  let c = nodes.length;
  for (const n of nodes) {
    if ('children' in n && Array.isArray((n as { children: TemplateNode[] }).children))
      c += countNodes((n as { children: TemplateNode[] }).children);
  }
  return c;
}

// ── Styles ─────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root:         { display: 'flex', flexDirection: 'column', height: '100vh',
                  background: '#0f172a', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
                  color: '#cbd5e1', overflow: 'hidden' },
  topbar:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 16px', height: 52, background: '#0d1117',
                  borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, gap: 16 },
  topLeft:      { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  backBtn:      { background: 'none', border: '1px solid #1e293b', color: '#475569',
                  cursor: 'pointer', borderRadius: 6, width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0 },
  nameInput:    { background: 'transparent', border: 'none', color: '#f1f5f9',
                  fontSize: 14, fontWeight: 600, outline: 'none', padding: '0 2px',
                  display: 'block', width: '100%', maxWidth: 340 },
  btn:          { background: '#1e293b', border: '1px solid #475569', color: '#e2e8f0',
                  cursor: 'pointer', borderRadius: 6, padding: '5px 12px',
                  fontSize: 12, fontWeight: 500 },
  metaPanel:    { background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  padding: '12px 20px', flexShrink: 0 },
  metaLabel:    { fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.04em',
                  textTransform: 'uppercase', marginBottom: 4 },
  metaInput:    { width: '100%', background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 5, color: '#cbd5e1', fontSize: 12, padding: '6px 8px',
                  boxSizing: 'border-box', outline: 'none' },
  metaSelect:   { width: '100%', background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 5, color: '#cbd5e1', fontSize: 12, padding: '6px 8px', outline: 'none' },
  body:         { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' },
  canvasWrapper:{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
                  overflow: 'hidden', background: '#1e2535' },
  canvasToolbar:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: '#1a2030', flexShrink: 0 },
};

export default PartBuilderPage;
