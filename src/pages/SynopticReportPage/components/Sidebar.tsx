// src/pages/SynopticReportPage/components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import ConfirmModal from '@/components/UI/ConfirmModal';
import type { Case } from '@/types/case/Case';

interface SidebarProps {
  caseData: Case | null;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  activeSpecimenId?: string;
  onSelectSpecimen?: (specimenId: string) => void;
  onAddSynoptic?: () => void;
  onOpenCaseComment?: () => void;
  onOpenSpecimenComment?: (specimenId: string) => void;
  hasCaseComment?: boolean;
  specimenComments?: Record<string, string>;
  activeReportInstanceId?: string;
  onSelectReport?: (instanceId: string, specimenId: string) => void;
  onDeleteReport?: (instanceId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type DotStatus = 'complete' | 'partial' | 'empty';

const StatusDot: React.FC<{ status: DotStatus }> = ({ status }) => {
  const color = status === 'complete' ? '#10b981' : status === 'partial' ? '#f59e0b' : '#334155';
  return (
    <span className="ps-status-dot-wrap">
      <span className="ps-status-dot" style={{ background: color }} />
    </span>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  caseData,
  activeSpecimenId,
  onSelectSpecimen,
  onAddSynoptic,
  onOpenCaseComment,
  onOpenSpecimenComment,
  hasCaseComment = false,
  specimenComments = {},
  activeReportInstanceId,
  onSelectReport,
  onDeleteReport,
  collapsed = false,
  onToggleCollapse,
}) => {
  const specimens = caseData?.specimens ?? [];
  const [confirmDeleteId,   setConfirmDeleteId]   = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>('');
  const [expandedIds,       setExpandedIds]       = useState<Set<string>>(new Set());

  useEffect(() => {
    if (specimens.length > 0) setExpandedIds(new Set(specimens.map(s => s.id)));
  }, [caseData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className={`ps-syn-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>

      {/* ── COLLAPSED: icon rail ─────────────────────────────── */}
      {collapsed && (
        <div className="ps-syn-rail">
          <button className="ps-syn-rail-toggle" onClick={onToggleCollapse} title="Expand sidebar">
            ›
          </button>

          {specimens.map(sp => {
            const instances  = (caseData?.synopticReports ?? []).filter(r => r.specimenId === sp.id);
            const hasAnswers = instances.some(r =>
              Object.values(r.answers ?? {}).some(v => v !== '' && !(Array.isArray(v) && !v.length))
            );
            const dotColor = instances.length === 0 ? '#334155' : hasAnswers ? '#f59e0b' : '#334155';
            const isActive = activeSpecimenId === sp.id;
            return (
              <button
                key={sp.id}
                className={`ps-syn-rail-btn${isActive ? ' active' : ''}`}
                onClick={() => {
                  onSelectSpecimen?.(sp.id);
                  const first = instances[0];
                  if (first) onSelectReport?.(first.instanceId, sp.id);
                }}
                title={`${sp.label}: ${sp.description}`}
              >
                <span className="ps-syn-rail-letter">{sp.label}</span>
                <span className="ps-status-dot" style={{ background: dotColor, width: 6, height: 6 }} />
              </button>
            );
          })}
        </div>
      )}

      {/* ── EXPANDED: full content ────────────────────────────── */}
      {!collapsed && (
        <div className="ps-syn-sidebar-content">

          <button className="ps-syn-sidebar-toggle" onClick={onToggleCollapse} title="Collapse sidebar">
            ‹
          </button>

          {/* Case comment */}
          <div
            className={`ps-syn-comment-btn${hasCaseComment ? ' has-comment' : ''}`}
            onClick={() => onOpenCaseComment?.()}
            role="button" tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenCaseComment?.()}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>💬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ps-syn-comment-label">
                {hasCaseComment ? 'Edit Case Comment' : '+ Add Case Comment'}
              </div>
              {hasCaseComment && <div className="ps-syn-comment-sublabel">Applies to entire case</div>}
            </div>
            {hasCaseComment && <span className="ps-syn-comment-check">✓</span>}
          </div>

          {/* Section label */}
          <div className="ps-syn-section-label">Specimens &amp; Reports</div>

          {/* Specimen rows */}
          {specimens.map(specimen => {
            const isExpanded = expandedIds.has(specimen.id);
            const isActive   = activeSpecimenId === specimen.id;

            const instances = (caseData?.synopticReports ?? []).filter(r => r.specimenId === specimen.id);
            const legacyId  = !instances.length && caseData?.synopticTemplateId;
            const allRows   = instances.length > 0 ? instances : legacyId ? [{
              instanceId:   '__legacy__',
              templateId:   caseData!.synopticTemplateId!,
              templateName: (caseData!.synopticTemplateId!).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              answers:      caseData?.synopticAnswers ?? {},
              status:       'draft' as const,
              specimenId:   specimen.id,
              createdAt: '', updatedAt: '',
            }] : [];

            const specimenHasAnswers = allRows.some(r =>
              Object.values(r.answers ?? {}).some(v => v !== '' && !(Array.isArray(v) && !v.length))
            );
            const specimenDot: DotStatus = allRows.length === 0 ? 'empty' : specimenHasAnswers ? 'partial' : 'empty';

            return (
              <div key={specimen.id}>
                <div
                  className={`ps-syn-specimen-row${isActive ? ' active' : ''}`}
                  onClick={() => {
                    if (allRows.length === 0) { onSelectSpecimen?.(specimen.id); onAddSynoptic?.(); }
                    else { toggleExpand(specimen.id); onSelectSpecimen?.(specimen.id); }
                  }}
                  title={`${specimen.label}: ${specimen.description}`}
                  role="button" tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleExpand(specimen.id)}
                >
                  <span className={`ps-syn-expand-arrow${isExpanded ? ' open' : ''}${allRows.length === 0 ? ' hidden' : ''}`}>
                    ▶
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ps-syn-specimen-label">
                      <span className="ps-syn-specimen-label-letter">{specimen.label}:</span>{' '}
                      {specimen.description}
                    </div>
                  </div>

                  <span
                    className="ps-specimen-comment-btn"
                    onClick={e => { e.stopPropagation(); onOpenSpecimenComment?.(specimen.id); }}
                    title={specimenComments[specimen.id] ? 'Edit comment' : 'Add comment'}
                    style={{
                      opacity: specimenComments[specimen.id] && specimenComments[specimen.id] !== '<p></p>' ? 1 : 0.35,
                      color:   specimenComments[specimen.id] && specimenComments[specimen.id] !== '<p></p>' ? '#38bdf8' : '#94a3b8',
                    }}
                  >💬</span>

                  <StatusDot status={specimenDot} />
                </div>

                {isExpanded && (
                  <div className="ps-syn-instance-list">
                    {allRows.map(inst => {
                      const isActiveInst = activeReportInstanceId === inst.instanceId ||
                        (!activeReportInstanceId && inst.instanceId === '__legacy__');
                      const filledCount = Object.values(inst.answers ?? {}).filter(v =>
                        v !== '' && !(Array.isArray(v) && !v.length)
                      ).length;
                      const instDot: DotStatus = filledCount > 0 ? 'partial' : 'empty';

                      return (
                        <div
                          key={inst.instanceId}
                          className={`ps-syn-instance-row${isActiveInst ? ' active' : ''}`}
                          onClick={() => onSelectReport?.(inst.instanceId, specimen.id)}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ps-syn-instance-name">{inst.templateName}</div>
                            <div className="ps-syn-instance-meta">
                              {filledCount} field{filledCount !== 1 ? 's' : ''} answered
                            </div>
                          </div>
                          <StatusDot status={instDot} />
                          {inst.instanceId !== '__legacy__' && onDeleteReport && (
                            <button
                              type="button"
                              className="ps-btn-icon-danger"
                              onClick={e => {
                                e.stopPropagation();
                                setConfirmDeleteId(inst.instanceId);
                                setConfirmDeleteName(inst.templateName);
                              }}
                              title="Remove this synoptic report"
                            >🗑</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <button className="ps-syn-add-btn" onClick={() => onAddSynoptic?.()}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Synoptic Report
          </button>

        </div>
      )}

      <ConfirmModal
        show={!!confirmDeleteId}
        title="Remove Synoptic Report"
        message={`Remove "${confirmDeleteName}"? This cannot be undone until you save the case.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={() => { if (confirmDeleteId) onDeleteReport?.(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default Sidebar;
