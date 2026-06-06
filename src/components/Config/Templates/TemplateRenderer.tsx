/**
 * TemplateRenderer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-page renderer for reviewing and actioning a protocol in the review queue.
 *
 * Architecture role:
 *   Reached via /template-review/:templateId. Displays the protocol's sections
 *   and questions for review, provides lifecycle transition controls, and
 *   navigates back to /configuration?tab=protocols.
 *
 * Lifecycle model (linear — matches CAP validation practice):
 *   draft → in_review → approved → published
 *   needs_changes can be applied from in_review or approved (rejection)
 *   needs_changes → in_review (re-submission)
 *   Reset always available as admin escape hatch
 *
 *   Allowed transitions map:
 *     draft          → in_review
 *     in_review      → needs_changes, approved
 *     needs_changes  → in_review
 *     approved       → needs_changes, published
 *     published      → (terminal — no further transitions)
 *
 * Confirmation modals:
 *   All lifecycle transitions require confirmation. High-stakes transitions
 *   (Approve, Publish) include an optional reason/comment field.
 *   Reset requires confirmation with a destructive warning.
 *
 * Unsaved warning:
 *   If the reviewer has touched any annotation fields (answers) but has not
 *   completed a lifecycle transition, navigating away via breadcrumb or Back
 *   shows a warning modal: "You have unsaved annotations — leave anyway?"
 *
 * Known limitations / TODO:
 *   - Loads mockDcisTemplate regardless of templateId. Wire to protocolRegistry
 *     once templates and protocols are fully unified.
 *   - InlineCommentThread "Add a comment" input retains its own styling —
 *     style that component separately when ready.
 *
 * Consumed by:
 *   App.tsx  route: /template-review/:templateId
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import '../../../pathscribe.css';
import { useNavigate, useParams } from 'react-router-dom';
import { mockDcisTemplate } from '../../../templates/mockDcisTemplate';
import { InlineCommentThread } from '../../PatientReportPage/Comments/InlineCommentThread';
import { TemplateLifecycleState } from '../../../types/AuditEvent';
import { Question, ChoiceQuestion, TemplateSection } from '../../../types/templateTypes';
import { PROTOCOL_REGISTRY } from '../Protocols/protocolShared';
import { transitionTemplate } from '../../../services/templates/templateService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSynopticAudit } from '../../../hooks/useSynopticAudit';

const isChoiceQuestion = (q: Question): q is ChoiceQuestion => q.type === 'choice';

type AnswerMap = Record<string, string | string[]>;

// ─── Lifecycle definitions ────────────────────────────────────────────────────

const LIFECYCLE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  draft:         { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  in_review:     { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
  needs_changes: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  approved:      { bg: 'rgba(16,185,129,0.15)',  color: '#10B981', border: 'rgba(16,185,129,0.3)'  },
  published:     { bg: 'rgba(8,145,178,0.15)',   color: '#38bdf8', border: 'rgba(8,145,178,0.3)'   },
};

// Which transitions are allowed from each state
const ALLOWED_TRANSITIONS: Record<TemplateLifecycleState, TemplateLifecycleState[]> = {
  draft:         ['in_review'],
  in_review:     ['needs_changes', 'approved'],
  needs_changes: ['in_review'],
  approved:      ['needs_changes', 'published'],
  published:     [],
};

interface TransitionAction {
  target:      TemplateLifecycleState;
  label:       string;
  color:       string;
  icon:        string;
  requireNote: boolean;   // whether the confirm modal shows a reason field
  confirmMsg:  string;    // body text shown in the confirm modal
  destructive: boolean;   // red confirm button
}

// ─── Source-aware terminology ─────────────────────────────────────────────────
// Terminology for the sign-off and go-live steps varies by governing body.
// Based on the template's source, we use the terms that staff will recognise.

interface SourceTerms {
  signOff:       string;   // label for the 'approved' transition
  signOffVerb:   string;   // past tense, used in confirmMsg
  goLive:        string;   // label for the 'published' transition
  goLiveVerb:    string;   // past tense, used in live banner
}

const SOURCE_TERMS: Record<string, SourceTerms> = {
  CAP:    { signOff: 'Accept',  signOffVerb: 'accepted',  goLive: 'Release',  goLiveVerb: 'released'  },
  RCPath: { signOff: 'Ratify',  signOffVerb: 'ratified',  goLive: 'Publish',  goLiveVerb: 'published' },
  ICCR:   { signOff: 'Approve', signOffVerb: 'approved',  goLive: 'Publish',  goLiveVerb: 'published' },
  Custom: { signOff: 'Approve', signOffVerb: 'approved',  goLive: 'Publish',  goLiveVerb: 'published' },
};

// State labels shown in the lifecycle tracker — also vary by source
const SOURCE_STATE_LABELS: Record<string, Partial<Record<TemplateLifecycleState, string>>> = {
  CAP:    { approved: 'Accepted',  published: 'Released'  },
  RCPath: { approved: 'Ratified',  published: 'Published' },
};

function getTerms(source?: string): SourceTerms {
  // If source contains multiple values, use the first recognised one
  if (!source) return SOURCE_TERMS.Custom;
  const key = Object.keys(SOURCE_TERMS).find(k => source.includes(k));
  return SOURCE_TERMS[key ?? 'Custom'];
}

function getStateLabel(state: TemplateLifecycleState, source?: string): string {
  const overrides = SOURCE_STATE_LABELS[source ?? ''] ?? {};
  return (overrides[state] ?? state).replace('_', ' ');
}

function getTransitionActions(source?: string): TransitionAction[] {
  const t = getTerms(source);
  return [
    {
      target:      'in_review',
      label:       'Mark In Review',
      color:       '#f59e0b',
      icon:        '🔍',
      requireNote: false,
      confirmMsg:  'Mark this protocol as In Review? It will appear in the active review queue.',
      destructive: false,
    },
    {
      target:      'needs_changes',
      label:       'Needs Changes',
      color:       '#ef4444',
      icon:        '↩️',
      requireNote: true,
      confirmMsg:  'Return this protocol for changes. Please provide a reason so the author knows what to address.',
      destructive: true,
    },
    {
      target:      'approved',
      label:       t.signOff,
      color:       '#10B981',
      icon:        '✓',
      requireNote: true,
      confirmMsg:  `${t.signOff} this protocol? Once ${t.signOffVerb} it can be ${t.goLiveVerb} to the reporting workflow. Add any final notes below.`,
      destructive: false,
    },
    {
      target:      'published',
      label:       t.goLive,
      color:       '#0891B2',
      icon:        '🚀',
      requireNote: true,
      confirmMsg:  `${t.goLive} this protocol? It will become immediately available in the synoptic reporting workflow for all pathologists.`,
      destructive: false,
    },
  ];
}

// ─── LifecycleBadge ───────────────────────────────────────────────────────────

const LifecycleBadge: React.FC<{ state: TemplateLifecycleState; source?: string }> = ({ state, source }) => {
  const s = LIFECYCLE_STYLES[state] ?? LIFECYCLE_STYLES.draft;
  return (
    <span style={{
      fontSize: '12px', fontWeight: 700,
      padding: '4px 14px', borderRadius: '99px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {getStateLabel(state, source)}
    </span>
  );
};

// ─── Overlay modal shell ──────────────────────────────────────────────────────

const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 50000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    <div onClick={e => e.stopPropagation()} style={{
      width: '440px', background: '#1e293b', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 25px 50px rgba(0,0,0,0.6)', padding: '28px',
    }}>
      {children}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const TemplateRenderer: React.FC = () => {
  const navigate       = useNavigate();
  const { templateId } = useParams();
  const { user }       = useAuth();
  const currentUser    = user?.name ?? 'Unknown User';
  const { auditAndNotify, auditOnly } = useSynopticAudit();

  const registryEntry = PROTOCOL_REGISTRY.find(p => p.id === templateId) ?? null;
  const template = registryEntry
    ? { ...mockDcisTemplate, id: registryEntry.id, name: registryEntry.name, version: registryEntry.version, source: registryEntry.source, category: registryEntry.category }
    : mockDcisTemplate;

  // Source-aware terminology — derived once from the template's governing body
  const terms          = getTerms(template.source);
  const transActions   = getTransitionActions(template.source);

  // Always return to Review Queue
  const backTarget = '/configuration?tab=protocols&section=review';

  const ANSWERS_KEY = `ps_answers_${template.id}`;
  const STATE_KEY   = `ps_state_${template.id}`;

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [state,   setState]   = useState<TemplateLifecycleState>(
    (registryEntry?.status as TemplateLifecycleState | undefined) ?? 'draft'
  );
  const [isDirty, setIsDirty] = useState(false);

  // ── Confirmation modal state ───────────────────────────────────────────────
  const [confirmAction,  setConfirmAction]  = useState<TransitionAction | null>(null);
  const [confirmNote,    setConfirmNote]    = useState('');
  const [confirmReset,   setConfirmReset]   = useState(false);

  // ── Unsaved warning state ──────────────────────────────────────────────────
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);

  // ── Load persisted data ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) setState(raw as TemplateLifecycleState);
    } catch {}
  }, []);

  const persistAnswers = (next: AnswerMap) => {
    setAnswers(next);
    setIsDirty(true);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
  };

  const persistState = (next: TemplateLifecycleState) => {
    setState(next);
    setIsDirty(false);  // completed a transition — annotations no longer "unsaved"
    localStorage.setItem(STATE_KEY, next);
  };

  // ── Navigation guard ───────────────────────────────────────────────────────
  const navigateAway = useCallback((target: string) => {
    if (isDirty) {
      setPendingNavTarget(target);
      setShowLeaveWarning(true);
    } else {
      navigate(target);
    }
  }, [isDirty, navigate]);

  const handleLeaveConfirm = () => {
    setShowLeaveWarning(false);
    if (pendingNavTarget) navigate(pendingNavTarget);
  };

  // ── Answer handlers ────────────────────────────────────────────────────────
  const handleSingleChange = (questionId: string, optionId: string) => {
    const prev = answers[questionId];
    persistAnswers({ ...answers, [questionId]: optionId });
    auditOnly({ category: 'user', action: 'set_single_answer'as any, templateId: template.id, questionId, oldValue: prev, newValue: optionId });
  };

  const handleMultiChange = (questionId: string, optionId: string) => {
    const current   = (answers[questionId] as string[]) || [];
    const exists    = current.includes(optionId);
    const nextArray = exists ? current.filter(id => id !== optionId) : [...current, optionId];
    const prev      = answers[questionId];
    persistAnswers({ ...answers, [questionId]: nextArray });
    auditOnly({ category: 'user', action: exists ? 'remove_multi_answer' : 'add_multi_answer'as any, templateId: template.id, questionId, oldValue: prev, newValue: nextArray });
  };

  const handleTextChange = (questionId: string, value: string) => {
    const prev = answers[questionId];
    persistAnswers({ ...answers, [questionId]: value });
    auditOnly({ category: 'user', action: 'set_text_answer'as any, templateId: template.id, questionId, oldValue: prev, newValue: value });
  };

  // ── Lifecycle transition ───────────────────────────────────────────────────
  const openConfirm = (action: TransitionAction) => {
    setConfirmNote('');
    setConfirmAction(action);
  };

  const handleTransitionConfirm = () => {
    if (!confirmAction) return;
    const prev   = state;
    const target = confirmAction.target;
    const note   = confirmNote || undefined;

    persistState(target);
    setConfirmAction(null);
    setConfirmNote('');

    // Sync to PROTOCOL_REGISTRY so queue cards update immediately
    transitionTemplate(template.id, target as any, note, currentUser).catch(err =>
      console.error('[TemplateRenderer] transition failed:', err)
    );

    auditAndNotify({
      category:     'user',
      action:       'state_transition',
      templateId:   template.id,
      templateName: (template as any).name ?? (template as any).displayName ?? 'Unknown',
      stateFrom:    prev,
      stateTo:      target,
      note,
    });
  };

  const handleReset = () => {
    persistAnswers({});
    persistState('draft');
    setConfirmReset(false);
    transitionTemplate(template.id, 'draft' as any).catch(() => {});
    auditOnly({ user: 'System', category: 'system', action: 'reset_template' as any, templateId: template.id });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allowed      = ALLOWED_TRANSITIONS[state] ?? [];
  const isPublished  = state === 'published';

  const inputBase: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      backgroundImage: 'linear-gradient(to bottom, #0f172a 0%, #020617 100%)',
      color: '#f1f5f9', fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Nav bar ── */}
      <nav style={{
        padding: '12px 40px',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigateAway(backTarget)}
            style={{
              padding: '7px 14px', borderRadius: '7px',
              border: '1px solid #334155', background: 'rgba(255,255,255,0.04)',
              color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            ← Protocols
          </button>

          {/* Breadcrumb */}
          <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              onClick={() => navigateAway(backTarget)}
              style={{ cursor: 'pointer', color: '#64748b' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0891B2'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              Protocols
            </span>
            <span style={{ color: '#334155' }}>›</span>
            <span
              onClick={() => navigateAway(backTarget)}
              style={{ cursor: 'pointer', color: '#64748b' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0891B2'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              Review Queue
            </span>
            <span style={{ color: '#334155' }}>›</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
              {(template as any).name ?? (template as any).displayName ?? templateId}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDirty && (
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
              ● Unsaved annotations
            </span>
          )}
          <LifecycleBadge state={state} source={template.source} />
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ padding: '32px 40px 100px', maxWidth: '860px', margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>
            {(template as any).name ?? (template as any).displayName ?? templateId}
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '10px' }}>
            <span>Version {(template as any).version ?? (template as any).sourceVersion}</span>
            <span>•</span><span>{template.source}</span>
            <span>•</span><span>{registryEntry?.category ?? ""}</span>
          </div>
        </div>

        {/* ── Lifecycle action bar ── */}
        <div style={{
          padding: '16px 18px', marginBottom: '28px',
          borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          {isPublished ? (
            <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, textAlign: 'center' }}>
              🚀 This protocol has been {terms.goLiveVerb} and is live in the reporting workflow.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: 500 }}>
                LIFECYCLE TRANSITION
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {transActions.map(action => {
                  const isAllowed = allowed.includes(action.target);
                  const s = LIFECYCLE_STYLES[action.target];
                  return (
                    <button
                      key={action.target}
                      onClick={() => isAllowed && openConfirm(action)}
                      disabled={!isAllowed}
                      title={!isAllowed ? `Not available from "${state.replace('_', ' ')}" state` : undefined}
                      style={{
                        padding: '7px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
                        border: `1px solid ${isAllowed ? s.border : 'rgba(255,255,255,0.06)'}`,
                        background: isAllowed ? s.bg : 'rgba(255,255,255,0.02)',
                        color: isAllowed ? s.color : '#334155',
                        cursor: isAllowed ? 'pointer' : 'not-allowed',
                        opacity: isAllowed ? 1 : 0.45,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (isAllowed) e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={e => { if (isAllowed) e.currentTarget.style.opacity = '1'; }}
                    >
                      {action.icon} {action.label}
                    </button>
                  );
                })}

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

                {/* Reset */}
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{
                    padding: '7px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.06)', color: '#f87171',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                >
                  ↺ Reset
                </button>
              </div>

              {/* Linear flow hint */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(['draft', 'in_review', 'approved', 'published'] as TemplateLifecycleState[]).map((s, i, arr) => {
                  const sStyle = LIFECYCLE_STYLES[s];
                  const isCurrent = state === s;
                  const isPast = arr.indexOf(state) > i;
                  return (
                    <React.Fragment key={s}>
                      <span style={{
                        fontSize: '11px', fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? sStyle.color : isPast ? '#334155' : '#1e293b',
                        padding: '2px 8px', borderRadius: '99px',
                        background: isCurrent ? sStyle.bg : 'transparent',
                        border: `1px solid ${isCurrent ? sStyle.border : isPast ? '#1e293b' : '#1e293b'}`,
                        textTransform: 'capitalize',
                      }}>
                        {isPast ? '✓ ' : ''}{getStateLabel(s, template.source)}
                      </span>
                      {i < arr.length - 1 && (
                        <span style={{ color: '#1e293b', fontSize: '12px' }}>→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Template sections ── */}
        {template.sections.map((section: TemplateSection) => (
          <div key={section.id} style={{ marginBottom: '32px' }}>
            <div style={{
              fontSize: '16px', fontWeight: 700, color: '#f1f5f9',
              marginBottom: '16px', paddingBottom: '10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              {section.title}
            </div>

            {section.questions.map((q: Question) => (
              <div key={q.id} style={{
                marginBottom: '16px', padding: '16px',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
                  {q.text}
                </div>

                <InlineCommentThread questionId={q.id} templateId={template.id} currentUser={user?.name ?? 'Dr. Reviewer'} />

                {/* Single-select */}
                {isChoiceQuestion(q) && !q.multiple && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {q.options.map(opt => (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '7px', cursor: 'pointer',
                        border: `1px solid ${answers[q.id] === opt.id ? 'rgba(8,145,178,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        background: answers[q.id] === opt.id ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                      }}>
                        <input
                          type="radio" name={q.id} value={opt.id}
                          checked={answers[q.id] === opt.id}
                          onChange={() => handleSingleChange(q.id, opt.id)}
                          style={{ accentColor: '#0891B2', width: '14px', height: '14px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Multi-select */}
                {isChoiceQuestion(q) && q.multiple && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {q.options.map(opt => {
                      const current = (answers[q.id] as string[]) || [];
                      const checked = current.includes(opt.id);
                      return (
                        <label key={opt.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', borderRadius: '7px', cursor: 'pointer',
                          border: `1px solid ${checked ? 'rgba(8,145,178,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          background: checked ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.15s',
                        }}>
                          <input
                            type="checkbox" value={opt.id} checked={checked}
                            onChange={() => handleMultiChange(q.id, opt.id)}
                            style={{ accentColor: '#0891B2', width: '14px', height: '14px' }}
                          />
                          <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Text */}
                {q.type === 'text' && (
                  <input
                    type="text"
                    value={(answers[q.id] as string) || ''}
                    onChange={e => handleTextChange(q.id, e.target.value)}
                    placeholder="Enter value…"
                    style={{ ...inputBase, width: '100%', marginTop: '8px', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Transition confirmation modal ── */}
      {confirmAction && (
        <ModalOverlay onClose={() => setConfirmAction(null)}>
          {(() => {
            const s = LIFECYCLE_STYLES[confirmAction.target];
            return (
              <>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{confirmAction.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>
                  {confirmAction.label}
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: '1.6' }}>
                  {confirmAction.confirmMsg}
                </p>

                {confirmAction.requireNote && (
                  <textarea
                    value={confirmNote}
                    onChange={e => setConfirmNote(e.target.value)}
                    placeholder={confirmAction.destructive ? 'Reason for changes required (recommended)…' : 'Add notes (optional)…'}
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
                      fontSize: '13px', outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box', marginBottom: '16px',
                    }}
                  />
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setConfirmAction(null)}
                    style={{
                      padding: '9px 18px', borderRadius: '8px',
                      border: '1px solid #334155', background: 'transparent',
                      color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransitionConfirm}
                    style={{
                      padding: '9px 20px', borderRadius: '8px', border: 'none',
                      background: confirmAction.destructive ? '#ef4444' : s.bg,
                      color: confirmAction.destructive ? 'white' : s.color,
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      // border (dup): `1px solid ${s.border}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Confirm — {confirmAction.label}
                  </button>
                </div>
              </>
            );
          })()}
        </ModalOverlay>
      )}

      {/* ── Reset confirmation modal ── */}
      {confirmReset && (
        <ModalOverlay onClose={() => setConfirmReset(false)}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>
            Reset Protocol?
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px', lineHeight: '1.6' }}>
            This will clear all reviewer annotations and return the lifecycle state to
            <strong style={{ color: '#f1f5f9' }}> Draft</strong>.
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                padding: '9px 18px', borderRadius: '8px',
                border: '1px solid #334155', background: 'transparent',
                color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '9px 20px', borderRadius: '8px', border: 'none',
                background: '#ef4444', color: 'white',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
            >
              Reset to Draft
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Leave without saving warning ── */}
      {showLeaveWarning && (
        <ModalOverlay onClose={() => setShowLeaveWarning(false)}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>
            Unsaved Annotations
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 6px', lineHeight: '1.6' }}>
            You have unsaved reviewer annotations. Your answers are stored locally,
            but no lifecycle transition has been recorded.
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.6' }}>
            Leave anyway? Your annotations will be preserved but the review will
            remain in its current state.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowLeaveWarning(false)}
              style={{
                padding: '9px 18px', borderRadius: '8px',
                border: '1px solid #334155', background: 'transparent',
                color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Stay
            </button>
            <button
              onClick={handleLeaveConfirm}
              style={{
                padding: '9px 20px', borderRadius: '8px',
                border: '1px solid #f59e0b',
                background: 'rgba(245,158,11,0.12)', color: '#fbbf24',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
            >
              Leave Anyway
            </button>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
};
