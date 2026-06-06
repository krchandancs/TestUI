# PathScribe — Production Migration Guide
## `src/services/cases/`

This document describes the exact steps required to replace the mock case
services with production data sources when PathScribe goes live.

---

## Current architecture (mock / dev)

```
CaseRouter
    ├── mockCaseService              (LIS cases — in-memory, localStorage)
    └── mockOrchestratorCaseService  (Orchestrator cases — in-memory, localStorage)
```

## Target architecture (production)

```
CaseRouter
    ├── FHIRCaseService    (LIS cases — NHS HL7 FHIR R4 endpoint)
    └── FirestoreCaseService  (Orchestrator cases — PathScribe Firestore)
```

---

## Step 1 — Wire up the Firestore service

**File:** `FirestoreCaseService.ts` (already in this directory)

1. Confirm Firestore project ID and collection name match your production environment
2. Ensure Firebase Auth is initialised in `src/contexts/AuthContext.tsx` before
   `FirestoreCaseService` is called
3. Set Firestore security rules to restrict reads to authenticated pathologists
   belonging to the correct organisation
4. In `CaseRouter.ts`, replace the constructor argument:

```typescript
// Before
import { mockOrchestratorCaseService } from './mockOrchestratorCaseService';

// After
import { firestoreCaseService } from './FirestoreCaseService';
```

```typescript
// In the singleton at the bottom of CaseRouter.ts:
// Before
export const caseRouter = new CaseRouter(mockCaseService, mockOrchestratorCaseService);

// After — swap orchestrator service only; LIS still mocked until Step 2
export const caseRouter = new CaseRouter(mockCaseService, firestoreCaseService);
```

---

## Step 2 — Wire up the FHIR service

**File:** `FHIRCaseService.ts` (already in this directory)

### 2a. Identify your FHIR endpoint

| Environment       | URL pattern                                             |
|-------------------|---------------------------------------------------------|
| NHS sandbox       | `https://sandbox.api.service.nhs.uk/pathology/FHIR/R4` |
| Trust-hosted HAPI | `https://fhir.your-trust.nhs.uk/R4`                    |
| Azure API for FHIR| `https://your-workspace.fhir.azurehealthcareapis.com`   |

Set `BASE_URL` in `FHIRCaseService.ts` or move it to a Vite env variable:
```
VITE_FHIR_BASE_URL=https://fhir.your-trust.nhs.uk/R4
```

### 2b. Implement authentication

Choose **one** of the following:

**Option A — SMART on FHIR (recommended for NHS patient-facing apps)**
- Register PathScribe as a SMART client with your trust's authorisation server
- Implement the SMART launch sequence in `getAccessToken()` in `FHIRCaseService.ts`
- Reference: https://hl7.org/fhir/smart-app-launch/

**Option B — NHS Login OAuth2 (for pathologist-facing apps)**
- Obtain client credentials from NHS Digital / NHS England
- Reference: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers

**Option C — Client credentials (server-side / M2M only)**
- Never expose client secrets in the browser bundle
- Use a Vercel serverless function (already exists at `api/ai/anthropic/v1/messages.ts`)
  as a proxy — add a FHIR proxy endpoint alongside it

### 2c. Verify FHIR resource mappings

Open `FHIRCaseService.ts` and check each `TODO` comment:

- `mapSpecimen()` — map your trust's SNOMED CT / local codes to PathScribe
  `specimenType` values
- `mapDiagnosticReportToCase()` — verify `DiagnosticReport.identifier.system`
  matches the accession identifier system your LIS uses
- `listCasesForUser()` — replace `performer` search parameter with whichever
  FHIR search parameter your LIS uses to link reports to pathologists
  (common options: `performer`, `resultsInterpreter`, `_has:PractitionerRole`)

### 2d. Replace the LIS service in CaseRouter

```typescript
// Before
import { mockCaseService } from './mockCaseService';

// After
import { fhirCaseService } from './FHIRCaseService';
```

```typescript
// Singleton — after both steps complete:
export const caseRouter = new CaseRouter(fhirCaseService, firestoreCaseService);
```

---

## Step 3 — Audit logging

`AuditLogger.ts` currently writes to `console.debug` in development.

For production, replace the `console.debug` call with a write to your
audit store. Requirements differ by jurisdiction:

| Jurisdiction | Standard              | Minimum requirement                              |
|--------------|-----------------------|--------------------------------------------------|
| England      | NHS DSPT Standard 9.4 | Append-only log, 1-year retention, role recorded |
| Scotland     | CNORIS / NHSScotland  | Same as DSPT                                     |
| EU           | UK GDPR Art. 5(f)     | Integrity + confidentiality of processing        |
| US (if CAP)  | CAP Accreditation     | Access audit trail for finalized reports         |

**Recommended targets:**
- Azure Monitor / Log Analytics (NHS Azure tenants)
- AWS CloudWatch (US deployments)
- Splunk (enterprise, mixed environments)

The log entry shape in `AuditLogger.ts` is already structured for these
destinations. Add `justificationCode`, `sessionId`, and `dataController`
fields (marked as comments) when your trust's IG team specifies them.

---

## Step 4 — Remove mock files

Once both production services are verified in staging, delete:

```
src/services/cases/mockCaseService.ts
src/services/cases/mockOrchestratorCaseService.ts
```

Do **not** delete:
```
src/services/cases/ICaseService.ts       ← keep: the contract
src/services/cases/CaseRouter.ts         ← keep: the façade
src/services/cases/AuditLogger.ts        ← keep: compliance logging
src/services/cases/FHIRCaseService.ts    ← keep: production LIS service
src/services/cases/FirestoreCaseService.ts ← keep: production Orch service
src/services/cases/PRODUCTION_MIGRATION.md ← keep: this document
```

---

## Step 5 — UK/EU data governance checklist

Before go-live, confirm with your IG lead:

- [ ] PathScribe registered as a data processor under the NHS Trust's ROPA
- [ ] Data Processing Agreement (DPA) in place between PathScribe and each Trust
- [ ] FHIR endpoint access logged at the Trust's network boundary (Spine proxy)
- [ ] Firestore data residency confirmed as UK/EU region
      (`europe-west2` for London, `europe-west1` for Belgium)
- [ ] Firebase Security Rules reviewed by a qualified security assessor
- [ ] Patient data never written to `localStorage` or `sessionStorage` in production
      (current mock code uses localStorage — audit all `storageSet` calls)
- [ ] TLS 1.2+ enforced on all endpoints
- [ ] NHS DSP Toolkit submission updated to reflect PathScribe as a connected system
- [ ] Caldicott Guardian approval obtained if accessing identifiable patient data

---

## Routing key — future maintenance

The `O26-` prefix in `CaseRouter.ts` is a development convenience.

In production, replace `isOrchCase()` with a call to a lightweight
**Case Registry** microservice that maps `{ caseId → serviceType }` without
touching patient data. This satisfies UK GDPR Article 25 (data minimisation)
by ensuring the router never needs to fetch or inspect patient records to
make routing decisions.

```typescript
// Future isOrchCase() replacement:
async function resolveService(caseId: string): Promise<'lis' | 'orch'> {
  const res = await fetch(`/api/case-registry/${caseId}/service-type`);
  const { serviceType } = await res.json();
  return serviceType;
}
```

