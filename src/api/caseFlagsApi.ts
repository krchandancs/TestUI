// src/api/caseFlagsApi.ts
// Flag operations — delegates to mockCaseService which now persists to localStorage.
// Replace with real API calls when the backend is ready.

import { CaseWithFlags, FlagInstance } from '../types/flagsRuntime';
import { mockCaseService } from '../services/cases/mockCaseService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplyFlagPayload {
  caseId: string;
  flagDefinitionId: string;
  specimenId?: string;
}

export interface DeleteFlagPayload {
  caseId: string;
  flagInstanceId: string;
  specimenId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInstance(flagDefinitionId: string): FlagInstance {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    flagDefinitionId,
    appliedAt: new Date().toISOString(),
    appliedBy: 'current-user',
    source: 'product',
    deletedAt: null,
    deletedBy: null,
  };
}

function toCaseWithFlags(c: any): CaseWithFlags {
  return {
    id: c.id,
    accession: c.accession?.fullAccession ?? c.accession?.accessionNumber ?? c.accession ?? c.id,
    flags: Array.isArray(c.caseFlags) ? c.caseFlags : [],
    specimens: (c.specimens ?? []).map((sp: any) => ({
      ...sp,
      flags: Array.isArray(sp.specimenFlags) ? sp.specimenFlags : [],
    })),
  };
}

// ─── applyFlags ───────────────────────────────────────────────────────────────

export async function applyFlags(payload: ApplyFlagPayload): Promise<CaseWithFlags> {
  console.log('[caseFlagsApi] applyFlags called:', payload);
  const c = await mockCaseService.getCase(payload.caseId);
  console.log('[caseFlagsApi] case found:', !!c, 'caseFlags:', (c as any)?.caseFlags);
  if (!c) throw new Error(`Case ${payload.caseId} not found`);

  const inst = makeInstance(payload.flagDefinitionId);

  if (payload.specimenId) {
    const specimens = (c.specimens ?? []).map((sp: any) => {
      if (sp.id !== payload.specimenId) return sp;
      const flags: FlagInstance[] = Array.isArray(sp.specimenFlags) ? sp.specimenFlags : [];
      if (flags.some(f => f.flagDefinitionId === payload.flagDefinitionId && !f.deletedAt)) return sp;
      return { ...sp, specimenFlags: [...flags, inst] };
    });
    await mockCaseService.updateCase(payload.caseId, { specimens } as any);
  } else {
    const flags: FlagInstance[] = Array.isArray((c as any).caseFlags) ? (c as any).caseFlags : [];
    if (!flags.some(f => f.flagDefinitionId === payload.flagDefinitionId && !f.deletedAt)) {
      await mockCaseService.updateCase(payload.caseId, { caseFlags: [...flags, inst] } as any);
    }
  }

  const updated = await mockCaseService.getCase(payload.caseId);
  return toCaseWithFlags(updated);
}

// ─── deleteFlags ──────────────────────────────────────────────────────────────

export async function deleteFlags(payload: DeleteFlagPayload): Promise<CaseWithFlags> {
  const c = await mockCaseService.getCase(payload.caseId);
  if (!c) throw new Error(`Case ${payload.caseId} not found`);

  const now = new Date().toISOString();

  if (payload.specimenId) {
    const specimens = (c.specimens ?? []).map((sp: any) => {
      if (sp.id !== payload.specimenId) return sp;
      const flags: FlagInstance[] = Array.isArray(sp.specimenFlags) ? sp.specimenFlags : [];
      return {
        ...sp,
        specimenFlags: flags.map(f =>
          f.id === payload.flagInstanceId
            ? { ...f, deletedAt: now, deletedBy: 'current-user' }
            : f
        ),
      };
    });
    await mockCaseService.updateCase(payload.caseId, { specimens } as any);
  } else {
    const flags: FlagInstance[] = Array.isArray((c as any).caseFlags) ? (c as any).caseFlags : [];
    await mockCaseService.updateCase(payload.caseId, {
      caseFlags: flags.map(f =>
        f.id === payload.flagInstanceId
          ? { ...f, deletedAt: now, deletedBy: 'current-user' }
          : f
      ),
    } as any);
  }

  const updated = await mockCaseService.getCase(payload.caseId);
  return toCaseWithFlags(updated);
}
