// src/utils/flagAdapter.ts
//
// Maps Flag (from IFlagService / mockFlagService) → FlagDefinition (used by FlagManagerModal).
// Use this wherever mockFlagService.getAll() results are passed to FlagManagerModal.
//
// Example usage at call site:
//
//   const result = await mockFlagService.getAll();
//   if (result.ok) {
//     setFlagDefinitions(result.data.map(adaptFlag));
//   }

import { Flag } from "../services/flags/IFlagService";
import { FlagDefinition } from "../types/FlagDefinition";

export function adaptFlag(flag: Flag): FlagDefinition {
  return {
    id:          flag.id,
    code:        flag.lisCode,          // use lisCode as the short UI code
    name:        flag.name,
    description: flag.description,
    level:       flag.level.toLowerCase() as "case" | "specimen",
    lisCode:     flag.lisCode,
    severity:    flag.severity,
    active:      flag.status === "Active",
    autoCreated: false,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
}
