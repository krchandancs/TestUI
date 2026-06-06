/**
 * src/components/Worklist/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports core case types from ICaseService — single source of truth.
 * FlagDefinition (worklist-UI-only) is defined here since it has no place
 * in the service layer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type {
  CaseStatus,
  CasePriority,
  AIStatus,
  FlagColor,
  Flag,
  PathologyCase,
  CaseFilterParams,
  CaseGender,
} from '../../services/cases/ICaseService';

// Priority is an alias kept for backwards compatibility with existing imports
export type { CasePriority as Priority } from '../../services/cases/ICaseService';

// FlagDefinition is worklist/config UI only — not part of the service layer
export interface FlagDefinition {
  id:           string;
  name:         string;
  description?: string;
  level:        'case' | 'specimen';
  lisCode:      string;
  severity:     1 | 2 | 3 | 4 | 5;
  active:       boolean;
  autoCreated:  boolean;
  createdAt:    string;
  updatedAt:    string;
}
