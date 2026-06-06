// ─────────────────────────────────────────────────────────────────────────────
// services/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for which implementation is active.
// Components ALWAYS import from here — never from mock or firestore directly.
//
// To switch to Firestore:
//   1. Implement firestoreXxxService.ts
//   2. Change the import below from mockXxxService to firestoreXxxService
//   3. Done — no component changes needed
// ─────────────────────────────────────────────────────────────────────────────

export { mockUserService          as userService          } from './users/mockUserService';
export { mockRoleService          as roleService          } from './roles/mockRoleService';
export { mockPhysicianService     as physicianService     } from './physicians/mockPhysicianService';
export { mockFlagService          as flagService          } from './flags/mockFlagService';
export { mockSubspecialtyService  as subspecialtyService  } from './subspecialties/mockSubspecialtyService';
export { mockSpecimenService      as specimenService      } from './specimens/mockSpecimenService';
export { mockClientService        as clientService        } from './clients/mockClientService';
export { mockShortcutService      as shortcutService      } from './shortcuts/mockShortcutService';
export { mockSystemConfigService  as systemConfigService  } from './systemConfig/mockSystemConfigService';
export { mockMacroService         as macroService         } from './macros/mockMacroService';
export { mockFontService          as fontService          } from './fonts/mockFontService';
export { mockAIBehaviorService    as aiBehaviorService    } from './aiBehavior/mockAIBehaviorService';
export { mockModelService         as modelService         } from './models/mockModelService';
export { mockSavedSearchService   as savedSearchService   } from './savedSearches/mockSavedSearchService';
export { mockAuditService         as auditService         } from './auditLog/mockAuditService';
export { mockCaseService          as caseService          } from './cases/mockCaseService';
export { mockCodeService          as codeService          } from './codes/mockCodeService';
export { mockMessageService       as messageService       } from './messages/mockMessageService';
export { mockInternalNoteService  as internalNoteService  } from './internalNotes/mockInternalNoteService';

// ─── Re-export types so components don't need to know the file structure ──────
export type { StaffUser }         from './users/IUserService';
export type { Role }              from './roles/IRoleService';
export type { Physician }         from './physicians/IPhysicianService';
export type { Flag }              from './flags/IFlagService';
export type { Subspecialty }      from './subspecialties/ISubspecialtyService';
export type { Specimen }          from './specimens/ISpecimenService';
export type { Client }            from './clients/mockClientService';
export type { ShortcutMap }       from './shortcuts/mockShortcutService';
export type { SystemConfig }      from './systemConfig/mockSystemConfigService';
export type { Macro }             from './macros/IMacroService';
export type { EditorFont, EditorFontConfig } from './fonts/IFontService';
export type { AIBehaviorConfig }  from './aiBehavior/IAIBehaviorService';
export type { AIModel }           from './models/IModelService';
export type { SavedSearch, SearchContext, WorklistFilters, CaseSearchFilters, RefinedSearchFilters } from './savedSearches/ISavedSearchService';
export type { AuditLog, ErrorLog, AuditLogType, ErrorSeverity } from './auditLog/IAuditService';
export type { PathologyCase, CaseStatus, CasePriority, AIStatus, CaseFilterParams } from './cases/ICaseService';
export type { ClinicalCode, CodeSystem, CodeSearchParams, IcdOSubtype } from './codes/ICodeService';
export type { Message }           from './messages/IMessageService';
export type { InternalNote, InternalNoteType, InternalNoteVisibility } from './internalNotes/IInternalNoteService';
export type { ServiceResult }     from './types';
