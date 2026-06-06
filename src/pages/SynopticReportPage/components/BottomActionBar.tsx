import React, { useState, useEffect, useRef } from 'react';
import type { Case } from '@/types/case/Case';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequestReviewModal from '@/components/RequestReview/RequestReviewModal';
import { PoolClaimModal } from '@/components/Worklist/PoolClaimModal';


interface BottomActionBarProps {
  caseData: Case | null;
  isDirty?: boolean;
  onSaveDraft: () => void;
  onSaveAndNext: () => void;
  onFinalize: () => void;
  onFinalizeAndNext: () => void;
  onSignOut: () => void;
  
  onDelegate?: () => void;
  onHistory?: () => void;
  onFlags?: () => void;
  onCodes?: () => void;
  onTeam?: () => void;
  onNextCase: () => void;
  onPreviousCase: () => void;
  /** Orchestrator — generate report from synoptic answers */
  onGenerateReport?: () => void;
  isGenerating?: boolean;
  onAbortGenerate?: () => void;
}

const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant: 'outline' | 'solid';
  color: string;
  hoverColor?: string;
  title?: string;
}> = ({ onClick, children, variant, color, hoverColor, title }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    padding:      '6px 11px',                       // slightly tighter to fit more buttons
    borderRadius: '7px',
    fontWeight:   700,
    fontSize:     '12px',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    transition:   'all 0.15s ease',
    border:       `1.5px solid ${isHovered && variant === 'solid' ? (hoverColor || color) : color}`,
    background:   variant === 'solid'
      ? (isHovered ? (hoverColor || color) : color)
      : (isHovered ? `${color}22` : 'transparent'),
    color:        variant === 'solid' ? 'white' : color,
    display:      'flex',
    alignItems:   'center',
    gap:          '5px',
    transform:    isHovered ? 'translateY(1px)' : 'translateY(0)',
    boxShadow:    isHovered ? `0 2px 8px ${color}44` : 'none',
    lineHeight:   '1.2',            // explicit line-height prevents height variation from emoji/# chars
    height:       '32px',           // fixed height so ALL buttons are identical regardless of content
    boxSizing:    'border-box' as const,
  };

  return (
    <button onClick={onClick} style={baseStyle} title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {children}
    </button>
  );
};

const Divider = () => (
  <div style={{ width: 1, height: 32, background: '#475569', flexShrink: 0, margin: '0 2px' }} />
);

const BottomActionBar: React.FC<BottomActionBarProps> = ({
  caseData,
  isDirty = false,
  onSaveDraft,
  onSaveAndNext,
  onFinalize,
  onFinalizeAndNext,
  onSignOut,
  
  onDelegate,
  onHistory,
  onFlags,
  onCodes,
  onTeam,
  onNextCase,
  onPreviousCase,
  onGenerateReport,
  isGenerating = false,
  onAbortGenerate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [claimOpen,  setClaimOpen]  = useState(false);
  const emrWindowRef = useRef<Window | null>(null);
  const status = caseData?.status ?? 'draft';
  const isFinalized = status === 'finalized';
  const isPool = status === 'pool';
  
  // Logic to auto-close EMR window when patient changes
  useEffect(() => {
    return () => {
      if (emrWindowRef.current && !emrWindowRef.current.closed) {
        emrWindowRef.current.close();
      }
    };
  }, [caseData?.patient?.mrn]); // Trigger whenever MRN changes

const handleLaunchEMR = () => {
  const mrn = caseData?.patient?.mrn ?? '100004';
  const targetUrl = `${window.location.origin}/mock-emr?patientId=${mrn}`;
  
  // Standard stable dimensions for demo laptops/projectors
  const width = 1200;
  const height = 800;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  if (emrWindowRef.current && !emrWindowRef.current.closed) {
    emrWindowRef.current.location.href = targetUrl;
    emrWindowRef.current.focus();
  } else {
    emrWindowRef.current = window.open(
      targetUrl, 
      'PathScribeEMRSidecar', 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }
};

// Keep your safety close logic
useEffect(() => {
  if (emrWindowRef.current && !emrWindowRef.current.closed) {
    emrWindowRef.current.close();
    emrWindowRef.current = null;
  }
}, [caseData?.id]);

  const hasCodes = ((caseData as any)?.coding?.icd10?.length ?? 0) > 0 ||
                   ((caseData as any)?.coding?.snomed?.length ?? 0) > 0;
  const codesColor = hasCodes ? '#0891B2' : '#f59e0b';
  const allFinalized = (caseData?.synopticReports?.length ?? 0) > 0 &&
    caseData!.synopticReports!.every(r => r.status === 'finalized');

  return (
    <>
    <div style={{
      background: '#0d1829', padding: '11px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: '6px',
      overflow: 'visible', position: 'relative', zIndex: 200,
    }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto', flexShrink: 1, minWidth: 0 }}>
        <ActionButton onClick={onPreviousCase} variant="outline" color="#64748b" title="Previous case">← Previous</ActionButton>
        <ActionButton onClick={onNextCase} variant="outline" color="#64748b" title="Next case">Next →</ActionButton>
        <Divider />
        
        {/* LAUNCH EMR BUTTON */}
        <ActionButton onClick={handleLaunchEMR} variant="outline" color="#0ea5e9" title="Open Patient Record in EMR Sidecar">
          🌐 Launch EMR
        </ActionButton>

        {/* Hide delegate/review/flags/codes for pool cases — not yet assigned */}
        {!isPool && <>
          <ActionButton onClick={() => onDelegate?.()} variant="outline" color="#7c3aed" title="Delegate case">👥 Delegate</ActionButton>
          <ActionButton onClick={() => onTeam?.()} variant="outline" color="#0891B2" title="Manage case team">👤 Team</ActionButton>
          <ActionButton onClick={() => setReviewOpen(true)} variant="outline" color="#8B5CF6" title="Request informal peer review">🔍 Request Review</ActionButton>
          <ActionButton onClick={() => onHistory?.()} variant="outline" color="#0891B2">📋 History</ActionButton>
          <ActionButton onClick={() => onFlags?.()} variant="outline" color="#f59e0b">🚩 Flags</ActionButton>
          <ActionButton onClick={() => onCodes?.()} variant="outline" color={codesColor}># Codes</ActionButton>
        </>}
      </div>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
        {/* Pool case — show Claim button only */}
        {isPool && (
          <ActionButton onClick={() => setClaimOpen(true)} variant="solid" color="#6366f1" hoverColor="#4f46e5">
            ✋ Claim This Case
          </ActionButton>
        )}

        {/* Normal reporting actions — hidden for pool cases */}
        {!isPool && !isFinalized && (
          <>
            {/* Generate Report — shown when Orchestrator is wired */}
            {onGenerateReport && (
              <>
                {isGenerating ? (
                  <ActionButton onClick={() => onAbortGenerate?.()} variant="outline" color="#ef4444" title="Abort generation">
                    ✕ Abort
                  </ActionButton>
                ) : (
                  <ActionButton onClick={onGenerateReport} variant="outline" color="#38bdf8" title="Generate AI report draft from synoptic answers">
                    ⚡ Generate Report
                  </ActionButton>
                )}
                <Divider />
              </>
            )}
            <ActionButton onClick={onSaveDraft} variant="outline" color={isDirty ? '#38bdf8' : '#94a3b8'} title="Save draft">💾 Save Draft</ActionButton>
            <ActionButton onClick={onSaveAndNext} variant="outline" color={isDirty ? '#38bdf8' : '#94a3b8'} title="Save and go to next case">💾 Save &amp; Next</ActionButton>
            <Divider />
            <ActionButton onClick={onFinalize} variant="outline" color="#34d399" title="Finalize this report">🔒 Finalize</ActionButton>
            <ActionButton onClick={onFinalizeAndNext} variant="outline" color="#34d399" title="Finalize and go to next case">🔒 Finalize &amp; Next</ActionButton>
          </>
        )}
        {!isPool && (allFinalized || isFinalized) && status !== 'finalized' && (
          <ActionButton onClick={onSignOut} variant="solid" color="#047857" hoverColor="#065f46">✍️ Sign Out Case</ActionButton>
        )}
      </div>
    </div>

    <RequestReviewModal
      isOpen={reviewOpen}
      caseId={caseData?.id ?? ''}
      caseLabel={caseData ? `${caseData.patient?.lastName}, ${caseData.patient?.firstName}` : undefined}
      fromUserId={user?.id ?? 'u1'}
      fromUserName={user?.name ?? 'Unknown'}
      onClose={() => setReviewOpen(false)}
    />

    <PoolClaimModal
      isOpen={claimOpen && isPool}
      caseId={caseData?.id ?? null}
      caseSummary={caseData ? `${caseData.patient?.lastName}, ${caseData.patient?.firstName} — ${caseData.specimens?.[0]?.description ?? ''}` : undefined}
      poolName={`${(caseData as any)?.originHospitalId ?? 'MFT'} Pool`}
      currentUserId={user?.id ?? 'u1'}
      currentUserName={user?.name ?? 'Unknown'}
      continueToReport={true}
      onAccepted={() => setClaimOpen(false)}
      onPassed={() => {
        setClaimOpen(false);
        navigate('/worklist');
      }}
      onClose={() => setClaimOpen(false)}
    />
    </>
  );
};

export default BottomActionBar;