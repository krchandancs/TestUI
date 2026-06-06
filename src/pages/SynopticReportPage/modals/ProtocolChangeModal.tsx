// src/pages/SynopticReportPage/modals/ProtocolChangeModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shown when AI re-evaluates synoptic protocol assignments after microscopic
// description is submitted. Displays a diff of current vs proposed protocols
// with per-change checkboxes and a commit action.
//
// Trigger: microscopic saved → AI evaluates → if changes proposed → this modal.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import '../../../pathscribe.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProtocolChange {
  id:                   string;
  specimenId:           string;
  specimenLabel:        string;
  specimenDesc:         string;
  currentTemplateId:    string;
  currentTemplateName:  string;
  proposedTemplateId:   string;
  proposedTemplateName: string;
  /** Human-readable reason from AI analysis of the microscopic description */
  reason:               string;
  confidence:           number;  // 0–100
}

interface ProtocolChangeModalProps {
  show:       boolean;
  changes:    ProtocolChange[];
  /** Called with the IDs of changes the pathologist approved */
  onCommit:   (acceptedIds: string[]) => void;
  onCancel:   () => void;
}

// ── Confidence colour ─────────────────────────────────────────────────────────

function confColor(c: number): string {
  return c >= 85 ? '#34d399' : c >= 70 ? '#fbbf24' : '#f87171';
}

// ── Change row ────────────────────────────────────────────────────────────────

const ChangeRow: React.FC<{
  change:    ProtocolChange;
  selected:  boolean;
  onToggle:  () => void;
}> = ({ change, selected, onToggle }) => (
  <div
    className={`ps-proto-change-row${selected ? ' ps-proto-change-row--selected' : ''}`}
    onClick={onToggle}
  >
    <input
      type="checkbox"
      checked={selected}
      onChange={onToggle}
      onClick={e => e.stopPropagation()}
      className="ps-proto-change-checkbox"
    />

    <div className="ps-proto-change-body">
      {/* Specimen label */}
      <div className="ps-proto-change-specimen">
        <span className="ps-proto-change-specimen-badge">{change.specimenLabel}</span>
        <span className="ps-proto-change-specimen-desc">{change.specimenDesc}</span>
      </div>

      {/* Protocol diff */}
      <div className="ps-proto-change-diff">
        <div className="ps-proto-change-current">
          <span className="ps-proto-change-diff-label">Current</span>
          <span className="ps-proto-change-diff-name ps-proto-change-diff-name--current">
            {change.currentTemplateName}
          </span>
        </div>
        <span className="ps-proto-change-arrow">→</span>
        <div className="ps-proto-change-proposed">
          <span className="ps-proto-change-diff-label">Proposed</span>
          <span className="ps-proto-change-diff-name ps-proto-change-diff-name--proposed">
            {change.proposedTemplateName}
          </span>
        </div>
      </div>

      {/* AI reason */}
      <p className="ps-proto-change-reason">"{change.reason}"</p>

      {/* Confidence */}
      <span
        className="ps-proto-change-confidence"
        style={{ color: confColor(change.confidence), borderColor: confColor(change.confidence) + '44', background: confColor(change.confidence) + '18' }}
      >
        ✦ {change.confidence}% confidence
      </span>
    </div>
  </div>
);

// ── Main modal ────────────────────────────────────────────────────────────────

export const ProtocolChangeModal: React.FC<ProtocolChangeModalProps> = ({
  show, changes, onCommit, onCancel,
}) => {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(changes.map(c => c.id)));

  // Reset selection when modal opens with new changes
  React.useEffect(() => {
    if (show) setSelected(new Set(changes.map(c => c.id)));
  }, [show, changes]);

  const allSelected  = selected.size === changes.length;
  const noneSelected = selected.size === 0;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(changes.map(c => c.id)));
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCommit = () => onCommit(Array.from(selected));

  if (!show || changes.length === 0) return null;

  return (
    <div className="ps-overlay" style={{ zIndex: 10500 }}>
      <div className="ps-modal-dark ps-proto-modal">

        {/* Header */}
        <div className="ps-proto-modal-header">
          <div className="ps-proto-modal-header-left">
            <div className="fm-eyebrow" style={{ color: '#38bdf8', marginBottom: 4 }}>
              ✦ AI Protocol Review
            </div>
            <h2 className="ps-modal-dark-title" style={{ margin: 0 }}>
              Protocol adjustments proposed
            </h2>
            <p className="ps-modal-dark-hint" style={{ margin: '4px 0 0' }}>
              Microscopic findings suggest {changes.length} protocol change{changes.length !== 1 ? 's' : ''}.
              Review each and approve the changes you want applied.
            </p>
          </div>
          <button onClick={onCancel} className="ps-modal-close" style={{ fontSize: 20 }}>×</button>
        </div>

        {/* Select all */}
        <div className="ps-proto-select-all" onClick={toggleAll}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            onClick={e => e.stopPropagation()}
            ref={el => { if (el) el.indeterminate = !allSelected && !noneSelected; }}
            className="ps-proto-change-checkbox"
          />
          <span className="ps-proto-select-all-label">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
          <span className="ps-proto-select-all-count">
            {selected.size} of {changes.length} selected
          </span>
        </div>

        {/* Change list */}
        <div className="ps-proto-modal-list">
          {changes.map(change => (
            <ChangeRow
              key={change.id}
              change={change}
              selected={selected.has(change.id)}
              onToggle={() => toggle(change.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="ps-modal-dark-footer" style={{ justifyContent: 'stretch' }}>
          <button className="ps-btn-ghost-dark" style={{ flex: 1 }} onClick={onCancel}>
            Keep existing protocols
          </button>
          <button
            onClick={handleCommit}
            disabled={noneSelected}
            className={noneSelected ? 'ps-btn-ghost-dark' : 'ps-btn-primary'}
            style={{ flex: 2 }}
          >
            {noneSelected
              ? 'No changes selected'
              : `Apply ${selected.size} change${selected.size !== 1 ? 's' : ''} →`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProtocolChangeModal;
