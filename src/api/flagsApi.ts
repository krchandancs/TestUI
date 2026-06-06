// src/api/flagsApi.ts
// Thin adapter — delegates to mockFlagService (the single source of truth).
// Replace mockFlagService with firestoreFlagService in production by swapping
// the import below.

import { v4 as uuidv4 } from "uuid";
import type { FlagDefinition } from "../types/FlagDefinition";
import { mockFlagService } from "../services/flags/mockFlagService";

// ── helpers ───────────────────────────────────────────────────────────────────



// Map from mockFlagService's Flag type to the FlagDefinition shape used by the UI.
// mockFlagService uses level: 'Case' | 'Specimen' (capitalised)
// FlagManagerModal expects level: 'case' | 'specimen' (lowercase)
const toFlagDefinition = (f: any): FlagDefinition => ({
  id:          f.id,
  code:        f.lisCode,
  name:        f.name,
  description: f.description,
  level:       (f.level as string).toLowerCase() as 'case' | 'specimen',
  lisCode:     f.lisCode,
  severity:    f.severity,
  active:      f.status === 'Active',
  autoCreated: false,
  createdAt:   f.createdAt ?? new Date().toISOString(),
  updatedAt:   f.updatedAt ?? new Date().toISOString(),
});

// ── Admin API ─────────────────────────────────────────────────────────────────

export const getFlags = async (): Promise<FlagDefinition[]> => {
  const result = await mockFlagService.getAll();
  if (!result.ok) return [];
  return result.data.map(toFlagDefinition);
};

export const createFlag = async (payload: {
  code?: string;
  name: string;
  description?: string;
  level: 'case' | 'specimen';
  lisCode?: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  active?: boolean;
}): Promise<FlagDefinition> => {
  const result = await mockFlagService.add({
    name:        payload.name,
    lisCode:     payload.lisCode ?? payload.code ?? payload.name.slice(0, 4).toUpperCase(),
    description: payload.description,
    level:       payload.level === 'case' ? 'Case' : 'Specimen',
    severity:    payload.severity ?? 1,
    status:      payload.active === false ? 'Inactive' : 'Active',
  } as any);
  if (result.ok === false) throw new Error(result.error);
  return toFlagDefinition(result.data);
};

export const updateFlag = async (id: string, updates: Partial<FlagDefinition>): Promise<FlagDefinition> => {
  const mapped: any = {};
  if (updates.name)        mapped.name     = updates.name;
  if (updates.description) mapped.description = updates.description;
  if (updates.severity)    mapped.severity = updates.severity;
  if (updates.active !== undefined) mapped.status = updates.active ? 'Active' : 'Inactive';
  const result = await mockFlagService.update(id, mapped);
  if (result.ok === false) throw new Error(result.error);
  return toFlagDefinition(result.data);
};

export const deleteFlag = async (id: string): Promise<void> => {
  await mockFlagService.deactivate(id);
};

// ── Instance helpers (unchanged API) ─────────────────────────────────────────

export const makeFlagInstance = (flagDef: FlagDefinition, opts?: { specimenId?: string; specimenLabel?: string }) => {
  const base = {
    id:          uuidv4(),
    definitionId: flagDef.id,
    name:        flagDef.name,
    code:        flagDef.code,
    lisCode:     flagDef.lisCode,
    level:       flagDef.level,
    severity:    flagDef.severity,
    active:      flagDef.active,
    createdAt:   new Date().toISOString(),
  };
  if (flagDef.level === 'specimen') {
    return { ...base, specimenId: opts?.specimenId ?? null, specimenLabel: opts?.specimenLabel ?? null };
  }
  return base;
};

export const attachFlagsToCase = (caseObj: any, opts?: {
  caseFlagIds?: string[];
  specimenFlagIds?: { id: string; specimenId?: string; specimenLabel?: string }[];
}) => {
  const caseFlags = (opts?.caseFlagIds ?? []).map(id => ({
    id, definitionId: id, level: 'case',
  }));
  const specimenFlags = (opts?.specimenFlagIds ?? []).map(f => ({
    ...f, definitionId: f.id, level: 'specimen',
  }));
  return { ...caseObj, caseFlags, specimenFlags };
};

export const _resetFlagsStore = (_seed?: FlagDefinition[]) => {
  // No-op — store lives in mockFlagService / localStorage
};
