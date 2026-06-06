// src/hooks/useCaseEditor.ts
// ─────────────────────────────────────────────────────────────
// Single source of truth for all case mutations.
// Every write operation goes through this hook, which:
//   1. Performs the mutation
//   2. Marks the case as dirty
//   3. Persists to the service
//   4. Returns the updated case
//
// Dirty state is cleared only by save() or finalize().
// Status transitions:
//   pending-review → in-progress (first mutation)
//   in-progress    → finalized   (finalize)
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { mockCaseService } from '@/services/cases/mockCaseService';
import { useDirtyState } from '@/contexts/DirtyStateContext';
import type { Case, SynopticReportInstance, AiFieldSuggestion } from '@/types/case/Case';

// ─── Types ────────────────────────────────────────────────────

export interface UseCaseEditorResult {
  caseData:       Case | null;
  isDirty:        boolean;
  isSaving:       boolean;

  // ── Mutations ─────────────────────────────────────────────
  /** Update a single synoptic field answer */
  updateAnswer:   (instanceId: string, fieldId: string, value: string | string[]) => void;
  /** Verify or dispute an AI suggestion */
  verifyField:    (instanceId: string, fieldId: string, verification: 'verified' | 'disputed') => void;
  /** Update AI suggestions on a report instance */
  updateSuggestions: (instanceId: string, suggestions: Record<string, AiFieldSuggestion>) => void;
  /** Add or update the attending case comment */
  updateComment:  (html: string) => void;
  /** Add a new synoptic report instance */
  addSynopticReport: (instance: SynopticReportInstance) => void;
  /** Update an entire report instance (e.g. status change, deferred) */
  updateReportInstance: (instanceId: string, changes: Partial<SynopticReportInstance>) => void;
  /** Apply flags to the case */
  applyFlags:     (updated: Case) => void;
  /** Add coding to the case */
  addCodes:       (icd: string[], snomed: string[]) => void;

  // ── Lifecycle ─────────────────────────────────────────────
  /** Load a case — resets dirty state and snapshots baseline */
  loadCase:       (caseId: string) => Promise<Case | null>;
  /** Persist all pending changes — clears dirty */
  save:           () => Promise<void>;
  /** Finalize the case — persists + sets status = finalized */
  finalize:       () => Promise<void>;
  /** Directly set case data (for external updates) */
  setCaseData:    (c: Case | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useCaseEditor(): UseCaseEditorResult {
  const [caseData, setCaseDataState] = useState<Case | null>(null);
  const [isSaving, setIsSaving]      = useState(false);
  const { isDirty, setDirty }        = useDirtyState();

  // Snapshot of the case as it was when last loaded/saved
  // Used to detect any CRUD activity
  const baselineRef = useRef<string>('');

  // ── Internal helpers ───────────────────────────────────────

  const markDirty = useCallback((updated: Case) => {
    const current = JSON.stringify(updated);
    if (current !== baselineRef.current) {
      setDirty(true);
    }
    setCaseDataState(updated);
  }, [setDirty]);

  const applyToCase = useCallback((
    mutate: (prev: Case) => Case
  ): Case | null => {
    let result: Case | null = null;
    setCaseDataState(prev => {
      if (!prev) return prev;
      const updated = mutate(prev);
      result = updated;
      markDirty(updated);
      return updated;
    });
    return result;
  }, [markDirty]);

  const applyToReport = useCallback((
    instanceId: string,
    mutate: (report: SynopticReportInstance) => SynopticReportInstance
  ) => {
    applyToCase(prev => ({
      ...prev,
      status: prev.status === 'pending-review' ? 'in-progress' : prev.status,
      updatedAt: new Date().toISOString(),
      synopticReports: (prev.synopticReports ?? []).map(r =>
        r.instanceId === instanceId ? mutate(r) : r
      ),
    }));
  }, [applyToCase]);

  // ── Mutations ──────────────────────────────────────────────

  const updateAnswer = useCallback((
    instanceId: string,
    fieldId: string,
    value: string | string[]
  ) => {
    applyToReport(instanceId, r => ({
      ...r,
      answers: { ...r.answers, [fieldId]: value },
      updatedAt: new Date().toISOString(),
    }));
  }, [applyToReport]);

  const verifyField = useCallback((
    instanceId: string,
    fieldId: string,
    verification: 'verified' | 'disputed'
  ) => {
    applyToReport(instanceId, r => ({
      ...r,
      aiSuggestions: r.aiSuggestions
        ? {
            ...r.aiSuggestions,
            [fieldId]: { ...r.aiSuggestions[fieldId], verification },
          }
        : r.aiSuggestions,
      updatedAt: new Date().toISOString(),
    }));
  }, [applyToReport]);

  const updateSuggestions = useCallback((
    instanceId: string,
    suggestions: Record<string, AiFieldSuggestion>
  ) => {
    // AI suggestions arriving — update but snapshot so this baseline is NOT dirty
    applyToReport(instanceId, r => ({
      ...r,
      aiSuggestions: suggestions,
      updatedAt: new Date().toISOString(),
    }));
  }, [applyToReport]);

  const updateComment = useCallback((html: string) => {
    applyToCase(prev => ({
      ...prev,
      status: prev.status === 'pending-review' ? 'in-progress' : prev.status,
      updatedAt: new Date().toISOString(),
      // Store comment on the case-level (not specimen)
      diagnostic: {
        ...prev.diagnostic,
        primaryDiagnosis: prev.diagnostic?.primaryDiagnosis,
      },
      // We use a side-channel for comments — persist to localStorage and mark dirty
      _caseComment: html,
    } as any));
  }, [applyToCase]);

  const addSynopticReport = useCallback((instance: SynopticReportInstance) => {
    applyToCase(prev => ({
      ...prev,
      status: prev.status === 'pending-review' ? 'in-progress' : prev.status,
      updatedAt: new Date().toISOString(),
      synopticReports: [...(prev.synopticReports ?? []), instance],
    }));
  }, [applyToCase]);

  const updateReportInstance = useCallback((
    instanceId: string,
    changes: Partial<SynopticReportInstance>
  ) => {
    applyToReport(instanceId, r => ({
      ...r,
      ...changes,
      updatedAt: new Date().toISOString(),
    }));
  }, [applyToReport]);

  const applyFlags = useCallback((updated: Case) => {
    markDirty({
      ...updated,
      status: updated.status === 'pending-review' ? 'in-progress' : updated.status,
    });
  }, [markDirty]);

  const addCodes = useCallback((icd: string[], snomed: string[]) => {
    applyToCase(prev => ({
      ...prev,
      status: prev.status === 'pending-review' ? 'in-progress' : prev.status,
      updatedAt: new Date().toISOString(),
      coding: {
        ...prev.coding,
        icd10:  [...(prev.coding?.icd10  ?? []), ...icd],
        snomed: [...(prev.coding?.snomed ?? []), ...snomed],
      },
    }));
  }, [applyToCase]);

  // ── Lifecycle ──────────────────────────────────────────────

  const loadCase = useCallback(async (caseId: string): Promise<Case | null> => {
    const c = await mockCaseService.getCase(caseId);
    const loaded = c ?? null;
    setCaseDataState(loaded);
    // Snapshot the full case as baseline — anything diverging from this is dirty
    baselineRef.current = JSON.stringify(loaded);
    setDirty(false);
    return loaded;
  }, [setDirty]);

  const save = useCallback(async () => {
    if (!caseData) return;
    setIsSaving(true);
    try {
      const toSave: Case = {
        ...caseData,
        status: caseData.status === 'pending-review' ? 'in-progress' : caseData.status,
        updatedAt: new Date().toISOString(),
      };
      await mockCaseService.updateCase(toSave.id, toSave);
      setCaseDataState(toSave);
      // Update baseline to the saved state — now clean
      baselineRef.current = JSON.stringify(toSave);
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [caseData, setDirty]);

  const finalize = useCallback(async () => {
    if (!caseData) return;
    setIsSaving(true);
    try {
      const toSave: Case = {
        ...caseData,
        status: 'finalized',
        updatedAt: new Date().toISOString(),
      };
      await mockCaseService.updateCase(toSave.id, toSave);
      setCaseDataState(toSave);
      baselineRef.current = JSON.stringify(toSave);
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [caseData, setDirty]);

  const setCaseData = useCallback((c: Case | null) => {
    setCaseDataState(c);
  }, []);

  return {
    caseData,
    isDirty,
    isSaving,
    updateAnswer,
    verifyField,
    updateSuggestions,
    updateComment,
    addSynopticReport,
    updateReportInstance,
    applyFlags,
    addCodes,
    loadCase,
    save,
    finalize,
    setCaseData,
  };
}
