// src/pages/Synoptic/useSynopticFlags.ts

import { useState, useCallback } from 'react';
import type { FlagDefinition } from '../../types/FlagDefinition';
import type { CaseWithFlags } from '../../types/flagsRuntime';
import { mockFlagService } from '../../services/flags/mockFlagService';
import { mockCaseService } from '../../services/cases/mockCaseService';
import { applyFlags, deleteFlags, ApplyFlagPayload, DeleteFlagPayload } from '../../api/caseFlagsApi';
import { adaptFlag } from '../../utils/flagAdapter';

export function useSynopticFlags(caseId: string) {
  const [flagCaseData,    setFlagCaseData]    = useState<CaseWithFlags | null>(null);
  const [flagDefinitions, setFlagDefinitions] = useState<FlagDefinition[]>([]);
  const [showFlagManager, setShowFlagManager] = useState(false);

  const openFlagManager = useCallback(async (caseData: any) => {
    // Load flag definitions
    const result = await mockFlagService.getAll();
    if (result.ok) setFlagDefinitions(result.data.map(adaptFlag));

    // Reload case fresh from storage to pick up any persisted flags
    const freshCase = await mockCaseService.getCase(caseData.id) ?? caseData;

    const accession = freshCase.accession?.fullAccession
      ?? freshCase.accession?.accessionNumber
      ?? freshCase.accession
      ?? caseId;

    const caseWithFlags: CaseWithFlags = {
      id: freshCase.id,
      accession,
      flags: Array.isArray((freshCase as any).caseFlags)
        ? (freshCase as any).caseFlags.filter((f: any) => f.flagDefinitionId && !f.deletedAt)
        : [],
      specimens: (freshCase.specimens ?? []).map((sp: any) => ({
        ...sp,
        flags: Array.isArray(sp.specimenFlags)
          ? sp.specimenFlags.filter((f: any) => f.flagDefinitionId && !f.deletedAt)
          : [],
      })),
    };

    setFlagCaseData(caseWithFlags);
    setShowFlagManager(true);
  }, [caseId]);

  const onApplyFlags = useCallback(async (payload: ApplyFlagPayload) => {
    const updated = await applyFlags(payload);
    setFlagCaseData(updated);
  }, []);

  const onRemoveFlag = useCallback(async (payload: DeleteFlagPayload) => {
    const updated = await deleteFlags(payload);
    setFlagCaseData(updated);
  }, []);

  return {
    flagCaseData,    setFlagCaseData,
    flagDefinitions,
    showFlagManager, setShowFlagManager,
    openFlagManager,
    onApplyFlags,
    onRemoveFlag,
  };
}
