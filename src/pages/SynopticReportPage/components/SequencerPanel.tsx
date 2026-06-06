// src/pages/SynopticReportPage/components/SequencerPanel.tsx
// ─────────────────────────────────────────────────────────────
// Report Sequencer — rendered as a full-width modal.
// Trigger: parent sets show=true when Sequencer tab is clicked.
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Case } from '@/types/case/Case';
import { getTemplate } from '@/services/templates/templateService';

// ── Types ──────────────────────────────────────────────────────

interface SequencerPanelProps {
  show: boolean;
  onClose: () => void;
  caseData: Case | null;
  activeReportInstanceId: string;
  onSelectReport: (instanceId: string, specimenId: string) => void;
}

interface SpecimenRow {
  specimenId:  string;
  label:       string;
  description: string;
  synoptics:   SynopticRow[];
}

interface SynopticRow {
  instanceId:   string;
  templateId:   string;
  templateName: string;
  filledCount:  number;
  totalCount:   number;
  status:       string;
  answers:      Record<string, string | string[]>;
}

// ── Storage helpers ────────────────────────────────────────────

function loadOrder(caseId: string): string[] | null {
  try { const r = localStorage.getItem(`ps_specimen_order_${caseId}`); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveOrder(caseId: string, order: string[]) {
  try { localStorage.setItem(`ps_specimen_order_${caseId}`, JSON.stringify(order)); } catch {}
}
function loadSynopticOrder(caseId: string): Record<string, string[]> {
  try { const r = localStorage.getItem(`ps_synoptic_order_${caseId}`); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveSynopticOrder(caseId: string, order: Record<string, string[]>) {
  try { localStorage.setItem(`ps_synoptic_order_${caseId}`, JSON.stringify(order)); } catch {}
}

// ── Main component ─────────────────────────────────────────────

const SequencerPanel: React.FC<SequencerPanelProps> = ({
  show, onClose, caseData, activeReportInstanceId, onSelectReport,
}) => {
  const [specimenOrder, setSpecimenOrder] = useState<string[]>([]);
  const [synopticOrder, setSynopticOrder] = useState<Record<string, string[]>>({});
  const [expandedIds,   setExpandedIds]   = useState<Set<string>>(new Set());
  const [expandedSynoptics, setExpandedSynoptics] = useState<Set<string>>(new Set());
  // fieldId → label maps keyed by templateId
  const [templateFieldMaps, setTemplateFieldMaps] = useState<Record<string, Record<string, string>>>({});

  const dragSpecimenId  = useRef<string | null>(null);
  const dragOverSpecId  = useRef<string | null>(null);
  const dragSynopticRef = useRef<{ instanceId: string; specimenId: string } | null>(null);
  const dragOverSynRef  = useRef<string | null>(null);

  useEffect(() => {
    if (!caseData) return;
    const naturalSpecIds = (caseData.specimens ?? []).map(s => s.id);
    const stored = loadOrder(caseData.id);
    const order = stored && stored.length === naturalSpecIds.length && naturalSpecIds.every(id => stored.includes(id))
      ? stored : naturalSpecIds;
    setSpecimenOrder(order);

    const storedSyn = loadSynopticOrder(caseData.id);
    const synOrder: Record<string, string[]> = {};
    for (const spec of caseData.specimens ?? []) {
      const instances = (caseData.synopticReports ?? []).filter(r => r.specimenId === spec.id);
      const naturalIds = instances.map(r => r.instanceId);
      const storedIds  = storedSyn[spec.id];
      synOrder[spec.id] = storedIds && storedIds.length === naturalIds.length && naturalIds.every(id => storedIds.includes(id))
        ? storedIds : naturalIds;
    }
    setSynopticOrder(synOrder);
    setExpandedIds(new Set(naturalSpecIds));
  }, [caseData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose]);

  // Fetch template field maps when modal opens
  useEffect(() => {
    if (!show || !caseData) return;
    const templateIds = [...new Set((caseData.synopticReports ?? []).map(r => r.templateId).filter(Boolean))];
    Promise.all(
      templateIds.map(async id => {
        try {
          const detail = await getTemplate(id);
          const fieldMap: Record<string, string> = {};
          for (const section of detail?.template?.sections ?? []) {
            for (const field of section.fields ?? []) {
              if (field.id) fieldMap[field.id] = field.label ?? field.id;
            }
          }
          return [id, fieldMap] as [string, Record<string, string>];
        } catch { return null; }
      })
    ).then(results => {
      const maps: Record<string, Record<string, string>> = {};
      for (const r of results) { if (r) maps[r[0]] = r[1]; }
      setTemplateFieldMaps(maps);
    });
  }, [show, caseData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows: SpecimenRow[] = specimenOrder.map(specId => {
    const spec = (caseData?.specimens ?? []).find(s => s.id === specId);
    if (!spec) return null;
    const synIds = synopticOrder[specId] ?? [];
    const synoptics: SynopticRow[] = synIds.map(iid => {
      const inst = (caseData?.synopticReports ?? []).find(r => r.instanceId === iid);
      if (!inst) return null;
      const allValues   = Object.values(inst.answers ?? {});
      const filledCount = allValues.filter(v => v !== '' && !(Array.isArray(v) && !v.length)).length;
      return {
        instanceId:   inst.instanceId,
        templateId:   inst.templateId ?? '',
        templateName: inst.templateName,
        filledCount,
        totalCount:   allValues.length,
        status:       inst.status,
        answers:      inst.answers ?? {},
      };
    }).filter(Boolean) as SynopticRow[];
    return { specimenId: specId, label: spec.label, description: spec.description, synoptics };
  }).filter(Boolean) as SpecimenRow[];

  // ── Drag: specimens ───────────────────────────────────────────
  const onSpecDragStart = (e: React.DragEvent, specId: string) => {
    dragSpecimenId.current = specId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onSpecDragOver = (e: React.DragEvent, specId: string) => {
    e.preventDefault();
    dragOverSpecId.current = specId;
  };
  const onSpecDrop = useCallback((e: React.DragEvent, targetSpecId: string) => {
    e.preventDefault();
    const srcId = dragSpecimenId.current;
    if (!srcId || srcId === targetSpecId || !caseData) return;
    setSpecimenOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(srcId);
      const toIdx   = next.indexOf(targetSpecId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, srcId);
      saveOrder(caseData.id, next);
      return next;
    });
    dragSpecimenId.current = null;
  }, [caseData]);

  // ── Drag: synoptics ───────────────────────────────────────────
  const onSynDragStart = (e: React.DragEvent, instanceId: string, specimenId: string) => {
    e.stopPropagation();
    dragSynopticRef.current = { instanceId, specimenId };
    e.dataTransfer.effectAllowed = 'move';
  };
  const onSynDragOver = (e: React.DragEvent, instanceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverSynRef.current = instanceId;
  };
  const onSynDrop = useCallback((e: React.DragEvent, targetInstanceId: string, specimenId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const src = dragSynopticRef.current;
    if (!src || src.instanceId === targetInstanceId || src.specimenId !== specimenId || !caseData) return;
    setSynopticOrder(prev => {
      const order = [...(prev[specimenId] ?? [])];
      const fromIdx = order.indexOf(src.instanceId);
      const toIdx   = order.indexOf(targetInstanceId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, src.instanceId);
      const next = { ...prev, [specimenId]: order };
      saveSynopticOrder(caseData.id, next);
      return next;
    });
    dragSynopticRef.current = null;
  }, [caseData]);

  const resetOrder = useCallback(() => {
    if (!caseData) return;
    const natural = (caseData.specimens ?? []).map(s => s.id);
    setSpecimenOrder(natural);
    const synOrder: Record<string, string[]> = {};
    for (const spec of caseData.specimens ?? []) {
      synOrder[spec.id] = (caseData.synopticReports ?? []).filter(r => r.specimenId === spec.id).map(r => r.instanceId);
    }
    setSynopticOrder(synOrder);
    try { localStorage.removeItem(`ps_specimen_order_${caseData.id}`); } catch {}
    try { localStorage.removeItem(`ps_synoptic_order_${caseData.id}`); } catch {}
  }, [caseData]);

  if (!show) return null;

  const hasCustomOrder = (() => {
    const natural = (caseData?.specimens ?? []).map(s => s.id);
    return JSON.stringify(specimenOrder) !== JSON.stringify(natural);
  })();

  return (
    <div
      className="fm-overlay"
      style={{ zIndex: 20000 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw', maxWidth: 1100, height: '86vh',
          background: '#0d1829',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="ps-research-header" style={{ flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="fm-eyebrow">Report Assembly</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <h2 className="fm-title" style={{ margin: 0 }}>Report Sequencer</h2>
              <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.08)' }}>
                {rows.length} specimen{rows.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Drag specimens to set their order in the final report. Synoptics follow their specimen.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {hasCustomOrder && (
              <button
                onClick={resetOrder}
                style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
              >
                ↺ Reset order
              </button>
            )}
            <button className="ps-research-close" onClick={onClose} aria-label="Close sequencer">✕</button>
          </div>
        </div>

        {/* ── Body — two columns ─────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT — draggable specimen cards */}
          <div style={{ flex: '0 0 48%', overflowY: 'auto', padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

            {(!caseData || rows.length === 0) && (
              <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>No specimens on this case.</div>
            )}

            {rows.map((row, i) => {
              const isExpanded = expandedIds.has(row.specimenId);
              return (
                <div
                  key={row.specimenId}
                  draggable
                  onDragStart={e => onSpecDragStart(e, row.specimenId)}
                  onDragOver={e => onSpecDragOver(e, row.specimenId)}
                  onDrop={e => onSpecDrop(e, row.specimenId)}
                  onDragEnd={() => { dragSpecimenId.current = null; }}
                  style={{ marginBottom: 10 }}
                >
                  <div style={{
                    background: 'rgba(8,145,178,0.07)',
                    border: '1px solid rgba(8,145,178,0.2)',
                    borderRadius: 8, overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}>
                    {/* Specimen header row */}
                    <div
                      onClick={() => setExpandedIds(prev => {
                        const next = new Set(prev);
                        next.has(row.specimenId) ? next.delete(row.specimenId) : next.add(row.specimenId);
                        return next;
                      })}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      {/* Drag handle */}
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="#475569" aria-hidden="true" style={{ cursor: 'grab', flexShrink: 0 }}>
                        <circle cx="3" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/>
                        <circle cx="9" cy="2.5" r="1.2"/><circle cx="9" cy="7" r="1.2"/><circle cx="9" cy="11.5" r="1.2"/>
                      </svg>

                      {/* Position badge */}
                      <span style={{ fontSize: 11, fontWeight: 800, width: 22, height: 22, borderRadius: '50%', background: 'rgba(8,145,178,0.25)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>

                      <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>{row.label}:</span>
                      <span style={{ fontSize: 13, color: '#cbd5e1', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description}
                      </span>

                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                        {row.synoptics.length} synoptic{row.synoptics.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 9, color: '#94a3b8', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>▶</span>
                    </div>

                    {/* Synoptic rows */}
                    {isExpanded && row.synoptics.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(8,145,178,0.12)', background: 'rgba(0,0,0,0.15)' }}>
                        {row.synoptics.map((syn, si) => {
                          const isActive = syn.instanceId === activeReportInstanceId;
                          return (
                            <div
                              key={syn.instanceId}
                              draggable={row.synoptics.length > 1}
                              onDragStart={e => onSynDragStart(e, syn.instanceId, row.specimenId)}
                              onDragOver={e => onSynDragOver(e, syn.instanceId)}
                              onDrop={e => onSynDrop(e, syn.instanceId, row.specimenId)}
                              onClick={() => { onSelectReport(syn.instanceId, row.specimenId); onClose(); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 14px 9px 48px',
                                borderBottom: si < row.synoptics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                cursor: 'pointer',
                                background: isActive ? 'rgba(8,145,178,0.12)' : 'transparent',
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {row.synoptics.length > 1 && (
                                <svg width="10" height="12" viewBox="0 0 12 14" fill="#475569" aria-hidden="true" style={{ cursor: 'grab', flexShrink: 0 }}>
                                  <circle cx="3" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/>
                                  <circle cx="9" cy="2.5" r="1.2"/><circle cx="9" cy="7" r="1.2"/><circle cx="9" cy="11.5" r="1.2"/>
                                </svg>
                              )}
                              <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{si + 1}.</span>
                              <span style={{ fontSize: 12, color: isActive ? '#7dd3fc' : '#cbd5e1', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {syn.templateName}
                              </span>
                              <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                                {syn.filledCount} field{syn.filledCount !== 1 ? 's' : ''} answered
                              </span>
                              {isActive && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2', background: 'rgba(8,145,178,0.15)', padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>active</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && row.synoptics.length === 0 && (
                      <div style={{ padding: '9px 14px 9px 48px', fontSize: 12, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.04)', fontStyle: 'italic' }}>
                        No synoptic reports attached
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT — document-outline preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', background: 'rgba(0,0,0,0.15)' }}>

            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              Report Assembly Preview
            </div>

            {/* Report Header — only for Outreach/Orchestrator cases; LIS owns its own header */}
            {caseData?.id?.startsWith('O26-') && (
              <DocSection icon="▲" label="Report Header" sublabel="Institutional header, patient demographics, accession" muted />
            )}

            {/* Specimens in order */}
            {rows.map((row, i) => (
              <div key={row.specimenId} style={{ marginBottom: 16 }}>

                {/* Specimen section header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 7,
                  background: 'rgba(8,145,178,0.08)',
                  border: '1px solid rgba(8,145,178,0.2)',
                  marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>{row.label}:</span>
                  <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.description}
                  </span>
                </div>

                {/* Synoptic subsections */}
                {row.synoptics.length === 0 && (
                  <div style={{ padding: '6px 14px 6px 32px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                    No synoptic reports — gross description only
                  </div>
                )}
                {row.synoptics.map((syn, si) => {
                  const isActive    = syn.instanceId === activeReportInstanceId;
                  const pct         = syn.totalCount > 0 ? Math.round((syn.filledCount / syn.totalCount) * 100) : 0;
                  const statusColor = syn.status === 'Finalized' ? '#10b981' : syn.status === 'In Progress' ? '#f59e0b' : '#64748b';
                  const fieldMap    = templateFieldMaps[syn.templateId] ?? {};
                  const answeredFields = Object.entries(syn.answers)
                    .filter(([, v]) => v !== '' && !(Array.isArray(v) && !v.length))
                    .map(([id, v]) => ({ label: fieldMap[id] ?? id, value: Array.isArray(v) ? v.join(', ') : v }));
                  const PREVIEW_MAX = expandedSynoptics.has(syn.instanceId) ? 999 : 10;
                  const visibleFields = answeredFields.slice(0, PREVIEW_MAX);
                  const overflow = answeredFields.length - PREVIEW_MAX;

                  return (
                    <div
                      key={syn.instanceId}
                      style={{
                        marginBottom: 6, borderRadius: 7,
                        background: isActive ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'rgba(8,145,178,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        overflow: 'hidden',
                        transition: 'background 0.12s',
                      }}
                    >
                      {/* Synoptic header — click to jump */}
                      <div
                        onClick={() => { onSelectReport(syn.instanceId, row.specimenId); onClose(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 14px 9px 32px', cursor: 'pointer',
                          borderBottom: answeredFields.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{si + 1}.</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#7dd3fc' : '#cbd5e1', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {syn.templateName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, flexShrink: 0 }}>{syn.status}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{syn.filledCount}/{syn.totalCount}</span>
                        {/* Mini progress bar */}
                        <div style={{ width: 40, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#0891B2', borderRadius: 99 }} />
                        </div>
                        {isActive && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#0891b2', background: 'rgba(8,145,178,0.2)', padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>active</span>
                        )}
                      </div>

                      {/* Field rows */}
                      {visibleFields.length > 0 && (
                        <div style={{ padding: '8px 14px 10px 46px' }}>
                          {visibleFields.map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 5, alignItems: 'baseline' }}>
                              <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, minWidth: 155, maxWidth: 155, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                              <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {value}
                              </span>
                            </div>
                          ))}
                          {overflow > 0 && (
                            <div
                              onClick={() => setExpandedSynoptics(prev => { const next = new Set(prev); next.add(syn.instanceId); return next; })}
                              style={{ fontSize: 11, color: '#38bdf8', marginTop: 6, fontStyle: 'italic', cursor: 'pointer', userSelect: 'none' }}
                            >
                              + {overflow} more field{overflow !== 1 ? 's' : ''} — click to expand
                            </div>
                          )}
                          {expandedSynoptics.has(syn.instanceId) && overflow === 0 && answeredFields.length > 10 && (
                            <div
                              onClick={() => setExpandedSynoptics(prev => { const next = new Set(prev); next.delete(syn.instanceId); return next; })}
                              style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic', cursor: 'pointer', userSelect: 'none' }}
                            >
                              ▲ collapse
                            </div>
                          )}
                        </div>
                      )}

                      {answeredFields.length === 0 && (
                        <div style={{ padding: '6px 14px 8px 46px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                          No fields answered yet
                        </div>
                      )}

                      {/* Synoptics Finalized — per synoptic, not at document level */}
                      {syn.status === 'finalized' && (
                        <div style={{ margin: '6px 14px 4px 46px', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
                          <span style={{ fontSize: 12 }}>✍</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Synoptic Finalized</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Pathologist attestation recorded</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Synoptics Finalized appears within each individual synoptic card above */}

            {/* Hint */}
            <div style={{ marginTop: 24, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                The order shown here determines how specimens appear in the generated report.
                Synoptic values remain unchanged — only their presentation sequence is affected.
                Click any synoptic row to jump to it in the editor.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Doc section (header / footer placeholders) ─────────────────

const DocSection: React.FC<{ icon: string; label: string; sublabel: string; muted?: boolean }> = ({ icon, label, sublabel }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', marginBottom: 12, borderRadius: 6,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <span style={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{label}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sublabel}</div>
    </div>
  </div>
);

export default SequencerPanel;
