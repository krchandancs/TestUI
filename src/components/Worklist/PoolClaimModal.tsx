/**
 * PoolClaimModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown when a pathologist clicks a pool case.
 * They must explicitly Accept (assigns to them) or Pass (returns to pool).
 * The case is status-locked to 'claimed' while this modal is open.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pathscribe.css';
import { claimPoolCase, acceptPoolCase, passPoolCase } from '../../services/cases/mockCaseService';

interface PoolClaimModalProps {
  isOpen:            boolean;
  caseId:            string | null;
  caseSummary?:      string;
  poolName?:         string;
  currentUserId:     string;
  currentUserName:   string;
  continueToReport?: boolean;
  fromFilter?:       string;
  onAccepted:        () => void;
  onPassed:          () => void;
  onClose:           () => void;
}

type Step = 'claiming' | 'ready' | 'blocked' | 'accepting' | 'passing';

export const PoolClaimModal: React.FC<PoolClaimModalProps> = ({
  isOpen, caseId, caseSummary, poolName,
  currentUserId, currentUserName,
  continueToReport = false,
  fromFilter,
  onAccepted, onPassed, onClose,
}) => {
  const navigate = useNavigate();
  const [step,      setStep]      = useState<Step>('claiming');
  const [blockedBy, setBlockedBy] = useState<string | null>(null);

  const handleViewReport = () => {
    if (!caseId) return;
    navigate(`/report/${caseId}`, { state: { fromFilter: 'pool' } });
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !caseId) return;
    setStep('claiming');
    setBlockedBy(null);

    // claimPoolCase takes (caseId, userId) — name is resolved by the service
    claimPoolCase(caseId, currentUserId).then(result => {
      if (result.success) {
        setStep('ready');
      } else {
        setBlockedBy((result as any).claimedBy ?? 'another pathologist');
        setStep('blocked');
      }
    });

    // Release claim if modal closes without action
    return () => { if (caseId) passPoolCase(caseId).catch(() => {}); };
  }, [isOpen, caseId, currentUserId, currentUserName]);

  const handleAccept = async () => {
    if (!caseId) return;
    setStep('accepting');
    await acceptPoolCase(caseId, currentUserId);
    if (continueToReport) {
      navigate(`/case/${caseId}/synoptic`);
    }
    onAccepted();
  };

  const handlePass = async () => {
    if (!caseId) return;
    setStep('passing');
    await passPoolCase(caseId);
    onPassed();
    navigate('/worklist', { state: { restoreFilter: fromFilter ?? 'pool' } });
  };

  if (!isOpen || !caseId) return null;

  const busy = step === 'accepting' || step === 'passing';

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-pool-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ps-pool-header">
          <div className="ps-pool-eyebrow">👥 {poolName ?? 'Pool'} — Case Assignment</div>
          <div className="ps-pool-title">{caseSummary ?? caseId}</div>
          <div className="ps-pool-subtitle">{caseId}</div>
        </div>

        {/* Body */}
        <div className={step === 'claiming' || step === 'blocked' ? 'ps-pool-body--centered' : 'ps-pool-body'}>

          {/* Claiming */}
          {step === 'claiming' && <>
            <div className="ps-pool-icon">⏳</div>
            Checking case availability…
          </>}

          {/* Blocked */}
          {step === 'blocked' && <>
            <div className="ps-pool-icon">🔒</div>
            <div className="ps-pool-blocked-title">Case Unavailable</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              This case is currently being reviewed by{' '}
              <strong style={{ color: '#e2e8f0' }}>{blockedBy}</strong>.
              Please try another case or check back shortly.
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="ps-btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>}

          {/* Ready / Acting */}
          {(step === 'ready' || step === 'accepting' || step === 'passing') && <>
            <p className="ps-pool-description">
              {continueToReport
                ? <>Would you like to <strong style={{ color: '#38bdf8' }}>claim this case and continue reporting</strong>, or <strong style={{ color: '#f59e0b' }}>pass</strong> and return it to the pool?</>
                : <>Would you like to <strong style={{ color: '#38bdf8' }}>claim</strong> this case, <strong style={{ color: '#a78bfa' }}>view the report</strong> before deciding, or <strong style={{ color: '#f59e0b' }}>pass</strong> and return it to the pool?</>
              }
            </p>

            <div className="ps-pool-info-box">
              <div className="ps-pool-info-box-label">What happens next</div>
              <div className="ps-pool-info-box-items">
                {continueToReport
                  ? <>
                      <div>✅ <strong style={{ color: '#e2e8f0' }}>Claim &amp; Continue</strong> — Case moves to your worklist and opens directly in the synoptic report.</div>
                      <div>⏭️ <strong style={{ color: '#e2e8f0' }}>Pass</strong> — Case returns to the pool for another pathologist.</div>
                    </>
                  : <>
                      <div>✅ <strong style={{ color: '#e2e8f0' }}>Claim Case</strong> — Case moves to your worklist as In Progress.</div>
                      <div>🔍 <strong style={{ color: '#e2e8f0' }}>View Report</strong> — Preview the case report before deciding. You can claim or pass from there.</div>
                      <div>⏭️ <strong style={{ color: '#e2e8f0' }}>Pass</strong> — Case returns to the pool for another pathologist.</div>
                    </>
                }
              </div>
            </div>

            <div className="ps-pool-actions">
              <button className="ps-btn-secondary" onClick={handlePass} disabled={busy}>Pass</button>

              {!continueToReport && (
                <button className="ps-btn-view-report" onClick={handleViewReport} disabled={busy}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  View Report
                </button>
              )}

              <button className="ps-btn-primary" onClick={handleAccept} disabled={busy}>
                {step === 'accepting' ? 'Claiming…' : continueToReport ? 'Claim & Continue' : 'Claim Case'}
              </button>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
};

export default PoolClaimModal;
