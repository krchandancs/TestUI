// src/components/TemplateBuilder/TemplateCanvas.tsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  type TemplateNode,
  type TemplateNodeType,
  type SectionNode,
  CONTAINER_NODE_TYPES,
  PALETTE_ITEMS,
  createDefaultNode,
} from '../../types/template';

// ── Grid context ───────────────────────────────────────────────
const GridContext = createContext<boolean>(false);

// ── Update context ─────────────────────────────────────────────
// Allows NodeCard to update a node's colSpan via drag-resize
// without threading a callback through every level.
const UpdateContext = createContext<((id: string, colSpan: number) => void) | null>(null);

// ── Types ──────────────────────────────────────────────────────

interface Props {
  nodes: TemplateNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (nodes: TemplateNode[]) => void;
  showGrid?: boolean;
  /** When set, hides irrelevant page zones. Body parts show no header/footer zones. */
  partType?: 'header' | 'footer' | 'body';
}

// ── Helpers ────────────────────────────────────────────────────

function getChildren(node: TemplateNode): TemplateNode[] {
  if ('children' in node && Array.isArray(node.children)) return node.children;
  return [];
}

function setChildren(node: TemplateNode, children: TemplateNode[]): TemplateNode {
  if ('children' in node) return { ...node, children };
  return node;
}

/** Deep insert a new node at parentId. If parentId is null, insert at root. */
function insertNode(
  nodes: TemplateNode[],
  newNode: TemplateNode,
  parentId: string | null,
  insertIndex?: number
): TemplateNode[] {
  if (parentId === null) {
    const idx = insertIndex ?? nodes.length;
    const next = [...nodes];
    next.splice(idx, 0, newNode);
    return next;
  }
  return nodes.map(n => {
    if (n.id === parentId) {
      const children = getChildren(n);
      const idx = insertIndex ?? children.length;
      const next = [...children];
      next.splice(idx, 0, newNode);
      return setChildren(n, next);
    }
    const children = getChildren(n);
    if (children.length > 0) {
      return setChildren(n, insertNode(children, newNode, parentId, insertIndex));
    }
    return n;
  });
}

/** Remove a node by id anywhere in the tree. Returns [updatedTree, removedNode]. */
function removeNode(
  nodes: TemplateNode[],
  id: string
): [TemplateNode[], TemplateNode | null] {
  let removed: TemplateNode | null = null;
  const next = nodes.filter(n => {
    if (n.id === id) { removed = n; return false; }
    return true;
  }).map(n => {
    const children = getChildren(n);
    if (children.length > 0) {
      const [nextChildren, r] = removeNode(children, id);
      if (r) removed = r;
      return setChildren(n, nextChildren);
    }
    return n;
  });
  return [next, removed];
}

/** Update a node by id anywhere in the tree. */
export function updateNode(
  nodes: TemplateNode[],
  id: string,
  updater: (n: TemplateNode) => TemplateNode
): TemplateNode[] {
  return nodes.map(n => {
    if (n.id === id) return updater(n);
    const children = getChildren(n);
    if (children.length > 0) {
      return setChildren(n, updateNode(children, id, updater));
    }
    return n;
  });
}

function isContainerType(type: TemplateNodeType): boolean {
  return CONTAINER_NODE_TYPES.includes(type);
}

function paletteColor(type: TemplateNodeType): string {
  return PALETTE_ITEMS.find(p => p.type === type)?.color ?? '#475569';
}

function paletteIcon(type: TemplateNodeType): string {
  return PALETTE_ITEMS.find(p => p.type === type)?.icon ?? '•';
}

// ── Drop zone component ────────────────────────────────────────

interface DropZoneProps {
  parentId: string | null;
  insertIndex: number;
  onDrop: (parentId: string | null, insertIndex: number, e: React.DragEvent) => void;
  isActive: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ parentId, insertIndex, onDrop, isActive }) => {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); setOver(false); onDrop(parentId, insertIndex, e); }}
      style={{
        height: over ? 32 : 6,
        margin: '1px 0',
        borderRadius: 4,
        background: over ? 'rgba(14,159,110,0.18)' : 'transparent',
        border: over ? '1.5px dashed #0e9f6e' : '1.5px solid transparent',
        transition: 'all 0.12s',
        display: isActive ? 'block' : 'none',
      }}
    />
  );
};

// ── Node card ─────────────────────────────────────────────────

interface NodeCardProps {
  node: TemplateNode;
  depth: number;
  selectedId: string | null;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDrop: (parentId: string | null, insertIndex: number, e: React.DragEvent) => void;
  onDelete: (id: string) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  depth,
  selectedId,
  isDragging,
  onSelect,
  onDrop,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedId === node.id;
  const isContainer = isContainerType(node.type);
  const children = getChildren(node);
  const color = paletteColor(node.type);
  const icon = paletteIcon(node.type);

  const hasBadge =
    node.type === 'section' &&
    (node as SectionNode).ai?.enabled;

  // ── Type-specific property chips ─────────────────────────────
  // Makes invisible toggle properties visible on the canvas card
  // so the designer can see why certain things appear in the preview.
  const propertyChips: string[] = [];
  if (node.type === 'header') {
    if ((node as import('../../types/template').HeaderNode).showLogo)        propertyChips.push('Logo');
    if ((node as import('../../types/template').HeaderNode).showAccession)   propertyChips.push('Accession #');
    if ((node as import('../../types/template').HeaderNode).showPatientName) propertyChips.push('Patient');
    const scope = (node as import('../../types/template').HeaderNode).scope;
    if (scope && scope !== 'all') propertyChips.push(scope === 'page1' ? 'Page 1 only' : 'Pages 2+');
  }
  if (node.type === 'footer') {
    if ((node as import('../../types/template').FooterNode).showPageNumbers) propertyChips.push('Page #');
    const scope = (node as import('../../types/template').FooterNode).scope;
    if (scope && scope !== 'all') propertyChips.push(scope === 'page1' ? 'Page 1 only' : 'Pages 2+');
  }
  if (node.type === 'repeat-group') {
    propertyChips.push(`↺ ${(node as import('../../types/template').RepeatGroupNode).iterateOver}`);
  }
  if (node.type === 'expression-value') {
    const tpl = (node as import('../../types/template').ExpressionValueNode).template;
    if (tpl) propertyChips.push(tpl.length > 22 ? tpl.slice(0, 22) + '…' : tpl);
  }
  if (node.type === 'page-break') {
    propertyChips.push('Always');
  }
  if (node.type === 'column-layout') {
    const n = (node as import('../../types/template').ColumnLayoutNode).numColumns;
    propertyChips.push(`${n} col · flows`);
  }
  // Column width chip — always show when not full-width
  const colSpan = node.colSpan ?? 12;
  if (colSpan < 12) {
    propertyChips.push(`${colSpan}/12 col`);
  }

  const showGrid  = useContext(GridContext);
  const onUpdate  = useContext(UpdateContext);
  const wrapRef   = React.useRef<HTMLDivElement>(null);

  // ── Drag-to-resize handle ──────────────────────────────────────
  const handleResizeMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX    = e.clientX;
    const startSpan = colSpan;

    const onMove = (mv: MouseEvent) => {
      const parent = wrapRef.current?.parentElement;
      if (!parent || !onUpdate) return;
      const parentW  = parent.getBoundingClientRect().width;
      const deltaX   = mv.clientX - startX;
      const deltaCols = Math.round((deltaX / parentW) * 12);
      const next     = Math.max(1, Math.min(12, startSpan + deltaCols));
      // Snap to common fractions: 1,2,3,4,6,8,9,12
      const snaps    = [1, 2, 3, 4, 6, 8, 9, 12];
      const snapped  = snaps.reduce((a, b) => Math.abs(b - next) < Math.abs(a - next) ? b : a);
      onUpdate(node.id, snapped);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colSpan, node.id, onUpdate]);

  return (
    <div
      ref={wrapRef}
      style={{
        gridColumn: `span ${colSpan}`,
        position: 'relative',
        outline: showGrid ? `1px dashed rgba(8,145,178,0.2)` : undefined,
        outlineOffset: 1,
      }}
    >
      {/* ── Width label shown when grid is on ── */}
      {showGrid && colSpan < 12 && (
        <div style={{
          position: 'absolute', top: -14, right: 4,
          fontSize: 8, color: 'rgba(8,145,178,0.6)',
          fontWeight: 700, letterSpacing: '0.04em', pointerEvents: 'none',
          background: '#fff', padding: '0 3px', borderRadius: 2,
        }}>
          {colSpan}/12
        </div>
      )}
      <div
        draggable
        onDragStart={e => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', 'node::' + node.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(node.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px 6px 0',
          borderRadius: 6,
          border: isSelected
            ? `1.5px solid ${color}bb`
            : `1.5px solid ${color}30`,
          background: isSelected
            ? `${color}18`
            : hovered
            ? `${color}0e`
            : `${color}08`,
          cursor: 'grab',
          transition: 'all 0.1s',
          marginBottom: 3,
          opacity: isDragging ? 0.4 : 1,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isSelected
            ? `0 1px 4px ${color}22`
            : '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {/* Left accent strip */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: isSelected ? color : `${color}60`,
          borderRadius: '6px 0 0 6px',
          transition: 'background 0.1s',
        }} />

        {/* Padding spacer to account for accent strip */}
        <div style={{ width: 6, flexShrink: 0 }} />
        {/* Expand toggle for containers */}
        {isContainer && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
            style={{
              background: 'none',
              border: 'none',
              color: color,
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: 10,
              lineHeight: 1,
              flexShrink: 0,
              opacity: 0.7,
            }}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!isContainer && <div style={{ width: 14, flexShrink: 0 }} />}

        {/* Icon */}
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          background: color + '22',
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {icon}
        </div>

        {/* Label + property chips */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: isSelected ? color : '#1e293b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {node.label}
          </span>
          {propertyChips.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {propertyChips.map(chip => (
                <span key={chip} style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                  // WCAG: #374151 on light tinted bg ≈ 9:1 ✓
                  background: color + '20',
                  color: '#374151',
                  border: `1px solid ${color}40`,
                  letterSpacing: '0.03em', whiteSpace: 'nowrap',
                }}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI badge — WCAG: #065f46 on #d1fae5 = 7.5:1 ✓ */}
        {hasBadge && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 3,
            background: '#d1fae5',
            color: '#065f46',
            border: '1px solid #6ee7b7',
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            AI
          </span>
        )}

        {/* showWhen badge — WCAG: #713f12 on #fef3c7 = 8.1:1 ✓ */}
        {node.showWhen && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            background: '#fef3c7', color: '#713f12',
            border: '1px solid #fcd34d',
            flexShrink: 0,
          }}>
            IF
          </span>
        )}

        {/* Delete button */}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(node.id); }}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#dc2626',
              cursor: 'pointer',
              padding: '2px 5px',
              fontSize: 10,
              borderRadius: 3,
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Remove"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Resize handle — drag right edge to change column width ── */}
      <div
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize column width"
        style={{
          position: 'absolute',
          top: 0, right: -3,
          width: 8, height: '100%',
          cursor: 'col-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered || isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <div style={{
          width: 3, height: 24, borderRadius: 2,
          background: isSelected ? color : '#475569',
        }} />
      </div>

      {/* Children — column-layout: flat ordered list matching the flowing
          column-count preview. Content fills col 1 to bottom then overflows
          into col 2, so there is no meaningful per-column slot at authoring
          time — only ordering matters. */}
      {isContainer && expanded && node.type === 'column-layout' && (() => {
        const colNode = node as import('../../types/template').ColumnLayoutNode;
        const numCols = colNode.numColumns;
        const colColor = '#0e9f6e';
        return (
          <div style={{ marginLeft: 8, marginTop: 4 }}>

            {/* ── Column-count indicator ─────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 8px', marginBottom: 5,
              background: 'rgba(14,159,110,0.07)',
              border: '1px solid rgba(14,159,110,0.18)',
              borderRadius: 4,
            }}>
              {/* Mini column-stripe diagram */}
              {Array.from({ length: numCols }).map((_, i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2,
                    background: 'rgba(14,159,110,0.35)' }} />
                  {i < numCols - 1 && (
                    <div style={{ width: 1, height: 14,
                      background: 'rgba(14,159,110,0.25)' }} />
                  )}
                </React.Fragment>
              ))}
              <span style={{ fontSize: 9, fontWeight: 700, color: colColor,
                marginLeft: 6, flexShrink: 0, letterSpacing: '0.04em' }}>
                {numCols} col · flows ↓→
              </span>
            </div>

            {/* ── Flat ordered child list ────────────────────────── */}
            <div style={{
              padding: '4px 6px',
              background: 'rgba(14,159,110,0.03)',
              border: `1px dashed rgba(14,159,110,0.2)`,
              borderRadius: 4,
            }}>
              <DropZone parentId={node.id} insertIndex={0}
                onDrop={onDrop} isActive={isDragging} />
              {colNode.children.map((child, i) => (
                <React.Fragment key={child.id}>
                  <NodeCard
                    node={child} depth={depth + 1} selectedId={selectedId}
                    isDragging={isDragging} onSelect={onSelect}
                    onDrop={onDrop} onDelete={onDelete}
                  />
                  <DropZone parentId={node.id} insertIndex={i + 1}
                    onDrop={onDrop} isActive={isDragging} />
                </React.Fragment>
              ))}
              {colNode.children.length === 0 && (
                <div style={{ fontSize: 10, color: colColor, textAlign: 'center',
                  padding: '10px 0', fontStyle: 'italic', opacity: 0.65 }}>
                  Drop content here — flows across {numCols} columns in preview
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Children — 12-column grid for all other containers */}
      {isContainer && expanded && node.type !== 'column-layout' && (
        <div style={{
          marginLeft: 16,
          paddingLeft: 8,
          borderLeft: `2px solid ${color}40`,
        }}>
          {/* Full-width drop zone at top */}
          <div style={{ gridColumn: 'span 12' }}>
            <DropZone parentId={node.id} insertIndex={0} onDrop={onDrop} isActive={isDragging} />
          </div>

          {/* 12-col grid wraps child cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '2px 4px',
            position: 'relative',
          }}>

            {children.map((child, i) => (
              <React.Fragment key={child.id}>
                <NodeCard
                  node={child}
                  depth={depth + 1}
                  selectedId={selectedId}
                  isDragging={isDragging}
                  onSelect={onSelect}
                  onDrop={onDrop}
                  onDelete={onDelete}
                />
                {/* Drop zone after each child — spans full width to keep insertion clear */}
                <div style={{ gridColumn: 'span 12' }}>
                  <DropZone parentId={node.id} insertIndex={i + 1} onDrop={onDrop} isActive={isDragging} />
                </div>
              </React.Fragment>
            ))}
          </div>

          {children.length === 0 && (
            <div style={{
              padding: '10px 12px', fontSize: 11, color: '#94a3b8',
              fontStyle: 'italic', textAlign: 'center',
              border: '1.5px dashed #e2e8f0', borderRadius: 5,
              background: '#f8fafc', margin: '4px 0',
            }}>
              Drop components here
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main canvas ────────────────────────────────────────────────

export const TemplateCanvas: React.FC<Props> = ({
  nodes,
  selectedId,
  onSelect,
  onChange,
  showGrid = false,
  partType,
}) => {
  // isDragging is set on dragenter/dragleave on the canvas root so drop zones show
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0); // prevents flicker on child dragenter/dragleave

  const handleDrop = useCallback(
    (parentId: string | null, insertIndex: number, e: React.DragEvent) => {
      dragCounter.current = 0;
      setIsDragging(false);
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;

      if (data.startsWith('palette::')) {
        // New node from palette
        const type = data.replace('palette::', '') as TemplateNodeType;
        const newNode = createDefaultNode(type);
        const updated = insertNode(nodes, newNode, parentId, insertIndex);
        onChange(updated);
        onSelect(newNode.id);
      } else if (data.startsWith('node::')) {
        // Existing node being moved
        const nodeId = data.replace('node::', '');
        // Prevent dropping a container into itself
        if (parentId === nodeId) return;
        const [withoutNode, removed] = removeNode(nodes, nodeId);
        if (!removed) return;
        const updated = insertNode(withoutNode, removed, parentId, insertIndex);
        onChange(updated);
      }
    },
    [nodes, onChange, onSelect]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const [updated] = removeNode(nodes, id);
      onChange(updated);
      if (selectedId === id) onSelect('');
    },
    [nodes, onChange, selectedId, onSelect]
  );

  // ── Resize handler — called by NodeCard drag-resize handle ─────
  const handleColSpanUpdate = useCallback(
    (id: string, colSpan: number) => {
      const updated = updateNode(nodes, id, n => ({ ...n, colSpan }));
      onChange(updated);
    },
    [nodes, onChange]
  );

  return (
    <GridContext.Provider value={showGrid}>
    <UpdateContext.Provider value={handleColSpanUpdate}>
    <div
      style={styles.canvasSurround}
      onDragEnter={() => { dragCounter.current++; setIsDragging(true); }}
      onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDragOver={e => e.preventDefault()}
      onDrop={() => { dragCounter.current = 0; setIsDragging(false); }}
    >
      {/* ── Document page ── */}
      <div style={styles.page}>

        {/* Page 1 Header — only shown for header parts or generic templates */}
        {partType !== 'body' && partType !== 'footer' && (
          <PageZone label="Page 1 — Header" hint="Drop a Header component here (first page only)"
            nodes={nodes.filter(n => n.type === 'header' && (n as import('../../types/template').HeaderNode).scope !== 'pages2plus')}
            zoneNodes={nodes} selectedId={selectedId} isDragging={isDragging}
            onSelect={onSelect} onDrop={handleDrop} onDelete={handleDelete}
            zoneStyle={styles.headerZone} insertOffset={0}
          />
        )}

        {/* Pages 2+ Header — only shown for header parts or generic */}
        {partType !== 'body' && partType !== 'footer' && (
          <PageZone label="Pages 2+ — Header" hint="Drop a Header component here (page 2 onwards)"
            nodes={nodes.filter(n => n.type === 'header' && (n as import('../../types/template').HeaderNode).scope === 'pages2plus')}
            zoneNodes={nodes} selectedId={selectedId} isDragging={isDragging}
            onSelect={onSelect} onDrop={handleDrop} onDelete={handleDelete}
            zoneStyle={{ ...styles.headerZone, background: '#eef2ff', borderTop: '1px solid #c7d2fe', borderBottom: '1px solid #c7d2fe' }}
            insertOffset={1}
          />
        )}

        {/* Body — whole area always droppable */}
        <div
          style={{
            ...styles.body,
            backgroundImage: showGrid
              ? 'radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)'
              : 'none',
            backgroundSize: showGrid ? '24px 24px' : 'auto',
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            const bodyNodes = nodes.filter(n => n.type !== 'header' && n.type !== 'footer');
            handleDrop(null, bodyNodes.length, e);
          }}
        >
          {/* Empty state — full area drop target */}
          {nodes.filter(n => n.type !== 'header' && n.type !== 'footer').length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 20px', gap: 8,
              border: `2px dashed ${isDragging ? '#0891b2' : '#cbd5e1'}`,
              borderRadius: 8, margin: 8,
              background: isDragging ? 'rgba(8,145,178,0.04)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 32, color: isDragging ? '#0891b2' : '#94a3b8', opacity: 0.5 }}>⊞</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDragging ? '#0891b2' : '#475569' }}>
                {isDragging ? '↓ Release to drop here' : 'Drag components here'}
              </div>
              {!isDragging && <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', maxWidth: 260 }}>
                Drag any item from the left panel. Drop it anywhere in this area.
              </div>}
            </div>
          )}

          {/* Body rows — grouped by colSpan */}
          {(() => {
            const bodyNodes = nodes.filter(n => n.type !== 'header' && n.type !== 'footer');
            const rows: TemplateNode[][] = [];
            let cur: TemplateNode[] = [], used = 0;
            for (const n of bodyNodes) {
              const span = n.colSpan ?? 12;
              if (used + span > 12 && cur.length > 0) { rows.push(cur); cur = []; used = 0; }
              cur.push(n); used += span;
              if (used >= 12) { rows.push(cur); cur = []; used = 0; }
            }
            if (cur.length > 0) rows.push(cur);
            return rows.map((row, ri) => {
              const rowUsed = row.reduce((s, n) => s + (n.colSpan ?? 12), 0);
              const free = 12 - rowUsed;
              const firstIdx = bodyNodes.findIndex(n => n.id === row[0].id);
              const lastIdx  = bodyNodes.findIndex(n => n.id === row[row.length - 1].id);
              return (
                <React.Fragment key={`row-${ri}`}>
                  <DropZone parentId={null} insertIndex={firstIdx} onDrop={handleDrop} isActive={isDragging} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0 6px', marginBottom: 3 }}>
                    {row.map(node => (
                      <NodeCard key={node.id} node={node} depth={0}
                        selectedId={selectedId} isDragging={isDragging}
                        onSelect={onSelect} onDrop={handleDrop} onDelete={handleDelete}
                      />
                    ))}
                    {free > 0 && free < 12 && (
                      <div style={{
                        gridColumn: `span ${free}`, minHeight: 40,
                        border: `1.5px dashed ${isDragging ? '#0891b2' : '#e2e8f0'}`,
                        borderRadius: 6, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10,
                        color: isDragging ? '#0891b2' : '#94a3b8',
                        background: isDragging ? 'rgba(8,145,178,0.05)' : 'transparent',
                        cursor: isDragging ? 'copy' : 'default', transition: 'all 0.15s',
                      }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.stopPropagation(); handleDrop(null, lastIdx + 1, e); }}
                      >
                        {isDragging ? '↓ Drop here' : `${free}/12 free`}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            });
          })()}
          {/* Bottom drop zone — always present once there are body nodes */}
          {nodes.filter(n => n.type !== 'header' && n.type !== 'footer').length > 0 && (
            <DropZone parentId={null}
              insertIndex={nodes.filter(n => n.type !== 'header' && n.type !== 'footer').length}
              onDrop={handleDrop} isActive={isDragging}
            />
          )}
        </div>

        {/* Pages 2+ Footer — only shown for footer parts or generic */}
        {partType !== 'body' && partType !== 'header' && (
          <PageZone label="Pages 2+ — Footer" hint="Drop a Footer here (page 2 onwards)"
            nodes={nodes.filter(n => n.type === 'footer' && (n as import('../../types/template').FooterNode).scope === 'pages2plus')}
            zoneNodes={nodes} selectedId={selectedId} isDragging={isDragging}
            onSelect={onSelect} onDrop={handleDrop} onDelete={handleDelete}
            zoneStyle={{ ...styles.footerZone, background: '#eef2ff', borderTop: '1px solid #c7d2fe', borderBottom: '1px solid #c7d2fe' }}
            insertOffset={nodes.length - 2}
          />
        )}

        {/* Page 1 Footer — only shown for footer parts or generic */}
        {partType !== 'body' && partType !== 'header' && (
          <PageZone label="Page 1 — Footer" hint="Drop a Footer here (first page only)"
            nodes={nodes.filter(n => n.type === 'footer' && (n as import('../../types/template').FooterNode).scope !== 'pages2plus')}
            zoneNodes={nodes} selectedId={selectedId} isDragging={isDragging}
            onSelect={onSelect} onDrop={handleDrop} onDelete={handleDelete}
            zoneStyle={styles.footerZone} insertOffset={nodes.length - 1}
          />
        )}
      </div>
    </div>
    </UpdateContext.Provider>
    </GridContext.Provider>
  );
};

// ── Zone chip ──────────────────────────────────────────────────
// Small badge shown in the header/footer zone label bar to surface
// active toggle properties that are otherwise invisible on the canvas.

const ZoneChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
    background: 'rgba(8,145,178,0.12)', color: '#0891b2',
    letterSpacing: '0.03em', whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

// ── Page zone (header / footer placeholder) ────────────────────

interface PageZoneProps {
  label: string;
  hint: string;
  nodes: TemplateNode[];
  zoneNodes: TemplateNode[];
  selectedId: string | null;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDrop: (parentId: string | null, insertIndex: number, e: React.DragEvent) => void;
  onDelete: (id: string) => void;
  zoneStyle: React.CSSProperties;
  insertOffset: number;
}

const PageZone: React.FC<PageZoneProps> = ({
  label, hint, nodes, zoneNodes: _zoneNodes, selectedId, isDragging,
  onSelect, onDrop, onDelete, zoneStyle, insertOffset,
}) => {
  const [zoneOver, setZoneOver] = useState(false);
  const isEmpty = nodes.length === 0;

  return (
    <div
      style={{
        ...zoneStyle,
        background: zoneOver && isDragging ? 'rgba(8,145,178,0.06)' : zoneStyle.background,
        borderColor: zoneOver && isDragging ? '#0891b2' : (zoneStyle.borderColor as string),
      }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setZoneOver(true); }}
      onDragLeave={() => setZoneOver(false)}
      onDrop={e => {
        e.stopPropagation();
        setZoneOver(false);
        onDrop(null, insertOffset, e);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={styles.zoneLabel}>{label}</div>
        {/* Surface active toggle properties from the first header/footer node */}
        {nodes[0] && nodes[0].type === 'header' && (
          <div style={{ display: 'flex', gap: 3 }}>
            {(nodes[0] as import('../../types/template').HeaderNode).showLogo        && <ZoneChip>Logo</ZoneChip>}
            {(nodes[0] as import('../../types/template').HeaderNode).showAccession   && <ZoneChip>Accession #</ZoneChip>}
            {(nodes[0] as import('../../types/template').HeaderNode).showPatientName && <ZoneChip>Patient name</ZoneChip>}
          </div>
        )}
        {nodes[0] && nodes[0].type === 'footer' && (
          <div style={{ display: 'flex', gap: 3 }}>
            {(nodes[0] as import('../../types/template').FooterNode).showPageNumbers && <ZoneChip>Page numbers</ZoneChip>}
          </div>
        )}
      </div>
      {isEmpty ? (
        <div style={styles.zoneHint}>{hint}</div>
      ) : (
        nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <NodeCard
              node={node}
              depth={0}
              selectedId={selectedId}
              isDragging={isDragging}
              onSelect={onSelect}
              onDrop={onDrop}
              onDelete={onDelete}
            />
            <DropZone
              parentId={null}
              insertIndex={insertOffset + i + 1}
              onDrop={onDrop}
              isActive={isDragging}
            />
          </React.Fragment>
        ))
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  canvasSurround: {
    flex: 1,
    overflowY: 'auto',
    background: '#1e2535',
    padding: '32px 40px',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: 820,
    minHeight: 1000,
    background: '#ffffff',
    borderRadius: 3,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    // No overflow:hidden — it clips backgroundImage on child divs
  },
  headerZone: {
    minHeight: 72,
    padding: '10px 24px',
    borderBottom: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    position: 'relative',
    borderColor: '#cbd5e1',
    transition: 'background 0.15s, border-color 0.15s',
  },
  body: {
    flex: 1,
    padding: '20px 24px',
    minHeight: 600,
  },
  footerZone: {
    minHeight: 56,
    padding: '10px 24px',
    borderTop: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    position: 'relative',
    borderColor: '#cbd5e1',
    transition: 'background 0.15s, border-color 0.15s',
  },
  zoneLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    // WCAG: #475569 on #f8fafc = 5.9:1 ✓
    color: '#475569',
    marginBottom: 6,
  },
  zoneHint: {
    fontSize: 11,
    // WCAG: #64748b on #f8fafc = 4.6:1 ✓
    color: '#64748b',
    fontStyle: 'italic',
  },
  emptyBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.25,
    color: '#475569',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: 600,
    // WCAG: #475569 on white = 5.9:1 ✓
    color: '#475569',
  },
  emptySub: {
    fontSize: 11,
    // WCAG: #64748b on white = 4.6:1 ✓
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
  },
};
