// ─────────────────────────────────────────────────────────────────────────────
// services/index.ts
// ─────────────────────────────────────────────────────────────────────────────
export { mockUserService          as userService          } from './users/mockUserService';
export { mockRoleService          as roleService          } from './roles/mockRoleService';
export { mockPhysicianService     as physicianService     } from './physicians/mockPhysicianService';
export { mockFlagService          as flagService          } from './flags/mockFlagService';
export { mockSubspecialtyService  as subspecialtyService  } from './subspecialties/mockSubspecialtyService';
export { mockSpecimenService      as specimenService      } from './specimens/mockSpecimenService';
export { mockClientService        as clientService        } from './clients/mockClientService';
export { mockSystemConfigService  as systemConfigService  } from './systemConfig/mockSystemConfigService';
export { mockMacroService         as macroService         } from './macros/mockMacroService';
export { mockFontService          as fontService          } from './fonts/mockFontService';
export { mockAIBehaviorService    as aiBehaviorService    } from './aiBehavior/mockAIBehaviorService';
export { mockModelService         as modelService         } from './models/mockModelService';
export { mockSavedSearchService   as savedSearchService   } from './savedSearches/mockSavedSearchService';
export { mockAuditService         as auditService         } from './auditlog/mockAuditService';
export { mockCaseService          as caseService          } from './cases/mockCaseService';
export { mockCodeService          as codeService          } from './codes/mockCodeService';
export { mockMessageService       as messageService       } from './messages/mockMessageService';
export { mockInternalNoteService  as internalNoteService  } from './internalNotes/mockInternalNoteService';
export { INTERNAL_NOTE_TYPE_LABELS                        } from './internalNotes/IInternalNoteService';
export { mockResultService        as resultService         } from './result/MockResultService';
export { mockReportTemplateService as reportTemplateService } from './reportTemplates/mockReportTemplateService';
export { onReportTemplatesChanged, STANDARD_TEMPLATE_ID,
         BREAST_TEMPLATE_ID, GI_TEMPLATE_ID,
         THORACIC_TEMPLATE_ID, URO_TEMPLATE_ID           } from './reportTemplates/mockReportTemplateService';
export { resolveReportTemplate                            } from './reportTemplates/TemplateRoutingService';

// ─── Type re-exports ──────────────────────────────────────────────────────────
export type { StaffUser }         from './users/IUserService';
export type { Role }              from './roles/IRoleService';
export type { Physician }         from './physicians/IPhysicianService';
export type { Flag }              from './flags/IFlagService';
export type { Subspecialty }      from './subspecialties/ISubspecialtyService';
export type { Specimen }          from './specimens/ISpecimenService';
export type { Client }            from './clients/mockClientService';
export type { SystemConfig }      from './systemConfig/mockSystemConfigService';
export type { Macro }             from './macros/IMacroService';
export type { EditorFont, EditorFontConfig } from './fonts/IFontService';
export type { AIBehaviorConfig }  from './aiBehavior/IAIBehaviorService';
export type { AIModel }           from './models/IModelService';
export type { SavedSearch, SearchContext, WorklistFilters, CaseSearchFilters, RefinedSearchFilters } from './savedSearches/ISavedSearchService';
export type { AuditLog, ErrorLog, AuditLogType, ErrorSeverity } from './auditlog/IAuditService';
export type { PathologyCase, CaseStatus, CasePriority, AIStatus, CaseGender, FlagColor, CaseFilterParams } from './cases/ICaseService';
export type { ClinicalCode, CodeSystem, CodeSearchParams, IcdOSubtype } from './codes/ICodeService';
export type { Message }           from './messages/IMessageService';
export type { InternalNote, InternalNoteType, InternalNoteVisibility } from './internalNotes/IInternalNoteService';
export type { ServiceResult }     from './types';
export type { ComputationalResult } from '../types/smarttag.types';
export type { ReportTemplate }    from './reportTemplates/IReportTemplateService';
export type { TemplateRoutingInput, TemplateRoutingResult } from './reportTemplates/TemplateRoutingService';
