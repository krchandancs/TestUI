/**
 * AiReviewModal — AI Triage / Spell-checker Flow
 * Keyboard: Space/→ = Confirm, O = Override, S = Skip, Esc = Cancel
 */
import React, { useEffect, useCallback, useState } from 'react';
import '../../../pathscribe.css';

export interface ReviewField {
  fieldId:      string;
  fieldLabel:   string;
  sectionTitle: string;
  aiValue:      string | string[];
  confidence:   number;
  source:       string;
  verification: 'unverified' | 'verified' | 'disputed';
}

interface AiReviewModalProps {
  fields:          ReviewField[];
  finalizeAndNext: boolean;
  onConfirm:       (fieldId: string) => void;
  onOverride:      (fieldId: string) => void;
  onSkip:          (fieldId: string) => void;
  onComplete:      (summary: { confirmed: string[]; overridden: string[]; skipped: string[] }) => void;
  onCancel:        () => void;
}

// Dynamic — changes at runtime, must stay inline
const confColor = (c: number) =>
  c >= 85 ? '#34d399' : c >= 60 ? '#fbbf24' : '#f87171';

export const AiReviewModal: React.FC<AiReviewModalProps> = ({
  fields, finalizeAndNext, onConfirm, onOverride, onSkip, onComplete, onCancel,
}) => {
  const [index,      setIndex]     = useState(0);
  const [skipped,    setSkipped]   = useState<string[]>([]);
  const [confirmed,  setConfirmed] = useState<string[]>([]);
  const [overridden, setOverridden]= useState<string[]>([]);

  const current = fields[index];
  const total   = fields.length;
  const isDone  = index >= total;

  const advance = useCallback(() => {
    if (index + 1 >= total) onComplete({ confirmed, overridden, skipped });
    else setIndex(i => i + 1);
  }, [index, total, onComplete, confirmed, overridden, skipped]);

  const handleConfirm  = useCallback(() => { if (!current) return; onConfirm(current.fieldId);  setConfirmed(c => [...c, current.fieldId]);  advance(); }, [current, onConfirm,  advance]);
  const handleOverride = useCallback(() => { if (!current) return; onOverride(current.fieldId); setOverridden(o => [...o, current.fieldId]); advance(); }, [current, onOverride, advance]);
  const handleSkip     = useCallback(() => { if (!current) return; onSkip(current.fieldId);     setSkipped(s => [...s, current.fieldId]);    advance(); }, [current, onSkip,     advance]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleConfirm(); }
      if (e.key === 'o' || e.key === 'O') { e.preventDefault(); handleOverride(); }
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSkip(); }
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleConfirm, handleOverride, handleSkip, onCancel]);

  useEffect(() => {
    const c = () => handleConfirm();
    const o = () => handleOverride();
    const s = () => handleSkip();
    const x = () => onCancel();
    window.addEventListener('PATHSCRIBE_AI_REVIEW_CONFIRM',  c);
    window.addEventListener('PATHSCRIBE_AI_REVIEW_OVERRIDE', o);
    window.addEventListener('PATHSCRIBE_AI_REVIEW_SKIP',     s);
    window.addEventListener('PATHSCRIBE_AI_REVIEW_CANCEL',   x);
    return () => {
      window.removeEventListener('PATHSCRIBE_AI_REVIEW_CONFIRM',  c);
      window.removeEventListener('PATHSCRIBE_AI_REVIEW_OVERRIDE', o);
      window.removeEventListener('PATHSCRIBE_AI_REVIEW_SKIP',     s);
      window.removeEventListener('PATHSCRIBE_AI_REVIEW_CANCEL',   x);
    };
  }, [handleConfirm, handleOverride, handleSkip, onCancel]);

  if (isDone) return null;

  const progress     = Math.round((index / total) * 100);
  const displayValue = Array.isArray(current.aiValue) ? current.aiValue.join(', ') : current.aiValue;
  const cc           = confColor(current.confidence);

  return (
    <div className="ps-overlay" style={{ zIndex: 10001 }}>
      <div className="ps-modal-dark ps-ai-review-modal">

        <div className="ps-ai-review-header">
          <div>
            <div className="ps-ai-review-eyebrow">✦ AI Review Mode · {finalizeAndNext ? 'Finalise & Next' : 'Finalise'}</div>
            <div className="ps-ai-review-title">Review uncertain AI findings before sign-out</div>
          </div>
          <button onClick={onCancel} className="ps-modal-close">×</button>
        </div>

        <div className="ps-ai-review-progress-track">
          <div className="ps-ai-review-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="ps-ai-review-counter">
          <span className="ps-ai-review-counter-text">
            Field <strong>{index + 1}</strong> of <strong>{total}</strong>
            {skipped.length > 0 && <span className="ps-ai-review-skipped-count"> · {skipped.length} skipped</span>}
          </span>
          <div className="ps-ai-review-dots">
            {fields.map((f, i) => (
              <div key={i} className="ps-ai-review-dot" style={{
                background: i < index
                  ? (skipped.includes(f.fieldId) ? '#f59e0b' : '#10b981')
                  : i === index ? '#38bdf8' : 'rgba(255,255,255,0.15)',
              }} />
            ))}
          </div>
        </div>

        <div className="ps-ai-review-body">
          <span className="fm-eyebrow">{current.sectionTitle}</span>
          <div className="ps-ai-review-field-label">{current.fieldLabel}</div>

          <div className="ps-ai-review-card">
            <div className="ps-ai-review-card-header">
              <span className="ps-ai-review-card-eyebrow">✦ AI Suggestion</span>
              <span className="ps-ai-review-confidence" style={{ color: cc, background: cc + '22', borderColor: cc + '44' }}>
                {current.confidence}% confidence
              </span>
            </div>
            <div className="ps-ai-review-card-value">{displayValue || '—'}</div>
            <div className="ps-ai-review-card-source">{current.source}</div>
          </div>

          <div className="ps-ai-review-hints">
            {([
              { key: 'Space / →', label: 'Confirm', color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
              { key: 'O',         label: 'Override', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
              { key: 'S',         label: 'Skip',     color: '#cbd5e1', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)' },
              { key: 'Esc',       label: 'Cancel',   color: '#8a9db5', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
            ] as const).map(h => (
              <div key={h.key} className="ps-ai-review-hint" style={{ background: h.bg, borderColor: h.border }}>
                <kbd className="ps-ai-review-hint-key"   style={{ color: h.color }}>{h.key}</kbd>
                <span className="ps-ai-review-hint-label" style={{ color: h.color }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ps-modal-dark-footer ps-ai-review-footer">
          <button onClick={handleSkip}     className="ps-btn-ghost-dark">S — Skip</button>
          <button onClick={handleOverride} className="ps-btn-amber">O — Override</button>
          <button onClick={handleConfirm}  className="ps-btn-primary">
            Space — Confirm {index + 1 < total ? '& Next →' : '& Finalise 🔒'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiReviewModal;
