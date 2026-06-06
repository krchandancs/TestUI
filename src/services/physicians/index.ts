// ─────────────────────────────────────────────────────────────────────────────
// services/physicians/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for physician-related service implementations.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Service Implementations (Moving up to sibling folders) ──────────────────
export { mockUserService          as userService          } from '../users/mockUserService';
export { mockRoleService          as roleService          } from '../roles/mockRoleService';
export { mockPhysicianService     as physicianService     } from './mockPhysicianService'; // Stays ./ if in same folder
export { mockFlagService          as flagService          } from '../flags/mockFlagService';
export { mockSubspecialtyService  as subspecialtyService  } from '../subspecialties/mockSubspecialtyService';
export { mockSpecimenService      as specimenService      } from '../specimens/mockSpecimenService';
export { mockClientService        as clientService        } from '../clients/mockClientService';
export { mockMacroService         as macroService         } from '../macros/mockMacroService';
export { mockFontService          as fontService          } from '../fonts/mockFontService';
export { mockAIBehaviorService    as aiBehaviorService    } from '../aiBehavior/mockAIBehaviorService';
export { mockModelService         as modelService         } from '../models/mockModelService';
export { mockAuditService         as auditService         } from '../auditLog/mockAuditService';

// Fixed Action Registry / System Config paths
export { mockActionRegistryService as shortcutService } from '../actionRegistry/mockActionRegistryService';
export { mockSystemConfigService   as systemConfigService } from '../systemConfig/mockSystemConfigService';
export { mockSavedSearchService    as savedSearchService  } from '../savedSearches/mockSavedSearchService';

// ─── Type Re-exports ────────────────────────────────────────────────────────
export type { StaffUser }     from '../users/IUserService';
export type { Role }          from '../roles/IRoleService';
export type { Physician }     from './IPhysicianService'; // Stays ./ if in same folder
export type { Flag }          from '../flags/IFlagService';
export type { Subspecialty }  from '../subspecialties/ISubspecialtyService';
export type { Specimen }      from '../specimens/ISpecimenService';
export type { Client }        from '../clients/mockClientService';
export type { Macro }         from '../macros/IMacroService';
export type { EditorFont, EditorFontConfig } from '../fonts/IFontService';
export type { AIBehaviorConfig }  from '../aiBehavior/IAIBehaviorService';
export type { AIModel }           from '../models/IModelService';
export type { SystemConfig }      from '../systemConfig/mockSystemConfigService';
export type { ServiceResult }     from '../types';

// Action Registry / Shortcut Types
export type { SystemAction }      from '../actionRegistry/IActionRegistryService';
export type ShortcutMap = Record<string, string>; 

// Saved Searches & Audit Log Types
export type { 
  SavedSearch, 
  SearchContext, 
  WorklistFilters, 
  CaseSearchFilters, 
  RefinedSearchFilters 
} from '../savedSearches/ISavedSearchService';

export type { 
  AuditLog, 
  ErrorLog, 
  AuditLogType, 
  ErrorSeverity 
} from '../auditLog/IAuditService';
