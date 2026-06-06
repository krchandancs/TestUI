export interface FlagDefinition {
  id: string;                 // "frozenSection"
  name: string;
  description?: string;
  level: "case" | "specimen";
  lisCode: string;

  // NEW: severity rating (1–5)
  severity: 1 | 2 | 3 | 4 | 5;

  active: boolean;
}

export interface FlagInstance {
  id: string;                 // unique instance ID
  flagDefinitionId: string;   // FK → FlagDefinition.id
  appliedAt: string;          // ISO timestamp
  appliedBy: string;
  source: "product" | "lis";
  deletedAt: string | null;
  deletedBy: string | null;

  // NEW: carry severity forward for sorting + UI
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface Specimen {
  id: string;
  label: string;              // "Specimen A — Gallbladder"
  flags: FlagInstance[];
}

export interface CaseWithFlags {
  id: string;
  accession: string;
  flags: FlagInstance[];
  specimens: Specimen[];
}
