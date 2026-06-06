// src/pages/SynopticReportPage/components/HeaderBar.tsx
// Rich case header — white bar with accession, patient info, progress steps.

import React from 'react';
import type { Case } from '@/types/case/Case';
import { getOrchestratorMode } from '@/components/Config/NarrativeTemplates';
import { getOrganisationByHospitalId } from '@/services/organisation/organisationService';
import '@/pathscribe.css';

interface HeaderBarProps {
  caseData:      Case | null;
  onSignOut:     () => void;
  onNavigate:    (path: string) => void;
  aiConfidence?: number; // 0–100
}

type StepStatus = 'completed' | 'current' | 'pending' | 'alert';

interface ProgressStep {
  id:     number;
  label:  string;
  status: StepStatus;
}

// ── Status meta ───────────────────────────────────────────────────────────────
const CASE_STATE_META: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  'draft':          { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '#3b82f6' },
  'in-progress':    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '#3b82f6' },
  'finalized':      { bg: '#f0fdf4', border: '#86efac', color: '#15803d', dot: '#22c55e' },
  'pending-review': { bg: '#fef3c7', border: '#fde047', color: '#92400e', dot: '#f59e0b' },
};

// ── Step circle class helper ──────────────────────────────────────────────────
function stepClass(status: StepStatus): string {
  return `ps-hb-step-circle ps-hb-step-circle--${status}`;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ caseData, onSignOut: _onSignOut, onNavigate, aiConfidence }) => {
  const isOrchestration = getOrchestratorMode();

  const accession = caseData?.accession?.fullAccession ?? caseData?.accession?.accessionNumber ?? '—';
  const patient   = caseData?.patient ? `${caseData.patient.lastName}, ${caseData.patient.firstName}` : '—';
  const dob       = caseData?.patient?.dateOfBirth
    ? new Date(caseData.patient.dateOfBirth).toLocaleDateString() : '—';
  const mrn       = caseData?.patient?.mrn ?? '—';
  const sex       = caseData?.patient?.sex ?? '—';
  const status    = caseData?.status ?? 'draft';
  const hospital    = getOrganisationByHospitalId(caseData?.originHospitalId ?? '');
  const clientName  = caseData?.order?.clientName ?? null;
  const meta        = CASE_STATE_META[status] ?? CASE_STATE_META['draft'];

  // ── Mode-aware final step label ───────────────────────────────────────────
  const finalStepLabel = isOrchestration ? 'Sign Out' : 'Finalise';

  const progressSteps: ProgressStep[] = [
    { id: 1, label: 'Grossing',       status: 'completed' },
    { id: 2, label: 'Processing',     status: 'completed' },
    { id: 3, label: 'Synoptic',       status: 'current'   },
    { id: 4, label: finalStepLabel,   status: 'pending'   },
  ];

  return (
    <div className="ps-hb">

      {/* Breadcrumb */}
      <div className="ps-hb-breadcrumb">
        <span className="ps-hb-crumb" onClick={() => onNavigate('/')}>Home</span>
        <span className="ps-hb-crumb-sep">›</span>
        <span className="ps-hb-crumb" onClick={() => onNavigate('/worklist')}>Worklist</span>
        <span className="ps-hb-crumb-sep">›</span>
        <span className="ps-hb-crumb ps-hb-crumb--active">Case Report</span>
      </div>

      {/* Main row */}
      <div className="ps-hb-row">

        {/* Left — accession + patient */}
        <div className="ps-hb-left">

          {/* Accession block */}
          <div className="ps-hb-accession">
            <div className="ps-hb-field-label">Accession</div>
            <div className="ps-hb-accession-number">{accession}</div>
            {hospital && (
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 2, marginBottom: 3 }}>
                {hospital.shortName} · {hospital.country === 'UK' ? 'NHS' : hospital.country}
              </div>
            )}
            <div className="ps-hb-status-pill" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
              <div className="ps-hb-status-dot" style={{ background: meta.dot }} />
              <span className="ps-hb-status-text" style={{ color: meta.color }}>{status}</span>
            </div>
          </div>

          <div className="ps-hb-divider" />

          {/* Patient fields */}
          <div className="ps-hb-patient-fields">
            <div className="ps-hb-field">
              <div className="ps-hb-field-label">Patient</div>
              <div className="ps-hb-field-value ps-hb-field-value--lg">{patient}</div>
            </div>
            <div className="ps-hb-field">
              <div className="ps-hb-field-label">Sex</div>
              <div className="ps-hb-field-value">{sex}</div>
            </div>
            <div className="ps-hb-field">
              <div className="ps-hb-field-label">Date of Birth</div>
              <div className="ps-hb-field-value">{dob}</div>
            </div>
            <div className="ps-hb-field">
              <div className="ps-hb-field-label">MRN</div>
              <div className="ps-hb-field-value">{mrn}</div>
            </div>
            {clientName && (
              <div className="ps-hb-field">
                <div className="ps-hb-field-label">Referring</div>
                <div className="ps-hb-field-value">{clientName}</div>
              </div>
            )}
          </div>
        </div>

        {/* Centre — progress stepper */}
        <div className="ps-hb-stepper">
          {progressSteps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="ps-hb-step">
                <div className={stepClass(step.status)}>
                  {step.status === 'completed' ? '✓' : step.status === 'alert' ? '⚠' : step.id}
                </div>
                <div className={`ps-hb-step-label ps-hb-step-label--${step.status}`}>
                  {step.label}
                </div>
              </div>
              {idx < progressSteps.length - 1 && (
                <div className={`ps-hb-step-connector${idx < 2 ? ' ps-hb-step-connector--done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right — AI confidence card */}
        <div className="ps-hb-right">
          <div className="ps-hb-confidence-card">
            <div className="ps-hb-confidence-header">
              <span className="ps-hb-confidence-status">{status}</span>
              <span className="ps-hb-confidence-priority">{caseData?.order?.priority ?? 'Routine'}</span>
            </div>
            {aiConfidence !== undefined && (
              <>
                <div className="ps-hb-confidence-score">
                  <span className="ps-hb-confidence-pct">{aiConfidence}%</span>
                  <span className="ps-hb-confidence-label">AI confidence</span>
                </div>
                <div className="ps-hb-confidence-bar-track">
                  <div
                    className={`ps-hb-confidence-bar-fill${
                      aiConfidence >= 80 ? ' ps-hb-confidence-bar-fill--high'
                      : aiConfidence >= 60 ? ' ps-hb-confidence-bar-fill--mid'
                      : ' ps-hb-confidence-bar-fill--low'
                    }`}
                    style={{ width: `${aiConfidence}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeaderBar;
