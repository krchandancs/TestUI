// PathScribe — SidecarDisplay
// Right pane of the SidecarDrawer.
// Shows the ComputationalResult for the selected flag:
//   - Correlation header (concordance / discordance) if present
//   - Result data as a clean key/value table
//   - Actionability indicator
//   - Timestamp

import React from 'react';
import { Flag } from '@/services/flags/IFlagService';
import { ComputationalResult, ExtractionProvenance, ResultStatus, ActionabilityLevel } from '@/types/smarttag.types';
import type { AiSuggestion } from '@/pages/SynopticReportPage/components/RightSynopticPanel';
import { COMP_AUDIT } from '@/constants/computationalActions';
import { useAuditLog } from '@/components/Audit/useAuditLog';
import { caseService } from '@/services';
import { useComputationalResult } from '@/hooks/useComputationalResult';

// ─── Correlation header ───────────────────────────────────────────────────────

const CONCORDANCE_CONFIG = {
  concordant:    { color: '#0F6E56', bg: 'rgba(15,110,86,0.08)',   label: 'Concordant',    hint: 'Computational findings align with morphology.' },
  discordant:    { color: '#A32D2D', bg: 'rgba(163,45,45,0.08)',   label: 'Discordant',    hint: 'Computational findings differ from morphology — review required.' },
  indeterminate: { color: '#BA7517', bg: 'rgba(186,117,23,0.08)',  label: 'Indeterminate', hint: 'Concordance could not be established.' },
};

const CorrelationHeader: React.FC<{ concordance: ComputationalResult['concordance'] }> = ({ concordance }) => {
  if (!concordance) return null;
  const cfg = CONCORDANCE_CONFIG[concordance];
  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          10,
      padding:      '10px 14px',
      background:   cfg.bg,
      borderBottom: `1px solid ${cfg.color}33`,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: cfg.color, flexShrink: 0, marginTop: 4,
      }} />
      <div>
        <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--msg-text)', marginLeft: 6 }}>
          {cfg.hint}
        </span>
      </div>
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:              { color: '#888780', label: 'Pending'               },
  PRELIMINARY:          { color: '#BA7517', label: 'Preliminary'           },
  FINAL_ACTIONABLE:     { color: '#A32D2D', label: 'Final — action required'},
  FINAL_NON_ACTIONABLE: { color: '#0F6E56', label: 'Final'                 },
};

function statusKey(result: ComputationalResult): string {
  if (result.status === ResultStatus.PENDING)     return 'PENDING';
  if (result.status === ResultStatus.PRELIMINARY) return 'PRELIMINARY';
  return result.actionability === ActionabilityLevel.ACTIONABLE
    ? 'FINAL_ACTIONABLE'
    : 'FINAL_NON_ACTIONABLE';
}

// ─── Result data table ────────────────────────────────────────────────────────

const ResultTable: React.FC<{ data: ComputationalResult['data'] }> = ({ data }) => {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return null;

  return (
    <div className="fm-flag-list" style={{ padding: '8px 0', gap: 3 }}>
      {entries.map(([key, value]) => (
        <div key={key} className="fm-flag-card" style={{
          gridTemplateColumns: '40% 1fr',
          gap: 8,
          padding: '8px 12px',
        }}>
          <span className="fm-flag-desc" style={{ whiteSpace: 'normal', overflow: 'visible' }}>
            {key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()}
          </span>
          <span className="fm-flag-name" style={{ fontWeight: 500, whiteSpace: 'normal' }}>
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};


// ─── Extraction provenance badge ──────────────────────────────────────────────

const METHOD_LABELS: Record<ExtractionProvenance['method'], string> = {
  'llm':       'AI extracted',
  'ocr+llm':   'OCR + AI extracted',
  'hl7-parse': 'HL7 parsed',
  'pdf-parse': 'PDF parsed',
  'native':    'Native discrete',
};

const ExtractionBadge: React.FC<{ extraction: ExtractionProvenance }> = ({ extraction }) => {
  const pct       = Math.round(extraction.confidence * 100);
  const isHigh    = pct >= 95;
  const isMedium  = pct >= 80 && pct < 95;
  const color     = isHigh ? '#0F6E56' : isMedium ? '#BA7517' : '#A32D2D';
  const label     = METHOD_LABELS[extraction.method] ?? extraction.method;

  return (
    <div
      title={`Source: ${extraction.sourceText.slice(0, 200)}${extraction.sourceText.length > 200 ? '…' : ''}`}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        marginTop:    14,
        padding:      '7px 10px',
        borderRadius: 6,
        background:   `${color}0d`,
        border:       `0.5px solid ${color}44`,
      }}
    >
      {/* AI icon */}
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color }}>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      </svg>

      {/* Label */}
      <span style={{ fontSize: 11, color, fontWeight: 500, flex: 1 }}>
        {label}
        {extraction.modelId && (
          <span style={{ fontWeight: 400, opacity: 0.75 }}> · {extraction.modelId}</span>
        )}
      </span>

      {/* Confidence bar */}
      {(extraction.method === 'llm' || extraction.method === 'ocr+llm') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 48, height: 4, borderRadius: 99,
            background: `${color}22`, overflow: 'hidden',
          }}>
            <div style={{
              width:        `${pct}%`,
              height:       '100%',
              background:   color,
              borderRadius: 99,
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 28 }}>
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
};


// ─── AI Concordance indicator ─────────────────────────────────────────────────
// Compares discrete computational result data against the AI pre-fill for
// the mapped synoptic fields. Shows agree / differ / pending states.

interface ConcordanceProps {
  flag:          Flag;
  result:        ComputationalResult;
  aiSuggestions: Record<string, AiSuggestion>;
}

function deriveAgreement(
  result: ComputationalResult,
  aiSuggestions: Record<string, AiSuggestion>,
  synopticFieldIds: string[]
): 'agrees' | 'differs' | 'no-data' {
  const relevantSugs = synopticFieldIds
    .map(id => aiSuggestions[id])
    .filter(Boolean);

  if (relevantSugs.length === 0) return 'no-data';

  const resultText = Object.values(result.data)
    .filter(Boolean)
    .map(v => String(v).toLowerCase())
    .join(' ');

  // Check each AI suggestion value against the result data
  const agreements = relevantSugs.map(sug => {
    const sugValue = (Array.isArray(sug.value) ? sug.value.join(' ') : sug.value).toLowerCase();
    // Flexible match — look for key terms from suggestion in result or vice versa
    const terms = sugValue.split(/[\s_-]+/).filter(t => t.length > 3);
    return terms.some(term => resultText.includes(term));
  });

  const agreeCount = agreements.filter(Boolean).length;
  if (agreeCount === 0)                    return 'differs';
  if (agreeCount === relevantSugs.length)  return 'agrees';
  return 'agrees'; // partial match counts as agreement
}

const ConcordanceIndicator: React.FC<ConcordanceProps> = ({ flag, result, aiSuggestions }) => {
  const fieldIds = flag.synopticFieldIds;
  if (!fieldIds?.length) return null;
  if (result.status !== ResultStatus.FINAL && result.status !== ResultStatus.PRELIMINARY) return null;

  const agreement = deriveAgreement(result, aiSuggestions, fieldIds);

  if (agreement === 'no-data') return null;

  const config = {
    agrees: {
      color:  '#34d399',
      bg:     'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.25)',
      icon:   '✓',
      label:  'Agrees with AI pre-fill',
      hint:   "The discrete result is consistent with the AI's synoptic suggestions.",
    },
    differs: {
      color:  '#fbbf24',
      bg:     'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.3)',
      icon:   '⚠',
      label:  'Differs from AI pre-fill',
      hint:   "The discrete result may not match the AI's suggestions — review the relevant synoptic fields.",
    },
  }[agreement];

  // Find the highest AI confidence among mapped fields for display
  const relevantConfs = fieldIds
    .map(id => aiSuggestions[id]?.confidence)
    .filter((c): c is number => typeof c === 'number');
  const maxConf = relevantConfs.length ? Math.max(...relevantConfs) : null;

  return (
    <div
      title={config.hint}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        marginTop:    10,
        padding:      '7px 10px',
        borderRadius: 6,
        background:   config.bg,
        border:       `0.5px solid ${config.border}`,
        cursor:       'default',
      }}
    >
      <span style={{ fontSize: 13, color: config.color, flexShrink: 0 }}>{config.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: config.color }}>
          {config.label}
        </span>
        {maxConf !== null && (
          <span style={{ fontSize: 11, color: 'var(--msg-muted)', marginLeft: 8 }}>
            AI field confidence: {maxConf}%
          </span>
        )}
      </div>
      {/* Mini confidence bar for the AI field suggestion */}
      {maxConf !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: 40, height: 3, borderRadius: 99, background: `${config.color}22`, overflow: 'hidden' }}>
            <div style={{ width: `${maxConf}%`, height: '100%', background: config.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: config.color }}>{maxConf}%</span>
        </div>
      )}
    </div>
  );
};

// ─── Display ──────────────────────────────────────────────────────────────────

interface Props {
  flag:           Flag;
  caseId:         string;
  onResultLoaded?: (flagId: string, result: ComputationalResult) => void;
  /**
   * AI field suggestions from RightSynopticPanel.
   * When flag.synopticFieldIds are set, we compare the discrete result
   * against the AI pre-fill and show a concordance indicator.
   */
  aiSuggestions?: Record<string, AiSuggestion>;
}

const SidecarDisplay: React.FC<Props> = ({ flag, caseId, onResultLoaded, aiSuggestions }) => {
  const { log } = useAuditLog();
  const [specimenLabel, setSpecimenLabel] = React.useState<string | null>(null);

  // Resolve specimen label from specimenId on the applied flag
  React.useEffect(() => {
    const specimenId = (flag as any).specimenId;
    if (!specimenId || !caseId) { setSpecimenLabel(null); return; }
    caseService.getCase(caseId).then(caseData => {
      if (!caseData) return;
      const sp = ((caseData as any).specimens ?? []).find((s: any) => s.id === specimenId);
      if (sp) setSpecimenLabel(`${sp.label}: ${sp.description}`);
    }).catch(() => {});
  }, [flag, caseId]);
  const { result, loading, error } = useComputationalResult(flag, caseId);

  // Audit concordance viewed when result loads and concordance is computable
  const prevConcordance = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!result) return;
    const agree = (result.concordance as any)?.agreesWithMorphology;
    const label = agree === true ? 'agrees' : agree === false ? 'differs' : null;
    if (label && label !== prevConcordance.current) {
      prevConcordance.current = label;
      log(COMP_AUDIT.USE_CONCORDANCE_VIEWED, { caseId, flagId: flag.id, agreement: label });
    }
  }, [result, aiSuggestions]);

  // Bubble result up so Navigator can read status without refetching.
  React.useEffect(() => {
    if (result && onResultLoaded) onResultLoaded(flag.id, result);
  }, [result, flag.id, onResultLoaded]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !result) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <span style={{ fontSize: 13, color: 'var(--msg-muted)' }}>Loading result…</span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !result) {
    return (
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(163,45,45,0.08)',
          border: '0.5px solid rgba(163,45,45,0.3)',
          fontSize: 13, color: '#A32D2D',
        }}>
          Unable to load result: {error}
        </div>
      </div>
    );
  }

  const cfg    = result ? STATUS_CONFIG[statusKey(result)] : null;
  const ts     = result?.resultedAt
    ? new Date(result.resultedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>

      {/* Correlation header */}
      {result?.concordance && <CorrelationHeader concordance={result.concordance} />}

      <div style={{ padding: '14px 16px' }}>

        {/* Flag name + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <div className="fm-flag-name" style={{ fontSize: 15 }}>{flag.name}</div>
            {flag.description && (
              <div className="fm-flag-desc" style={{ marginTop: 3, whiteSpace: 'normal' }}>
                {flag.description}
              </div>
            )}
            {/* Specimen assignment badge */}
            <span className="comp-specimen-badge">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3.5 6h5M6 3.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {specimenLabel ?? 'All specimens'}
            </span>
          </div>
          {cfg && (
            <span style={{
              flexShrink:   0,
              fontSize:     11,
              fontWeight:   500,
              color:        cfg.color,
              background:   `${cfg.color}18`,
              border:       `0.5px solid ${cfg.color}44`,
              padding:      '3px 9px',
              borderRadius: 99,
              whiteSpace:   'nowrap',
            }}>
              {cfg.label}
            </span>
          )}
        </div>

        {/* Result data */}
        {result?.data && <ResultTable data={result.data} />}

        {/* No data yet */}
        {result && (!result.data || !Object.keys(result.data).length) && (
          <div style={{ fontSize: 13, color: 'var(--msg-muted)', marginTop: 8 }}>
            Result received — no discrete data available yet.
          </div>
        )}

        {/* AI concordance — compares discrete result against AI pre-fill */}
        {result && aiSuggestions && Object.keys(aiSuggestions).length > 0 && (
          <ConcordanceIndicator
            flag={flag}
            result={result}
            aiSuggestions={aiSuggestions}
          />
        )}

        {/* Timestamp */}
        {ts && (
          <div className="fm-flag-desc" style={{ marginTop: 14, paddingLeft: 12 }}>Resulted {ts}</div>
        )}

        {/* AI extraction provenance */}
        {result?.extraction && (
          <ExtractionBadge extraction={result.extraction} />
        )}
      </div>
    </div>
  );
};

export default SidecarDisplay;
