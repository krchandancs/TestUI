/**
 * components/EnhancementRequest/EnhancementRequestModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Enhancement request submission modal.
 * Receives a pre-captured, PHI-redacted screenshot from EnhancementRequestButton.
 * User can approve or discard the screenshot before submitting.
 *
 * Drop-in path: src/components/EnhancementRequest/EnhancementRequestModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../pathscribe.css';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  EnhancementRequestPayload,
  RequestCategory,
  RequestPriority,
  captureMetadata,
  submitEnhancementRequest,
  loadEnhancementConfig,
} from '../../services/enhancementRequestService';
import { useScreenCapture, ScreenCaptureResult } from '../../hooks/useScreenCapture';

// ─── Screenshot compression ───────────────────────────────────────────────────
// Resizes and re-encodes to JPEG to stay under EmailJS 50KB request limit.
async function compressScreenshot(dataUrl: string, maxWidth = 800, quality = 0.5): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original if it fails
    img.src = dataUrl;
  });
}

// ─── Style tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      '#0f172a',
  surface: '#1e293b',
  border:  '#334155',
  accent:  '#0891B2',
  text:    '#f1f5f9',
  muted:   '#94a3b8',
  dim:     '#64748b',
  dimmer:  '#475569',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.border}`,
  borderRadius: '7px', fontSize: '13px', color: T.text,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: T.dim,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  display: 'block', marginBottom: '6px',
};

const ENHANCEMENT_CATEGORIES: RequestCategory[] = ['UI', 'Workflow', 'Reporting', 'Integrations', 'Other'];
const QA_CATEGORIES: RequestCategory[] = ['UI Bug', 'Functional Issue', 'Data Issue', 'Performance', 'Other'];
const PRIORITIES: RequestPriority[]  = ['Low', 'Medium', 'High'];

const PRIORITY_STYLES: Record<RequestPriority, { color: string; bg: string; border: string }> = {
  Low:    { color: '#94a3b8', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)'  },
  Medium: { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'   },
  High:   { color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'    },
};

// ─── Success screen ───────────────────────────────────────────────────────────

const SuccessScreen: React.FC<{ ticketUrl?: string; onClose: () => void }> = ({ ticketUrl, onClose }) => (
  <div style={{ padding: '40px 32px', textAlign: 'center' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
    <h3 style={{ fontSize: '18px', fontWeight: 800, color: T.text, margin: '0 0 10px' }}>
      Request Submitted
    </h3>
    <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
      Your enhancement request has been received. The team will review it and follow up if needed.
    </p>
    {ticketUrl && (
      <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', marginBottom: '20px', fontSize: '12px', color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
        View ticket →
      </a>
    )}
    <button onClick={onClose}
      style={{ padding: '10px 28px', borderRadius: '8px', border: `1px solid rgba(8,145,178,0.4)`, background: 'rgba(8,145,178,0.15)', color: T.accent, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      Done
    </button>
  </div>
);

// ─── Screenshot preview ───────────────────────────────────────────────────────

const ScreenshotPreview: React.FC<{
  screenshot:  ScreenCaptureResult;
  included:    boolean;
  onToggle:    () => void;
}> = ({ screenshot, included, onToggle }) => {
  const [lightbox, setLightbox] = React.useState(false);
  return (
  <div>
    <label style={labelStyle}>
      Screen Capture
      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>
        (PHI auto-redacted)
      </span>
    </label>
    <div style={{
      borderRadius: '8px', overflow: 'hidden',
      border: `1px solid ${included ? 'rgba(8,145,178,0.3)' : T.border}`,
      opacity: included ? 1 : 0.4, transition: 'all 0.2s',
      cursor: 'zoom-in', position: 'relative',
    }}
      onClick={() => setLightbox(true)}
      title="Click to view full size"
    >
      <img
        src={screenshot.dataUrl}
        alt="Screen capture"
        style={{ width: '100%', display: 'block', maxHeight: '160px', objectFit: 'cover', objectPosition: 'top' }}
      />
      <div style={{
        position: 'absolute', bottom: '6px', right: '6px',
        background: 'rgba(0,0,0,0.55)', borderRadius: '4px',
        padding: '2px 6px', fontSize: '10px', color: '#cbd5e1', pointerEvents: 'none',
      }}>🔍 Click to expand</div>
    </div>

    {/* Lightbox */}
    {lightbox && ReactDOM.createPortal(
      <div
        onClick={() => setLightbox(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200000,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', padding: '32px',
        }}
      >
        <img
          src={screenshot.dataUrl}
          alt="Screen capture — full size"
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', pointerEvents: 'none' }}
        />
        <button
          onClick={() => setLightbox(false)}
          style={{
            position: 'absolute', top: '16px', right: '20px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px', color: '#f1f5f9', fontSize: '14px', fontWeight: 700,
            padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >✕ Close</button>
      </div>,
      document.body
    )}

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: T.dimmer }}>
        {(screenshot.redactedCount > 0 || screenshot.pdfRedactedCount > 0) ? (
          <>
            🔒{' '}
            {screenshot.redactedCount > 0 && `${screenshot.redactedCount} PHI field${screenshot.redactedCount !== 1 ? 's' : ''}`}
            {screenshot.redactedCount > 0 && screenshot.pdfRedactedCount > 0 && ' · '}
            {screenshot.pdfRedactedCount > 0 && `${screenshot.pdfRedactedCount} PDF report${screenshot.pdfRedactedCount !== 1 ? 's' : ''} masked`}
            {' redacted'}
          </>
        ) : '✓ No PHI detected'}
        {' · '}captured {new Date(screenshot.timestamp).toLocaleTimeString()}
      </div>
      <button
        onClick={onToggle}
        style={{
          fontSize: '11px', fontWeight: 600, cursor: 'pointer',
          background: 'none', border: 'none', fontFamily: 'inherit',
          color: included ? '#f87171' : T.accent, padding: '2px 0',
        }}
      >
        {included ? 'Remove' : 'Include'}
      </button>
    </div>
  </div>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

export type EnhancementButtonMode = 'enhancement' | 'qa';

interface Props {
  onClose:  () => void;
  mode?:    EnhancementButtonMode;
}

export const EnhancementRequestModal: React.FC<Props> = ({ onClose, mode = 'enhancement' }) => {
  const isQA = mode === 'qa';
  const { capture, isCapturing } = useScreenCapture();
  const { user } = useAuth();

  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [category,        setCategory]        = useState<RequestCategory>(isQA ? 'Functional Issue' : 'Workflow');
  const [priority,        setPriority]        = useState<RequestPriority | undefined>(undefined);
  const [includeSystem,   setIncludeSystem]   = useState(true);
  const [screenshot,        setScreenshot]        = useState<ScreenCaptureResult | null>(null);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  const handleCapture = async () => {
    const result = await capture();
    setScreenshot(result);
    setIncludeScreenshot(true);
  };
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [submitted,       setSubmitted]       = useState(false);
  const [ticketUrl,       setTicketUrl]       = useState<string | undefined>();

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    // Convert screenshot dataUrl to File if included
    const attachments: File[] = [];
    if (screenshot && includeScreenshot) {
      try {
        const res   = await fetch(screenshot.dataUrl);
        const blob  = await res.blob();
        const ts    = new Date(screenshot.timestamp).toISOString().replace(/[:.]/g, '-');
        attachments.push(new File([blob], `screenshot-${ts}.png`, { type: 'image/png' }));
      } catch { /* skip if conversion fails */ }
    }

    const payload: EnhancementRequestPayload = {
      title:         title.trim(),
      description:   description.trim(),
      category,
      priority,
      attachments,
      includeSystem,
      mode,
      screenshotDataUrl: (screenshot && includeScreenshot) ? await compressScreenshot(screenshot.dataUrl, 400, 0.3) : undefined,
      metadata: includeSystem && user
        ? captureMetadata({ id: user.id, name: user.name, role: user.role })
        : undefined,
    };

    try {
      const config = loadEnhancementConfig();
      const result = await submitEnhancementRequest(payload, config);
      if (result.success) {
        setTicketUrl(result.ticketUrl);
        setSubmitted(true);
      } else {
        setError(result.error ?? 'Submission failed — please try again.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div
      data-enhancement-modal="true"
      onClick={onClose}
      className="ps-overlay" style={{ zIndex: 60000, alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40, overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px', maxHeight: 'calc(100vh - 80px)',
          background: T.surface,
          borderRadius: '16px',
          border: '1px solid rgba(8,145,178,0.2)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {submitted ? (
          <SuccessScreen ticketUrl={ticketUrl} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '20px 24px 16px', flexShrink: 0,
              borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              background: isQA ? 'rgba(245,158,11,0.06)' : 'rgba(8,145,178,0.04)',
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{isQA ? '🐛' : '💡'}</span>
                  {isQA ? 'Submit QA / Testing Feedback' : 'Submit Enhancement Request'}
                </div>
                <div style={{ fontSize: '12px', color: T.dim, marginTop: '3px' }}>
                  {isQA
                    ? 'Report bugs, test failures, or unexpected behaviour'
                    : 'Help shape the future of pathscribe AI'}
                </div>
              </div>
              <button onClick={onClose}
                style={{ background: 'none', border: 'none', color: T.dimmer, fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '2px' }}
                onMouseEnter={e => e.currentTarget.style.color = T.muted}
                onMouseLeave={e => e.currentTarget.style.color = T.dimmer}
              >✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Title <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Brief summary of your enhancement idea…"
                  maxLength={120} style={inputStyle} autoFocus
                  onFocus={e => e.currentTarget.style.borderColor = T.accent}
                  onBlur={e  => e.currentTarget.style.borderColor = T.border}
                />
                <div style={{ fontSize: '10px', color: T.dimmer, marginTop: '3px', textAlign: 'right' }}>
                  {title.length}/120
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the enhancement in detail. What problem does it solve? What should the experience be like?"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }}
                  onFocus={e => e.currentTarget.style.borderColor = T.accent}
                  onBlur={e  => e.currentTarget.style.borderColor = T.border}
                />
              </div>

              {/* QA routing notice */}
              {isQA && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '11px', color: '#fbbf24', lineHeight: 1.5 }}>
                  🐛 This feedback will be sent to the QA team and cc&#39;d to the system administrator.
                </div>
              )}

              {/* Category + Priority */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(isQA ? QA_CATEGORIES : ENHANCEMENT_CATEGORIES).map(cat => (
                      <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                        background: category === cat ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.04)',
                        color:      category === cat ? T.accent : T.dim,
                        border:     `1px solid ${category === cat ? 'rgba(8,145,178,0.4)' : T.border}`,
                      }}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div style={{ width: '140px', flexShrink: 0 }}>
                  <label style={labelStyle}>Priority <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {PRIORITIES.map(p => {
                      const s = PRIORITY_STYLES[p];
                      const active = priority === p;
                      return (
                        <button key={p} onClick={() => setPriority(active ? undefined : p)} style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', textAlign: 'left',
                          background: active ? s.bg   : 'rgba(255,255,255,0.03)',
                          color:      active ? s.color : T.dimmer,
                          border:     `1px solid ${active ? s.border : T.border}`,
                        }}>{p}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Screen capture — opt-in */}
              {!screenshot ? (
                <div>
                  <label style={labelStyle}>Screen Capture</label>
                  <button
                    onClick={handleCapture}
                    disabled={isCapturing}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', cursor: isCapturing ? 'wait' : 'pointer',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                      color: isCapturing ? T.dimmer : T.muted, fontSize: '13px', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isCapturing) { e.currentTarget.style.borderColor = 'rgba(8,145,178,0.4)'; e.currentTarget.style.color = T.accent; }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                  >
                    {isCapturing ? '⏳ Capturing…' : '📷 Capture Current Screen'}
                  </button>
                  <div style={{ fontSize: '11px', color: T.dimmer, marginTop: '5px' }}>
                    PHI fields are automatically redacted before capture.
                  </div>
                </div>
              ) : (
                <ScreenshotPreview
                  screenshot={screenshot}
                  included={includeScreenshot}
                  onToggle={() => setIncludeScreenshot(v => !v)}
                />
              )}

              {/* Include system details toggle */}
              <div
                onClick={() => setIncludeSystem(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: includeSystem ? 'rgba(8,145,178,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${includeSystem ? 'rgba(8,145,178,0.2)' : T.border}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '36px', height: '20px', borderRadius: '99px', flexShrink: 0,
                  background: includeSystem ? T.accent : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: '3px', width: '14px', height: '14px',
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    left: includeSystem ? '19px' : '3px',
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: includeSystem ? T.accent : T.muted }}>
                    Include system details
                  </div>
                  <div style={{ fontSize: '10px', color: T.dimmer, marginTop: '1px' }}>
                    Attaches your user info, browser, OS, app version, and current page
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '12px', color: '#f87171' }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px', flexShrink: 0,
              borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <button onClick={onClose}
                style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit} disabled={!canSubmit}
                style={{
                  padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  border: `1px solid ${canSubmit ? (isQA ? 'rgba(245,158,11,0.4)' : 'rgba(8,145,178,0.4)') : T.border}`,
                  background: canSubmit ? (isQA ? 'rgba(245,158,11,0.15)' : 'rgba(8,145,178,0.15)') : 'rgba(255,255,255,0.04)',
                  color: canSubmit ? (isQA ? '#fbbf24' : T.accent) : T.dimmer,
                  opacity: submitting ? 0.7 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = isQA ? 'rgba(245,158,11,0.25)' : 'rgba(8,145,178,0.25)'; }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = isQA ? 'rgba(245,158,11,0.15)' : 'rgba(8,145,178,0.15)'; }}
              >
                {submitting ? '⏳ Submitting…' : isQA ? '🐛 Submit QA Feedback' : '💡 Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
