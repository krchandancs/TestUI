# API Gap Analysis Report

## Executive Summary

This report now reflects the complete UI contract and the current backend implementation.

The key finding is:
- The UI requires a rich `Case` model with nested `patient`, `order`, `specimens`, `caseFlags`, `specimenFlags`, `diagnostic`, and `coding` structures.
- The backend currently exposes only a lightweight `CaseListItemDto` for worklist listing, and a flat `CaseDetailDto` for details.
- Several backend routes and field names do not match the UI contract exactly, especially for audit logging, error logs, case filters, and synoptic field metadata.

The backend source reviewed for this analysis is:
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\CasesController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\AuditController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\SynopticsController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\FlagsController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\TemplatesController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.API\Controllers\LisSimulationController.cs`
- `C:\Users\Administrator\source\repos\ForMedrixAI-API-PathScribe\src\ForMedrixAI.Core\DTOs\AllDtos.cs`

## Gap Summary

| Category | Gap | Severity | Notes |
|---|---|---|---|
| Case list payload | Missing UI-shaped case object on worklist | High | `CaseListItemDto` only contains summary fields, not nested `patient`/`order`/`specimens`/`flags` |
| Case detail payload | Flat DTO does not match UI object hierarchy | High | `CaseDetailDto` has many UI fields missing or flattened |
| Patient demographics | Partial support only | High | `Patient` object is not nested; backend uses separate fields and misses some UI demo fields |
| Order metadata | Partial support | High | backend only exposes `OrderPriority` and provider in some DTOs, not full UI `order` object |
| Diagnostic metadata | Partial/flat | Critical | backend lacks secondary diagnoses, diagnosis codes, issued/finalized metadata, structured synoptic diagnostic info |
| Specimen metadata | Underpowered | High | `SpecimenDto` is barebones and missing UI collection/processing/container/flag fields |
| Flags on case/specimen | Not embedded in case responses | High | UI requires applied flags inside case payloads, backend only exposes separate flag definitions |
| Case list filters | Missing filter support | High | backend list endpoint supports only `status`, `search`, `page`, `pageSize` |
| Audit log route | Path mismatch and incomplete fields | Medium | UI client expects `/audit/logs`; backend exposes `/audit` only |
| Error logs | Not implemented | Medium | UI has error log UI but backend offers no endpoint |
| Terminology search | Stub / no implementation | Medium | `CodesController` exists but returns an empty list and lacks full UI contract |
| Synoptic field metadata | Naming mismatch | Medium | UI expects `aiSource`, `confidence`, `dirty`, `aiValue`, etc. backend uses different field names |

---

## Detailed Gap Analysis

### 1. Worklist / Case List Response

#### Backend reality
`CasesController.List` returns `PagedResult<CaseListItemDto>` with:
- `Id`
- `AccessionNumber`
- `PatientName`, `PatientFirstName`, `PatientLastName`, `PatientSex`, `PatientMrn`
- `SpecimenSite`
- `CaseStatus`
- `UiStatus`
- `HasFinalDiagnosis`
- `CreatedAt`
- `AssignedTo`
- `OrderPriority`

#### UI needs
`Case` in `src/types/case/Case.ts` requires:
- `accession: AccessionMetadata`
- `originHospitalId`
- `originEnterpriseId`
- `patient: Patient`
- `order: OrderMetadata`
- `specimens: Specimen[]`
- `caseFlags?: CaseFlag[]`
- `specimenFlags?: SpecimenFlag[]`
- `diagnostic?: DiagnosticMetadata`
- `coding?: CaseCoding`
- `sharedWith?: string[]`
- `acceptedBy?`, `returnedBy?`, `closedBy?`
- `reportingMode?`
- `isReferenceLabCase?`

#### Action
The backend list response must be enriched or a batch detail endpoint must be added.

---

### 2. Case Detail / Full Case Payload

#### Backend reality
`CaseDetailDto` currently exposes flat fields such as:
- `AccessionNumber`
- `UiStatus`
- `PatientFirstName`, `PatientLastName`, `PatientName`, `PatientSex`, `PatientMrn`, `PatientDob`
- `GrossDescription`, `MicroscopicDescription`, `AncillaryStudies`, `PrimaryDiagnosis`
- `ClinicalHistory`, `SpecimenType`, `SpecimenSite`
- `OrderingProvider`, `CptCode`, `OrderPriority`, `ReportingMode`, `CodingJson`
- `OverallConfidence`, `Specimens`, `SynopticReports`

#### UI needs
A nested, UI-aligned `Case` object with:
- `accession: AccessionMetadata`
- `patient: Patient`
- `order: OrderMetadata`
- `diagnostic?: DiagnosticMetadata`
- `coding?: CaseCoding`
- `caseFlags?: CaseFlag[]`
- `specimenFlags?: SpecimenFlag[]`
- `assignmentHistory?: AssignmentEvent[]`
- `sharedWith?`, `acceptedBy?`, `returnedBy?`, `closedBy?`
- `isReferenceLabCase?`
- `originHospitalId`, `originEnterpriseId`

#### Specific field gaps
- `CodingJson` is a string, but UI expects structured `coding` arrays.
- `PrimaryDiagnosis` is not a nested `diagnostic.primaryDiagnosis` field.
- `GrossDescription`, `MicroscopicDescription`, `AncillaryStudies` are present but should be nested under `diagnostic`.
- `SpecimenType` and `SpecimenSite` are flat, but UI requires full `specimens[]`.
- No `caseFlags` or `specimenFlags` arrays are returned.
- No `assignmentHistory` or case routing metadata exists.

#### Action
Redesign the detail DTO to return a UI-shaped case object, not a flat legacy LIS payload.

---

### 3. Patient / Accession Contract

#### UI fields
`Patient` requires:
- `id`
- `mrn`
- `firstName`, `lastName`, `middleName?`
- `dateOfBirth?`
- `sex?`
- `phone?`, `email?`, `address?`

#### Backend fields
Current case DTOs expose only:
- `PatientMrn`
- `PatientName`
- `PatientFirstName`
- `PatientLastName`
- `PatientSex`
- `PatientDob`

#### Action
Return a nested `patient` object so API matches UI types. Add any optional demographic fields the UI may display.

---

### 4. Order Metadata Contract

#### UI order model
`OrderMetadata` contains:
- `priority`
- `requestingProvider?`
- `clientId?`
- `clientName?`
- `reasonCodes?`
- `clinicalIndication?`
- `receivedDate?`
- `assignedTo?`
- `assignedParticipationTypeId?`

#### Backend support
`CaseListItemDto` and `CaseDataDto` only expose:
- `OrderPriority`
- `OrderingProvider`
- `OrderingSpecialty`
- `CptCode`

#### Action
Create a true `order` object in case responses and add missing UI fields.

---

### 5. Specimen Contract

#### UI specimen model
UI requires structured specimen metadata, including:
- `displayName?`
- `collection?`
- `processing?`
- `container?`
- `specimenFlags?`
- `snomedTypeCode?`
- `snomedSiteCode?`
- `active?`
- `createdAt?`, `updatedAt?`

#### Backend `SpecimenDto`
Only provides basic fields and lacks these UI metadata.

#### Action
Enhance `SpecimenDto` to match UI specimen structure.

---

### 6. Flag Attachment Contract

#### UI needs
- applied case flags inside case payload
- applied specimen flags inside case payload
- flag instances with UI-friendly color, severity, category, descriptions, audit metadata

#### Backend reality
- `FlagDto` exists for flag definitions
- no `caseFlags` or `specimenFlags` arrays in case details

#### Action
Embed applied flag instances in case responses.

---

### 7. Case List Filter Contract

#### Backend support
`CasesController.List` accepts only:
- `status`
- `search`
- `page`
- `pageSize`

#### UI expects
A broader filter set, including:
- `clientId`, `clientName`
- `requestingProvider`
- `assignedTo`
- `priority`
- `reportingMode`
- `from`, `to`
- `patientName`, `accessionNo`
- code filters, gender/age ranges, specialty/subspecialty

#### Action
Implement backend support for the full UI worklist filter contract.

---

### 8. Synoptic Shape and Field Metadata

#### Backend strengths
- Synoptic generate/update/verify/finalize/approve/amend endpoints exist
- `SynopticReportInstanceDto` and `FieldValueDto` are broadly close to UI needs

#### Remaining mismatches
- UI wants `aiSource` and `aiValue` semantics rather than backend `SourceText` only
- UI wants `dirty`, `disputeReason`, and `attested` flags on synoptic fields
- UI expects `assignedToName`, `requiresCountersign`, `countersignedBy`, `countersignedAt`, `deferredPending`, `comment` on report instances

#### Action
Align synoptic DTO field names and report metadata with the UI contract.

---

### 9. Terminology / Code Search Gap

#### Backend reality
`CodesController` exposes `GET /api/v1/codes/search`, but it is currently a TODO stub and always returns an empty list.

#### UI expectations
The UI needs code search results for medical terminology lookup with fields matching `MedicalCode` / `ApiCode` semantics.

#### Action
Implement terminology search or return a UI-aligned result object for code searching.

---

### 10. Audit Log Route and Field Gaps

#### Backend reality
- route: `GET /api/v1/audit`
- response: `PagedResult<UnifiedAuditLogDto>`
- `UnifiedAuditLogDto` sets `Confidence` to null in controller

#### UI expectations
- route: `GET /api/v1/audit/logs`
- fields: `event`, `detail`, `user`, `caseId`, `confidence`
- filters: `type`, `user`, `from`, `to`, `search`, `page`, `pageSize`

#### Action
- support UI route naming or update client route to backend path
- return real audit confidence values
- align query parameter names with UI

---

### 10. Error Logs — Backend missing endpoint

#### UI needs
- `GET /api/v1/audit/errors`
- `POST /api/v1/audit/errors`
- `PUT /api/v1/audit/errors/{id}/resolve` (optional)
- fields: `id`, `timestamp`, `severity`, `code`, `message`, `source`, `caseId`, `resolved`

#### Action
Implement error log endpoints and align schema with UI `ErrorLog` interface.

---

### 11. Backend Endpoint Naming / Route Mismatches

#### Current mismatches
- UI client expects `/api/v1/audit/logs` but backend exposes `/api/v1/audit`
- UI client expects `/api/v1/audit/errors` though backend has no error log controller

#### Action
Either add route aliases in backend or rename UI client routes to match the backend with a strict contract review.

---

## Recommended Backend Contract Changes

### Case API
- `GET /api/v1/cases` should return UI-shaped case payloads or support a dedicated batch detail endpoint.
- `GET /api/v1/cases/{id}/detail` and `GET /api/v1/cases/by-accession/{accession}` should return nested case objects.
- `CaseListItemDto` should be extended to include `accession`, `patient`, `order`, `specimens`, `caseFlags`, `specimenFlags`, `coding`, `createdAt`, `updatedAt`, `sharedWith`, routing metadata, and `isReferenceLabCase`.
- `CaseDetailDto` should be redesigned to match UI TypeScript types exactly, with nested `patient`, `order`, `diagnostic`, `coding`, `specimens`, `caseFlags`, `specimenFlags`, and `assignmentHistory`.

### Specimen DTO
- Add `displayName`, `collection`, `processing`, `container`, `specimenFlags`, `snomedTypeCode`, `snomedSiteCode`, `active`, `createdAt`, and `updatedAt`.

### Flags
- Return applied case/specimen flag instances inside case payloads.
- Keep `FlagDto` for definitions, but ensure applied flags are separately attached to cases.

### Synoptics
- Expose `fieldId`, `label`, `type`, `required`, `value`, `aiValue`, `confidence`, `aiSource`, `verification`, `dirty`, `disputeReason`, `attested`.
- Ensure report instances include UI metadata like `assignedToName`, `requiresCountersign`, `countersignedBy`, `countersignedAt`, `deferredPending`, `comment`.

### Audit & Error Logs
- Align backend route paths with UI routes or update UI accordingly.
- Add error log endpoints.
- Return `confidence` for AI audit events.

### Filters
- Add support for `clientId`, `clientName`, `requestingProvider`, `assignedTo`, `priority`, `reportingMode`, `from`, `to`.
- Consider additional UI parameters such as `patientName`, `accessionNo`, code-based filters, gender/age filters.

### Field name alignment
- Replace legacy string blobs like `CodingJson` with structured objects.
- Prefer UI field names in API contracts.

---

## Conclusion

The backend currently supports core pathways but does not yet match the UI contract in several critical places.

This updated analysis now covers:
- every UI model field required for worklist and case detail
- backend route/DTO mismatches
- audit/error log contract gaps
- specific backend fields and routes that need adding or changing

The next step is to implement these backend contract changes so the API matches UI expectations exactly, without relying on frontend fallback logic or mock data.
