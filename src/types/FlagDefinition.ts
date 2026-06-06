// src/types/FlagDefinition.ts
// FlagDefinition — the admin-level flag type used by FlagManagerModal
// and flagsApi. Distinct from the service-layer Flag (IFlagService).

export interface FlagDefinition {
  id:           string;
  code:         string;
  name:         string;
  description?: string;
  /** Whether flag applies to a case or a specimen */
  level:        'case' | 'specimen';
  lisCode:      string;
  severity:     1 | 2 | 3 | 4 | 5;
  active:       boolean;
  autoCreated:  boolean;
  createdAt:    string;
  updatedAt:    string;
}
