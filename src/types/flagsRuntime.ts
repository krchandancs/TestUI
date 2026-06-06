// src/types/flagsRuntime.ts
// Runtime types for case and specimen flag instances.
// These represent applied flags on a case, as opposed to
// FlagDefinition which is the configuration-time definition.

export interface FlagInstance {
  id: string;
  flagDefinitionId: string;
  appliedAt: string;
  appliedBy: string;
  source: "product" | "lis";
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface SpecimenWithFlags {
  id: string;
  label: string;
  flags: FlagInstance[];
}

export interface CaseWithFlags {
  id: string;
  accession: string;
  flags: FlagInstance[];
  specimens: SpecimenWithFlags[];
}
