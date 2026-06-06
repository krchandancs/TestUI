// src/constants/delegationTypes.ts
// ─────────────────────────────────────────────────────────────
// Delegation type definitions.
// Seeded with clinical defaults — users can add custom types
// via Configuration → System → Delegation Types.
// ─────────────────────────────────────────────────────────────

export interface DelegationType {
  id: string;
  label: string;
  description: string;
  transfersOwnership: boolean;
  requiresNote: boolean;
  color: string;
  active: boolean;
  isSystem: boolean;       // system types cannot be deleted, only deactivated
  cptHint?: string;
  sortOrder: number;
  /** If true, delegation targets a specific synoptic instance, not the whole case */
  synopticScoped?: boolean;
}

// ─── Default seed data ────────────────────────────────────────────────────────

export const DEFAULT_DELEGATION_TYPES: DelegationType[] = [
  {
    id: 'REASSIGN',
    label: 'Case Reassignment',
    description: 'Full transfer of case ownership — you are no longer responsible',
    transfersOwnership: true,
    requiresNote: false,
    color: '#0891B2',
    active: true,
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: 'POOL',
    label: 'Move to Pool',
    description: 'Transfer to a workgroup queue for any available pathologist to accept',
    transfersOwnership: true,
    requiresNote: false,
    color: '#6366f1',
    active: true,
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: 'SECOND_OPINION',
    label: 'Second Opinion',
    description: 'Formal consultation — you retain ownership and sign-out responsibility',
    transfersOwnership: false,
    requiresNote: true,
    color: '#f59e0b',
    active: true,
    isSystem: true,
    cptHint: '88321–88325',
    sortOrder: 3,
  },
  {
    id: 'CASUAL_REVIEW',
    label: 'Casual Review',
    description: 'Informal peer review — no formal obligation for the reviewer',
    transfersOwnership: false,
    requiresNote: false,
    color: '#10b981',
    active: true,
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: 'TUMOR_BOARD',
    label: 'Tumor Board',
    description: 'Submitted for multidisciplinary team discussion — not a sign-out',
    transfersOwnership: false,
    requiresNote: false,
    color: '#8b5cf6',
    active: true,
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: 'TEACHING',
    label: 'Teaching Case',
    description: 'Assigned to resident or fellow for educational review',
    transfersOwnership: false,
    requiresNote: false,
    color: '#64748b',
    active: true,
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: 'CONSULT_EXT',
    label: 'External Consultation',
    description: 'Sent to an outside institution or specialist',
    transfersOwnership: false,
    requiresNote: true,
    color: '#ef4444',
    active: true,
    isSystem: true,
    cptHint: '88321–88325',
    sortOrder: 7,
  },
  {
    id: 'SYNOPTIC_ASSIGN',
    label: 'Assign Synoptic to Pathologist',
    description: 'Assign a specific specimen synoptic to another pathologist — they finalise, you countersign',
    transfersOwnership: false,
    requiresNote: false,
    color: '#06b6d4',
    active: true,
    isSystem: true,
    synopticScoped: true,
    sortOrder: 8,
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORE_KEY = 'ps_delegation_types_v1';

export function loadDelegationTypes(): DelegationType[] {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (!stored) return DEFAULT_DELEGATION_TYPES;

    const parsed: DelegationType[] = JSON.parse(stored);

    // Merge: ensure all system defaults are present even if storage is stale
    const storedIds = new Set(parsed.map(d => d.id));
    const missing = DEFAULT_DELEGATION_TYPES.filter(d => !storedIds.has(d.id));
    return [...parsed, ...missing].sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return DEFAULT_DELEGATION_TYPES;
  }
}

export function saveDelegationTypes(types: DelegationType[]): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(types)); } catch {}
}

export function addDelegationType(type: Omit<DelegationType, 'id' | 'isSystem' | 'sortOrder'>): DelegationType {
  const types = loadDelegationTypes();
  const newType: DelegationType = {
    ...type,
    id: 'CUSTOM_' + Math.random().toString(36).slice(2).toUpperCase(),
    isSystem: false,
    sortOrder: Math.max(...types.map(t => t.sortOrder)) + 1,
  };
  saveDelegationTypes([...types, newType]);
  return newType;
}

export function updateDelegationType(id: string, changes: Partial<DelegationType>): void {
  const types = loadDelegationTypes();
  const idx = types.findIndex(t => t.id === id);
  if (idx >= 0) {
    types[idx] = { ...types[idx], ...changes };
    saveDelegationTypes(types);
  }
}

export function deleteDelegationType(id: string): void {
  const types = loadDelegationTypes();
  const type = types.find(t => t.id === id);
  if (!type || type.isSystem) return; // cannot delete system types
  saveDelegationTypes(types.filter(t => t.id !== id));
}

// ─── Convenience ──────────────────────────────────────────────────────────────

/** Active types only — for use in DelegateModal */
export const DELEGATION_TYPES = DEFAULT_DELEGATION_TYPES; // UI components use loadDelegationTypes() at runtime

export function getDelegationTypeMap(): Record<string, DelegationType> {
  return Object.fromEntries(loadDelegationTypes().map(d => [d.id, d]));
}
