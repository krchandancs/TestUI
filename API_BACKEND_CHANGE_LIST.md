# Backend API Contract Change List

## Purpose

This document captures the complete backend change list needed to align the API with the UI contract in `c:\Chandan\Projects\ForMedrixAI-UI-PathScribe`.

It is based on backend source review of:
- `ForMedrixAI.API.Controllers\CasesController.cs`
- `PathScribe.API.Controllers\AuditController.cs`
- `ForMedrixAI.API.Controllers\SynopticsController.cs`
- `ForMedrixAI.API.Controllers\FlagsController.cs`
- `ForMedrixAI.API.Controllers\CodesController.cs`
- `ForMedrixAI.Core.DTOs\AllDtos.cs`

## Summary of Required Changes

1. Expand case list payload to return UI-shaped summaries.
2. Redesign case detail payload to return a full nested UI `Case` object.
3. Upgrade `SpecimenDto` to a UI-complete specimen model.
4. Embed applied case and specimen flag instances in case responses.
5. Align synoptic response DTOs with UI field semantics.
6. Fix audit route naming, return real confidence values, and add error log endpoints.
7. Implement the UI worklist filter contract.
8. Implement real terminology/code search support.

---

## 1. Cases API Changes

### 1.1 `CasesController.List`

Current route:
- `GET /api/v1/cases`
- accepts query: `status`, `search`, `page`, `pageSize`
- returns: `PagedResult<CaseListItemDto>`

Required changes:
- support UI worklist filters:
  - `clientId`
  - `clientName`
  - `requestingProvider`
  - `assignedTo`
  - `priority`
  - `reportingMode`
  - `dateFrom` / `dateTo`
  - `patientName`
  - `accessionNo`
  - `specimenSite`
  - `status`
  - `search`
  - `page`, `pageSize`
- return a richer payload that includes UI-shaped case fields or add a dedicated batch detail enrichment endpoint.

Implementation options:
- extend `CaseListItemDto` to include nested `patient`, `order`, `accession`, `specimens`, `caseFlags`, `specimenFlags`, `coding`, `reportingMode`, `originHospitalId`, `originEnterpriseId`, and routing metadata.
- or add `POST /api/v1/cases/details` to resolve case details for visible worklist rows after list retrieval.

### 1.2 `CasesController.Get` and `GetDetail`

Current routes:
- `GET /api/v1/cases/{id}` returns `CaseDataDto`
- `GET /api/v1/cases/{id}/detail` returns `CaseDetailDto`
- `GET /api/v1/cases/by-accession/{accession}` returns `CaseDetailDto`

Required changes:
- make `CaseDetailDto` the authoritative UI payload for case detail.
- if possible, align `GET /api/v1/cases/{id}` with `CaseDetailDto` or ensure the UI uses `/detail` consistently.
- preserve `CaseDataDto` only for legacy LIS compatibility if needed.

### 1.3 `CasesController.GetSpecimens`

Current route:
- `GET /api/v1/cases/{id}/specimens`

Required changes:
- ensure specimen retrieval returns the new enhanced specimen shape.
- support flag aggregation and UI specimen metadata.

### 1.4 `CasesController.AddSpecimen` / `UpdateSpecimen`

Required changes:
- ensure request/response contracts support the enhanced specimen model and any new UI fields added to `SpecimenDto`.

### 1.5 `CasesController.GetProtocolSuggestion`

No contract change needed unless the UI requires additional protocol metadata in the case payload.

---

## 2. Backend DTO Changes (`ForMedrixAI.Core.DTOs\AllDtos.cs`)

### 2.1 `CaseListItemDto`

Current shape is too shallow. It must be extended to include nested UI fields.

Recommended additions:
- `Accession` / `AccessionMetadata`
- `Patient` nested patient object
- `Order` nested order metadata
- `Specimens` or at least specimen summaries
- `CaseFlags` and `SpecimenFlags`
- `Coding` structured object instead of `CodingJson`
- `ReportingMode`
- `OriginHospitalId`
- `OriginEnterpriseId`
- `AssignedParticipationTypeId`
- `SharedWith`
- `IsReferenceLabCase`
- `UpdatedAt`

Alternative:
- create a new `CaseSummaryDto` with the UI-shaped summary contract and return it from the list endpoint.

### 2.2 `CaseDetailDto`

Current shape is a flattened LIS-style payload.

Required redesign:
- replace flat fields with nested structures:
  - `AccessionMetadata`
  - `PatientDto`
  - `OrderMetadataDto`
  - `DiagnosticMetadataDto`
  - `CaseCodingDto`
  - `List<SpecimenDto>`
  - `List<CaseFlagInstanceDto>`
  - `List<SpecimenFlagInstanceDto>`
  - `List<AssignmentHistoryEntryDto>`
- remove legacy semantics such as `CodingJson` from the UI payload and map it to a structured type.
- keep legacy `CaseDataDto` only for compatibility if required by LIS update paths.

### 2.3 `SpecimenDto`

Current shape is missing UI specimen metadata.

Required fields to add or restructure:
- `DisplayName`
- `Collection` object with `CollectedAt`, `CollectedBy`, `Method`, `BodySite`
- `Processing` object with `Fixative`, `ProcessedAt`, `ProcessingDescription`
- `Container` object with `Type`, `Identifier`, `Description`
- `SpecimenFlags`
- `SnomedTypeCode`
- `SnomedSiteCode`
- `Active`
- `CreatedAt`
- `UpdatedAt`
- `ReceivedAt`
- `CollectedAt`

If the UI only needs a summary specimen shape in the list endpoint, maintain a lightweight summary DTO and map it from the full specimen object.

### 2.4 Case/Specimen Flag DTOs

Current backend has `FlagDto`, but UI needs applied flag instances attached to cases.

Required additions:
- `CaseFlagInstanceDto`
  - `Id`
  - `Name`
  - `LisCode`
  - `Description`
  - `Level`
  - `Severity`
  - `Color`
  - `Category`
  - `CreatedAt`
  - `CreatedBy`
  - `RetiredAt`
  - `RetiredBy`
  - `IsActive`
  - `AutoCreated`
  - `SpecimenId?`
- `SpecimenFlagInstanceDto` may reuse the same shape if the UI treats them similarly.
- embed these lists in `CaseDetailDto` and `CaseListItemDto`.

### 2.5 `SynopticReportInstanceDto`

Current fields:
- `InstanceId`
- `SpecimenId`
- `TemplateId`
- `TemplateName`
- `Status`
- `Answers`
- `AiSuggestions`
- `Comment`
- `CreatedAt`
- `UpdatedAt`

Required UI-aligned changes:
- `AssignedToName`
- `RequiresCountersign`
- `CountersignedBy`
- `CountersignedAt`
- `DeferredPending`
- `Comment` is already present, but ensure nullability and semantics match UI.

### 2.6 `FieldValueDto`

Current fields are close, but UI semantics differ.

Required fields to add or rename:
- `AiValue` (separate from current `Value`)
- `AiSource` (instead of or in addition to `SourceText`)
- `Dirty`
- `DisputeReason`
- `Attested`
- `Verification` remains, but confirm values align to UI expectations (`unverified`|`verified`|`disputed`).
- preserve `Value`, `Confidence`, `IsRequired`, `FieldType`, `AllowedValues`, `Unit`, `ValidationStatus`, `ValidationMessage`.

### 2.7 Audit DTOs

Current backend provides `UnifiedAuditLogDto` and `UnifiedAuditQueryRequest`.

Required changes:
- ensure `UnifiedAuditLogDto.Confidence` is populated from real AI audit sources instead of hard-coded null.
- if not already present, create `AuditErrorDto`:
  - `Id`
  - `Timestamp`
  - `Severity`
  - `Code`
  - `Message`
  - `Source`
  - `CaseId`
  - `Resolved`
  - `Details?`
- align `UnifiedAuditQueryRequest` with UI query naming or support aliasing at the controller layer.

### 2.8 Code search DTOs

`CodeSearchResult` already exists and is appropriate. The required backend change is implementation, not schema.

---

## 3. Audit API Changes

### 3.1 Route alignment

Current route:
- `GET /api/v1/audit`

UI expects:
- `GET /api/v1/audit/logs`

Required changes:
- add route alias for `/api/v1/audit/logs` in `AuditController` or update the UI route to `/api/v1/audit`.
- keep `AuditController.Query` behavior identical for both paths.

### 3.2 Query parameters

Current query params:
- `type`, `user`, `dateFrom`, `dateTo`, `search`, `page`, `pageSize`

Required UI contract:
- support the same semantics and field names; if the UI uses `from`/`to`, provide aliases or mapping.

### 3.3 Confidence values

Current backend sets `Confidence = null`.

Required change:
- read actual AI audit confidence from the persistence layer and return it in `UnifiedAuditLogDto`.

### 3.4 Error log endpoints

Add new endpoints for audit error management:
- `GET /api/v1/audit/errors`
- `POST /api/v1/audit/errors`
- `PUT /api/v1/audit/errors/{id}/resolve`

This can be implemented in `AuditController` or in a new `AuditErrorsController`.

---

## 4. Flags API Changes

### 4.1 Preserve existing flag definition routes

Current routes in `FlagsController`:
- `GET /api/v1/flags`
- `GET /api/v1/flags/{id}`
- `POST /api/v1/flags`
- `PUT /api/v1/flags/{id}`
- `PUT /api/v1/flags/{id}/deactivate`
- `PUT /api/v1/flags/{id}/reactivate`

### 4.2 Add applied flag attachment in case payloads

Required change:
- return case-applied flags and specimen-applied flags inside `CaseDetailDto` and, ideally, inside `CaseListItemDto`.
- keep `FlagDto` as the master definition shape.

---

## 5. Synoptics API Changes

Current controller routes are correct and complete.

Required DTO alignment only:
- `GenerateSynopticResponse` should preserve existing fields and ensure UI-facing field names are present.
- `FieldValueDto` should support separate AI suggestion and current value semantics.
- `SynopticReportInstanceDto` should include additional workflow metadata.
- if the UI uses a dedicated synoptic list or summary endpoint, ensure it returns the updated `SynopticReportInstanceDto` shape.

No route-level changes are required unless the UI route names differ from the current `/api/v1/synoptics/*` contract.

---

## 6. Terminology / Code Search Changes

Current route:
- `GET /api/v1/codes/search`

Required changes:
- implement a real search backend instead of returning an empty list.
- return results matching `CodeSearchResult` and the UI code lookup contract.
- ensure `system`, `subtype`, `maxResults`, and query semantics match the UI client.

---

## 7. Worklist Filter Support

Required backend changes in `CasesController.List` and underlying `CaseService`:
- support `clientId`, `clientName`, `requestingProvider`, `assignedTo`, `priority`, `reportingMode`, `dateFrom`, `dateTo`, `patientName`, `accessionNo`, and any additional search facets the UI requires.
- preserve existing `status`, `search`, `page`, and `pageSize` behavior.
- expose filter names that match UI query semantics wherever possible.

---

## 8. Route Naming / Contract Consistency

Required route alignments:
- add `/api/v1/audit/logs` alias or update UI to `/api/v1/audit`
- add `/api/v1/audit/errors`
- keep `/api/v1/cases`, `/api/v1/cases/{id}`, `/api/v1/cases/{id}/detail`, `/api/v1/cases/by-accession/{accession}`
- preserve `/api/v1/synoptics/*`, `/api/v1/flags/*`, `/api/v1/codes/search`

If the UI expects alternate route forms, implement controller route aliases rather than duplicating behavior in separate logic paths.

---

## 9. Implementation Notes

- Treat `CaseDetailDto` as the authoritative UI contract for detailed case views.
- Preserve `CaseDataDto` only for legacy LIS compatibility if required by existing backend flows.
- Map legacy fields to UI structures explicitly in service layer constructors:
  - `DiagnosisText` → `diagnostic.primaryDiagnosis`
  - `MicroscopicFindings` → `diagnostic.microscopicDescription`
  - `GrossDescription` → `diagnostic.grossDescription`
  - `CodingJson` → structured `coding`
- Implement the backend case list payload with enough nested data to avoid frontend null/missing field casting and mock fallbacks.

---

## 10. Priorities

### High priority
- `CaseListItemDto` enrichment or batch details endpoint
- `CaseDetailDto` redesign
- audit route alias and confidence handling
- error log endpoints
- worklist filter support

### Medium priority
- `SpecimenDto` enhancement
- applied flag attachment in case payloads
- synoptic DTO field alignment

### Low priority
- `CodesController.Search` implementation
- code search relevance/scoring enhancements

---

## Recommended Next Step

Implement the DTO contract changes in `ForMedrixAI.Core.DTOs\AllDtos.cs`, then update `CasesController`, `AuditController`, and `SynopticsController` to use the new UI-aligned DTOs.

After that, wire the `CaseService` and repository layer to populate the new nested structures from the existing data model.
