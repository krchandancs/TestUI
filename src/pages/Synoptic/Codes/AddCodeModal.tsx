// src/pages/Synoptic/Codes/AddCodeModal.tsx
// Navy design system — matches FlagManagerModal.
// Live terminology search via NLM API (codeSearchService).
// Left panel: applied codes per case/specimen with strikethrough/undo.
// Right panel: system tabs + hierarchy filters + live search.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { callAi } from '@/services/aiIntegration/aiProviderService';
import '../../../pathscribe.css';
import type { MedicalCode } from '../synopticTypes';
import { searchCodes, type CodeResult, type SnomedFilter } from './codeSearchService';
import { getOrganisationByHospitalId, type CodingSystem } from '@/services/organisation/organisationService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpecimenOption { index: number; id: number; specimenId?: string | null; name: string; }

export interface AiCodeSuggestion {
  code: string;
  display: string;
  system: string;
  confidence: number;
  rationale: string;
  rvu?: number | null;
}

export interface AddCodeModalProps {
  existingCodes: MedicalCode[];
  allSpecimens: SpecimenOption[];
  activeSpecimenIndex?: number;  // reserved for future per-specimen default targeting
  onAddToSpecimens: (codes: Omit<MedicalCode, 'id' | 'source'>[], specimenIndices: number[]) => void;
  onClose: () => void;
  originHospitalId?: string;
  /** Optional — if provided, enables AI code suggestions */
  caseText?: { gross: string; microscopic: string; ancillary: string };
  synopticAnswers?: Record<string, string | string[]>;
  templateName?: string;
  /** Tier 1: codes pre-derived from CAP template option metadata */
  synopticDerivedCodes?: AiCodeSuggestion[];
  /** Whether Orchestrator/narrative mode is active */
  narrativeText?: string;
}

type CodeSystem = 'SNOMED' | 'ICD10' | 'ICD11' | 'LOINC' | 'ICDO' | 'CPT' | 'OPCS4';

interface PendingCode {
  code: string;
  display: string;
  system: string;
  specimenIndex: number | null;
  pendingDelete: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Full registry of all supported coding systems
// Visibility per site is controlled by organisationService.Site.codingSystems
const ALL_SYSTEMS: { id: CodeSystem; label: string; accent: string }[] = [
  { id: 'SNOMED', label: 'SNOMED CT', accent: '#0891B2' },
  { id: 'ICD10',  label: 'ICD-10',   accent: '#7c3aed' },
  { id: 'ICD11',  label: 'ICD-11',   accent: '#0369a1' },
  { id: 'LOINC',  label: 'LOINC',    accent: '#0f766e' },
  { id: 'ICDO',   label: 'ICD-O',    accent: '#b45309' },
  { id: 'CPT',    label: 'CPT',      accent: '#7c3aed' },
  { id: 'OPCS4',  label: 'OPCS-4',   accent: '#0891B2' },
];

const SNOMED_FILTERS: { id: SnomedFilter; label: string; hint: string }[] = [
  { id: 'all',       label: 'All',        hint: 'All SNOMED concepts' },
  { id: 'morphology',label: 'Morphology', hint: 'Diagnoses & structural changes' },
  { id: 'anatomy',   label: 'Anatomy',    hint: 'Body structures & sites' },
  { id: 'specimen',  label: 'Specimen',   hint: 'Specimen types' },
  { id: 'organism',  label: 'Organism',   hint: 'Infectious agents' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoCode = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 6l-3 2 3 2M11 6l3 2-3 2M9 4l-2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IcoCase = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IcoSpec = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="8" cy="8" r="2" fill="currentColor"/>
  </svg>
);

const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoUndo = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M3 7V3L1 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3C3 3 5 1 8 1C11.866 1 15 4.134 15 8C15 11.866 11.866 15 8 15C4.134 15 1 11.866 1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const AddCodeModal: React.FC<AddCodeModalProps> = ({
  existingCodes, allSpecimens, onAddToSpecimens, onClose,
  caseText, synopticAnswers, templateName, synopticDerivedCodes, narrativeText,
  originHospitalId,
}) => {
  // ── Site coding config ────────────────────────────────────────────────────
  // Coding systems shown are driven by site config from organisationService.
  // This replaces any hardcoded locale/country checks.
  // When backend is ready: replace with useSessionSiteConfig() hook.
  const siteOrg = React.useMemo(() => {
    return getOrganisationByHospitalId(originHospitalId ?? 'HOSP-001');
  }, [originHospitalId]);
  const siteCodingSystems = React.useMemo<CodingSystem[]>(() => {
    const systems = siteOrg?.sites?.[0]?.codingSystems;
    return systems?.length ? systems : ['SNOMED', 'ICD10', 'ICD11', 'LOINC', 'ICDO', 'CPT'] as CodingSystem[];
  }, [siteOrg]);
  const SYSTEMS = ALL_SYSTEMS.filter(s => siteCodingSystems.includes(s.id));
  const isUK = siteOrg?.sites?.[0]?.defaultLocale === 'en-GB';

  const [system,       setSystem]       = useState<CodeSystem>('SNOMED');
  const [snomedFilter, setSnomedFilter] = useState<SnomedFilter>('morphology');
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState<CodeResult[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [focused,      setFocused]      = useState(-1);
  const [target,       setTarget]       = useState<number | null>(null);
  const [applied,      setApplied]      = useState<PendingCode[]>(() =>
    existingCodes.map(c => {
      // Resolve specimenId back to specimenIndex so left panel groups correctly
      const specOption = (c as any).specimenId
        ? allSpecimens.find(s => s.specimenId === (c as any).specimenId)
        : null;
      return {
        code:          c.code,
        display:       c.display,
        system:        c.system,
        specimenIndex: specOption ? specOption.index : null,
        pendingDelete: false,
      };
    })
  );
  const [isDirty, setIsDirty] = useState(false);
  const [aiSuggestions,    setAiSuggestions]    = useState<AiCodeSuggestion[]>([]);
  const [aiLoading,        setAiLoading]        = useState(false);
  const [aiError,          setAiError]          = useState<string | null>(null);
  const [aiRan,            setAiRan]            = useState(false);
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);


  const [saving,       setSaving]       = useState(false);
  const [dragCode,     setDragCode]     = useState<PendingCode | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<number | null | 'none'>('none'); // null=case, number=spec, 'none'=not dragging
  const [contextMenu,  setContextMenu]  = useState<{ entry: PendingCode; x: number; y: number } | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const sysInfo = SYSTEMS.find(s => s.id === system) ?? SYSTEMS[0];

  // ── Live search with debounce ─────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const filter = system === 'SNOMED' ? snomedFilter : 'all';
      const data = await searchCodes(system, query, filter);
      setResults(data);
      setLoading(false);
      setFocused(-1);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, system, snomedFilter]);

  // ── Applied code helpers ──────────────────────────────────────────────────

  const caseApplied           = applied.filter(c => c.specimenIndex === null);
  const activeCaseApplied     = caseApplied.filter(c => !c.pendingDelete);
  const specimenApplied       = (idx: number) => applied.filter(c => c.specimenIndex === idx);
  const activeSpecimenApplied = (idx: number) => specimenApplied(idx).filter(c => !c.pendingDelete);
  const totalActive           = applied.filter(c => !c.pendingDelete).length;

  // ── Add / remove / undo ───────────────────────────────────────────────────

  const addCode = useCallback((r: CodeResult) => {
    const alreadyActive = applied.some(
      c => c.code === r.code && c.specimenIndex === target && !c.pendingDelete
    );
    if (alreadyActive) return;
    const existing = applied.find(c => c.code === r.code && c.specimenIndex === target);
    if (existing) {
      setApplied(prev => prev.map(c =>
        c.code === r.code && c.specimenIndex === target ? { ...c, pendingDelete: false } : c
      ));
    } else {
      setApplied(prev => [...prev, {
        code: r.code, display: r.display, system: r.system,
        specimenIndex: target, pendingDelete: false,
      }]);
    }
    setIsDirty(true);
  }, [applied, target]);

  const removeCode = useCallback((code: string, specimenIndex: number | null) => {
    setApplied(prev => prev.map(c =>
      c.code === code && c.specimenIndex === specimenIndex ? { ...c, pendingDelete: true } : c
    ));
    setIsDirty(true);
  }, []);

  const undoRemove = useCallback((code: string, specimenIndex: number | null) => {
    setApplied(prev => prev.map(c =>
      c.code === code && c.specimenIndex === specimenIndex ? { ...c, pendingDelete: false } : c
    ));
    setIsDirty(true);
  }, []);

  // Move a code from one specimen/case to another
  const moveCode = useCallback((entry: PendingCode, toSpecimenIndex: number | null) => {
    if (entry.specimenIndex === toSpecimenIndex) return; // already there
    setApplied(prev => prev.map(c =>
      c.code === entry.code && c.specimenIndex === entry.specimenIndex
        ? { ...c, specimenIndex: toSpecimenIndex, pendingDelete: false }
        : c
    ));
    setIsDirty(true);
    setContextMenu(null);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  // ── AI Code Generation ───────────────────────────────────────────────────
  const generateAiCodes = useCallback(async () => {
    if (!caseText) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const answersText = synopticAnswers
        ? Object.entries(synopticAnswers)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n')
        : 'No synoptic answers available';

      const { text: raw } = await callAi({
        system: isUK
          ? 'You are a pathology coding specialist with expertise in NHS surgical pathology coding — SNOMED CT, ICD-10, ICD-O, and OPCS-4. Return only valid JSON — no markdown, no preamble.'
          : 'You are a pathology coding specialist with expertise in surgical pathology CPT, ICD-10, SNOMED CT, and ICD-O coding. Return only valid JSON — no markdown, no preamble.',
        prompt: isUK
          ? `Suggest appropriate medical codes for this NHS pathology case. Include diagnostic codes and OPCS-4 procedure codes.

TEMPLATE: ${templateName ?? 'Unknown'}
${narrativeText ? `NARRATIVE REPORT (primary source):\n${narrativeText}\n\nSUPPORTING:` : ''}
GROSS: ${caseText.gross}
MICROSCOPIC: ${caseText.microscopic}
ANCILLARY: ${caseText.ancillary}
SYNOPTIC ANSWERS:
${answersText}

Return a JSON array covering:

DIAGNOSTIC CODES (ICD-10, SNOMED CT, ICD-O):
- Primary diagnosis ICD-10 code (UK 5th edition)
- SNOMED CT morphology code (UK SNOMED release)
- ICD-O topography and morphology codes if applicable

PROCEDURE CODES (OPCS-4):
- Primary surgical pathology procedure code
- Additional procedures if applicable (IHC, molecular)

Format:
[
  {
    "code": "C20",
    "display": "Malignant neoplasm of rectum",
    "system": "ICD10",
    "confidence": 95,
    "rationale": "Rectal adenocarcinoma primary diagnosis",
    "rvu": null
  },
  {
    "code": "Y76.8",
    "display": "Examination of specimen from rectum",
    "system": "OPCS4",
    "confidence": 92,
    "rationale": "Histological examination of resection specimen",
    "rvu": null
  }
]

Rules:
- system must be one of: ICD10, SNOMED, ICDO, LOINC, OPCS4
- Do NOT include CPT codes — not used in NHS
- confidence 0-100, rationale ≤12 words
- Return 4-8 codes total — MUST include at least one SNOMED morphology code`
          : `Suggest appropriate medical codes for this pathology case. Include BOTH diagnostic codes AND procedure (CPT) codes.

TEMPLATE: ${templateName ?? 'Unknown'}
${narrativeText ? `NARRATIVE REPORT (primary source):
${narrativeText}

SUPPORTING:` : ''}
GROSS: ${caseText.gross}
MICROSCOPIC: ${caseText.microscopic}
ANCILLARY: ${caseText.ancillary}
SYNOPTIC ANSWERS:
${answersText}

Return a JSON array covering:

DIAGNOSTIC CODES (ICD-10, SNOMED CT, ICD-O):
- Primary diagnosis ICD-10 code
- SNOMED CT morphology code
- ICD-O topography and morphology codes if applicable

PROCEDURE CODES (CPT):
- Surgical pathology level (88300-88309) based on specimen complexity
- Special stains (88312-88314) if mentioned in ancillary
- IHC codes (88342 per antibody, 88341 for each additional) if IHC performed
- Molecular/genomic codes (81275, 81479 etc.) if molecular studies performed
- Include RVU value for each CPT code

Format:
[
  {
    "code": "C50.412",
    "display": "Malignant neoplasm of upper-outer quadrant of left female breast",
    "system": "ICD10",
    "confidence": 95,
    "rationale": "Left breast invasive carcinoma upper outer quadrant",
    "rvu": null
  },
  {
    "code": "88307",
    "display": "Surgical pathology, gross and microscopic examination — Breast, mastectomy",
    "system": "CPT",
    "confidence": 97,
    "rationale": "Total mastectomy specimen with lymph node dissection",
    "rvu": 4.44
  }
]

Rules:
- system must be one of: ICD10, SNOMED, ICDO, LOINC, CPT
- confidence 0-100
- rationale ≤12 words
- rvu: include the standard RVU value for CPT codes, null for others
- Return 6-12 codes total — MUST include at least one SNOMED morphology code
- SNOMED morphology example: {"code":"413448000","display":"Invasive carcinoma of breast, no special type","system":"SNOMED","confidence":95,"rationale":"Primary diagnosis morphology","rvu":null}
- Only include codes you are highly confident are correct
- For CPT 88307 vs 88309: mastectomy with lymph nodes = 88307, complex cases = 88309`,
        maxTokens: 1200,
      });

      const clean = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const parsed: AiCodeSuggestion[] = JSON.parse(clean);
      const filtered = Array.isArray(parsed)
        ? parsed.filter(s => siteCodingSystems.includes(s.system as CodeSystem))
        : [];
      setAiSuggestions(filtered);
      setAiRan(true);
    } catch (e: any) {
      setAiError(e?.message ?? 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  }, [caseText, synopticAnswers, templateName]);

  // Auto-run on open — after generateAiCodes is defined
  // Tier 1: use pre-derived synoptic codes immediately
  // Tier 2/3: auto-call AI so codes are ready when modal opens
  React.useEffect(() => {
    if (synopticDerivedCodes?.length) {
      setAiSuggestions(synopticDerivedCodes);
      setAiRan(true);
    } else if (caseText && !aiRan) {
      // Auto-run AI once on open — aiRan guard prevents re-running on re-render
      generateAiCodes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(() => {
    setSaving(true);
    // Include codes that are new OR have been moved to a different specimen
    const toAdd = applied.filter(c => {
      if (c.pendingDelete) return false;
      const original = existingCodes.find(e => e.code === c.code && e.system === c.system);
      if (!original) return true; // new code
      // Check if specimenId changed — if so, it's a move and needs saving
      const originalSpecId = (original as any).specimenId ?? null;
      const newSpecOption  = c.specimenIndex !== null
        ? allSpecimens.find(s => s.index === c.specimenIndex)
        : null;
      const newSpecId = newSpecOption ? (newSpecOption as any).specimenId ?? String(newSpecOption.id) : null;
      return originalSpecId !== newSpecId; // moved
    });
    // Build complete resolved code list — source of truth for the parent
    const allActiveCodes = applied
      .filter(c => !c.pendingDelete)
      .map(c => {
        const sp = c.specimenIndex !== null
          ? allSpecimens.find(s => s.index === c.specimenIndex)
          : null;
        return {
          code:       c.code,
          display:    c.display,
          system:     c.system as MedicalCode['system'],
          specimenId: sp ? ((sp as any).specimenId ?? String(sp.id)) : null,
        };
      });

    const hasDeletions = applied.some(c => c.pendingDelete);
    if (toAdd.length > 0 || hasDeletions) {
      const specimenIndices = [...new Set(toAdd.map(c => c.specimenIndex ?? 0))];
      onAddToSpecimens(allActiveCodes, specimenIndices);
    } else {
      onClose();
    }
    }, [applied, existingCodes, onAddToSpecimens, onClose]);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && focused >= 0 && results[focused]) addCode(results[focused]);
    if (e.key === 'Escape') onClose();
  };

  // ── Pending counts for footer ─────────────────────────────────────────────

  const toAddCount    = applied.filter(c => !c.pendingDelete && !existingCodes.some(e => e.code === c.code)).length;
  const toRemoveCount = applied.filter(c => c.pendingDelete).length;

  // ── CodeChip — draggable + right-click context menu ──────────────────────

  // Grabber icon SVG
  const IcoGrab = () => (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
      <circle cx="3" cy="2.5" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="2.5" r="1.2" fill="currentColor"/>
      <circle cx="3" cy="7"   r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7"   r="1.2" fill="currentColor"/>
      <circle cx="3" cy="11.5" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="11.5" r="1.2" fill="currentColor"/>
    </svg>
  );

  const CodeChip: React.FC<{ entry: PendingCode }> = ({ entry }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
      <div
        className={`fm-flag-chip${entry.pendingDelete ? ' deleted' : ''}`}
        draggable={!entry.pendingDelete}
        onDragStart={e => {
          setDragCode(entry);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => { setDragCode(null); setDragOverTarget('none'); }}
        onContextMenu={e => {
          e.preventDefault();
          if (!entry.pendingDelete) setContextMenu({ entry, x: e.clientX, y: e.clientY });
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor:     entry.pendingDelete ? 'default' : 'grab',
          background: hovered && !entry.pendingDelete ? 'rgba(56,189,248,0.08)' : undefined,
          borderColor: hovered && !entry.pendingDelete ? 'rgba(56,189,248,0.3)' : undefined,
          transition: 'background 0.12s, border-color 0.12s',
        }}
      >
        {/* Grabber — only shown when not deleted */}
        {!entry.pendingDelete && (
          <span style={{ display: 'flex', alignItems: 'center', marginRight: 2, color: '#94a3b8' }}>
            <IcoGrab />
          </span>
        )}
        <span className={`fm-flag-chip-name${entry.pendingDelete ? ' strikethrough' : ''}`}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.65, marginRight: 4 }}>{entry.code}</span>
          {entry.display}
        </span>
        {entry.pendingDelete ? (
          <button className="fm-chip-undo-btn" onClick={() => undoRemove(entry.code, entry.specimenIndex)} title="Undo removal">
            <IcoUndo />
          </button>
        ) : (
          <button className="fm-chip-remove-btn" onClick={() => removeCode(entry.code, entry.specimenIndex)} title="Remove code">
            <IcoTrash />
          </button>
        )}
      </div>
    );
  };

  // ── Drop target wrapper ───────────────────────────────────────────────────

  const DropZone: React.FC<{ specimenIndex: number | null; children: React.ReactNode }> = ({ specimenIndex, children }) => {
    const isOver = dragCode !== null && dragOverTarget === specimenIndex;
    const isSame = dragCode?.specimenIndex === specimenIndex;
    return (
      <div
        onDragOver={e => { e.preventDefault(); if (!isSame) setDragOverTarget(specimenIndex); }}
        onDragLeave={() => setDragOverTarget('none')}
        onDrop={e => {
          e.preventDefault();
          if (dragCode && !isSame) moveCode(dragCode, specimenIndex);
          setDragOverTarget('none');
        }}
        style={{
          borderRadius: 8,
          border: isOver && !isSame ? '1.5px dashed #38bdf8' : '1.5px solid transparent',
          background: isOver && !isSame ? 'rgba(8,145,178,0.08)' : 'transparent',
          transition: 'all 0.12s',
          padding: '2px 0',
          marginBottom: 4,
        }}
      >
        {children}
      </div>
    );
  };

  // ── Context menu ──────────────────────────────────────────────────────────

  const ContextMenu = contextMenu ? (
    <div
      onClick={() => setContextMenu(null)}
      className="ps-overlay" style={{ zIndex: 99999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: Math.min(contextMenu.x, window.innerWidth - 220),
          top:  Math.min(contextMenu.y, window.innerHeight - 200),
          width: 210,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          zIndex: 100000,
        }}
      >
        <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Move to
        </div>

        {/* Case Level */}
        {contextMenu.entry.specimenIndex !== null && (
          <button
            onClick={() => moveCode(contextMenu.entry, null)}
            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <IcoCase />
            Case Level
          </button>
        )}

        {/* Specimens */}
        {allSpecimens
          .filter(sp => sp.index !== contextMenu.entry.specimenIndex)
          .map(sp => (
            <button
              key={sp.index}
              onClick={() => moveCode(contextMenu.entry, sp.index)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <IcoSpec />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Sp {sp.id}:</span> {sp.name}
              </span>
            </button>
          ))
        }
      </div>
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div data-capture-hide="true" className="ps-overlay" onClick={onClose}>
      <div className="ps-research-modal fm-modal" style={{ maxWidth: 1100, width: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="ps-research-header">
          <div>
            <div className="fm-eyebrow">Code Manager</div>
            <div className="fm-title-row">
              <IcoCode />
              <h2 className="fm-title">Codes</h2>
              {totalActive > 0 && (
                <span className="fm-active-badge">{totalActive} active</span>
              )}
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 18, cursor: 'pointer', padding: '2px 6px', lineHeight: 1, flexShrink: 0 }} aria-label="Close" onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >✕</button>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── LEFT PANEL ── */}
          <div className="fm-left-panel" style={{ minWidth: 260, maxWidth: 300, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Applied Codes</div>
            {dragCode && (
              <div style={{ fontSize: 10, color: '#38bdf8', marginBottom: 8, fontStyle: 'italic' }}>
                Drop on a target to move · Right-click for menu
              </div>
            )}

            {/* Case level */}
            <DropZone specimenIndex={null}>
              <button
                className={`fm-target-row${target === null ? ' active' : ''}`}
                onClick={() => setTarget(null)}
              >
                <IcoCase />
                <span style={{ flex: 1 }}>Case Level</span>
                {activeCaseApplied.length > 0 && (
                  <span className="fm-count-badge">{activeCaseApplied.length}</span>
                )}
              </button>
              {caseApplied.map(entry => <CodeChip key={`case-${entry.code}`} entry={entry} />)}
              {caseApplied.length === 0 && (
                <div className="fm-no-flags-note">No case-level codes</div>
              )}
            </DropZone>

            <div className="fm-divider" />

            {/* Specimens */}
            {allSpecimens.map(sp => {
              const spApplied   = specimenApplied(sp.index);
              const activeCount = activeSpecimenApplied(sp.index).length;
              return (
                <DropZone key={sp.index} specimenIndex={sp.index}>
                  <button
                    className={`fm-target-row${target === sp.index ? ' active' : ''}`}
                    onClick={() => setTarget(sp.index)}
                  >
                    <IcoSpec />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>Sp {sp.id}:</span>{' '}{sp.name}
                    </span>
                    {activeCount > 0 && (
                      <span className="fm-count-badge">{activeCount}</span>
                    )}
                  </button>
                  {spApplied.map(entry => <CodeChip key={`sp${sp.index}-${entry.code}`} entry={entry} />)}
                  {spApplied.length === 0 && (
                    <div className="fm-no-flags-note">No codes applied — drag here or click row to add</div>
                  )}
                </DropZone>
              );
            })}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="fm-right-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 20px', overflowY: 'auto' }}>

            {/* AI Suggest button */}
            {caseText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={generateAiCodes}
                  disabled={aiLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: '1.5px solid rgba(8,145,178,0.5)',
                    background: aiLoading ? 'rgba(8,145,178,0.08)' : 'rgba(8,145,178,0.15)',
                    color: aiLoading ? '#64748b' : '#38bdf8',
                    cursor: aiLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14 }}>✦</span>
                  {aiLoading ? 'AI thinking…'
                    : aiRan && synopticDerivedCodes?.length ? '↻ Re-run (Synoptic)'
                    : aiRan && narrativeText ? '↻ Re-run (Narrative)'
                    : aiRan ? '↻ Re-run AI Suggestions'
                    : narrativeText ? '✦ AI Suggest (Narrative)'
                    : '✦ AI Suggest Codes'}
                </button>
                {aiError && <span style={{ fontSize: 11, color: '#f87171' }}>⚠ {aiError}</span>}
              </div>
            )}

            {/* AI Suggestions panel */}
            {aiSuggestions.length > 0 && (
              <div style={{ marginBottom: 12, border: '1px solid rgba(8,145,178,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => setAiPanelCollapsed(c => !c)}
                  style={{ padding: '8px 14px', background: 'rgba(8,145,178,0.12)', fontSize: 12, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
                >
                  <span>✦</span>
                  <span style={{ flex: 1 }}>AI Suggested Codes — review and apply</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    {aiSuggestions
                      .filter((s, i, a) => a.findIndex(x => x.code === s.code) === i)
                      .filter(s => !existingCodes.some(ec => ec.code === s.code && ec.system === s.system))
                      .length} suggestions
                  </span>
                  <span style={{ fontSize: 14, transition: 'transform 0.2s', transform: aiPanelCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
                {!aiPanelCollapsed && aiSuggestions
                  .filter((sug, idx, arr) => arr.findIndex(s => s.code === sug.code) === idx)
                  .filter(sug => !existingCodes.some(ec => ec.code === sug.code && ec.system === sug.system))
                  .map((sug) => {
                  const isActive = applied.some(c => c.code === sug.code && !c.pendingDelete);
                  return (
                    <div
                      key={sug.code}
                      onClick={() => !isActive && addCode({ code: sug.code, display: sug.display, system: sug.system })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', cursor: isActive ? 'default' : 'pointer',
                        background: isActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(8,145,178,0.08)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
                        {sug.code}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, background: 'rgba(8,145,178,0.1)', padding: '2px 7px', borderRadius: 4 }}>
                        {sug.system}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: isActive ? '#64748b' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sug.display}
                      </span>
                      <span style={{ fontSize: 12, color: sug.confidence >= 85 ? '#34d399' : '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
                        {sug.confidence}%
                      </span>
                      {sug.rvu != null && (
                        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, fontFamily: 'monospace' }}>
                          {sug.rvu} RVU
                        </span>
                      )}
                      {isActive ? (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: '#38bdf8', flexShrink: 0 }} title="Apply code"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/></svg></span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* System tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {SYSTEMS.map(s => (
                <button key={s.id} onClick={() => { setSystem(s.id); setQuery(''); setFocused(-1); inputRef.current?.focus(); }}
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: system === s.id ? s.accent : 'rgba(255,255,255,0.06)',
                    color: system === s.id ? 'white' : '#94a3b8',
                  }}
                >{s.label}</button>
              ))}
            </div>

            {/* Hierarchy filters — SNOMED only */}
            {system === 'SNOMED' && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {SNOMED_FILTERS.map(f => (
                  <button key={f.id} onClick={() => setSnomedFilter(f.id)} title={f.hint}
                    style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${snomedFilter === f.id ? '#0891B2' : 'rgba(100,116,139,0.4)'}`,
                      background: snomedFilter === f.id ? 'rgba(8,145,178,0.15)' : 'transparent',
                      color: snomedFilter === f.id ? '#38bdf8' : '#64748b',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >{f.label}</button>
                ))}
              </div>
            )}

            {/* Target indicator */}
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              Applying to:{' '}
              <strong style={{ color: '#e2e8f0' }}>
                {target === null ? 'Case Level' : `Specimen ${allSpecimens.find(s => s.index === target)?.id ?? target + 1}`}
              </strong>
              <span style={{ marginLeft: 6, opacity: 0.6 }}>— click a row on the left to change</span>
            </div>

            {/* Search */}
            <div className="fm-search-wrap" style={{ marginBottom: 12 }}>
              <IcoSearch />
              <input
                ref={inputRef}
                autoFocus
                className="fm-search-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setFocused(-1); }}
                onKeyDown={handleKeyDown}
                placeholder={`Search ${sysInfo.label} — code or term…`}
              />
              {query && (
                <button className="fm-search-clear" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}>✕</button>
              )}
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div className="fm-empty">
                  <div className="fm-empty-hint">Searching {sysInfo.label}…</div>
                </div>
              ) : !query.trim() ? (
                <div className="fm-empty">
                  <IcoSearch />
                  <div className="fm-empty-heading">Search {sysInfo.label}</div>
                  <div className="fm-empty-hint">
                    {system === 'SNOMED' ? 'Type a diagnosis, site, specimen type, or organism' :
                     system === 'ICD10'  ? 'Type a code (e.g. C50) or description' :
                     system === 'LOINC'  ? 'Type a test name or LOINC number' :
                     system === 'ICD11'  ? 'ICD-11 requires backend proxy — coming soon' :
                     'ICD-O search requires backend proxy — coming soon'}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="fm-empty">
                  <IcoSearch />
                  <div className="fm-empty-heading">No results for "{query}"</div>
                  <div className="fm-empty-hint">Try a different term or switch filters</div>
                </div>
              ) : results.map((r, i) => {
                const isActive = applied.some(c => c.code === r.code && c.specimenIndex === target && !c.pendingDelete);
                const isFocus  = focused === i;
                return (
                  <div
                    key={r.code}
                    className={`fm-flag-card${isActive ? ' applied' : ''}`}
                    style={{ background: isFocus && !isActive ? 'rgba(255,255,255,0.05)' : undefined }}
                    onMouseEnter={() => setFocused(i)}
                    onClick={() => !isActive && addCode(r)}
                  >
                    <span className={`fm-code-chip${isActive ? ' applied' : ''}`} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {r.code}
                    </span>
                    <span style={{ fontSize: 13, color: isActive ? '#64748b' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.display}
                    </span>
                    {isActive ? (
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textAlign: 'right' }}>✓ Applied</span>
                    ) : (
                      <span className="fm-apply-btn" style={{ textAlign: 'right', display: 'inline-flex', alignItems: 'center' }} title="Apply code"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/></svg></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONTEXT MENU ── */}
        {ContextMenu}

        {/* ── FOOTER ── */}
        <div className="fm-footer">
          <span className={`fm-footer-status${isDirty ? ' dirty' : ''}`}>
            {isDirty
              ? `${toAddCount > 0 ? `${toAddCount} to add` : ''}${toAddCount > 0 && toRemoveCount > 0 ? ' · ' : ''}${toRemoveCount > 0 ? `${toRemoveCount} to remove` : ''}`
              : 'No changes'
            }
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fm-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="fm-btn-save"
              disabled={saving || !isDirty}
              onClick={handleSave}
              style={{ opacity: saving || !isDirty ? 0.5 : 1 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCodeModal;
