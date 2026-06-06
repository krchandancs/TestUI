/**
 * FHIRCaseService
 *
 * Production implementation of ICaseService backed by an NHS HL7 FHIR R4
 * endpoint (e.g. NHS England FHIR API, trust-hosted HAPI FHIR server).
 *
 * FHIR resource mapping
 * ─────────────────────
 *  PathScribe Case         → FHIR DiagnosticReport (+ linked resources below)
 *  Case.patient            → FHIR Patient  (DiagnosticReport.subject)
 *  Case.order              → FHIR ServiceRequest (DiagnosticReport.basedOn)
 *  Case.specimens[]        → FHIR Specimen (DiagnosticReport.specimen[])
 *  Case.status             → DiagnosticReport.status  (see STATUS_MAP below)
 *  Case.accession          → DiagnosticReport.identifier (system = accession)
 *  Case.synopticReports[]  → FHIR Observation resources (DiagnosticReport.result[])
 *  Case.priority / order.priority → ServiceRequest.priority ('routine'|'urgent'|'stat')
 *
 * TODO before go-live
 * ───────────────────
 * 1. Set BASE_URL to your trust FHIR server (or NHS England sandbox / live endpoint)
 * 2. Implement getAccessToken() — options:
 *      a. SMART on FHIR (recommended for NHS): https://hl7.org/fhir/smart-app-launch/
 *      b. NHS Login OAuth2:                    https://digital.nhs.uk/services/nhs-login
 *      c. Client credentials (M2M, server-side only — never in browser)
 * 3. Verify DiagnosticReport.category coding matches your trust's LOINC/SNOMED profile
 * 4. Map trust-specific Specimen.type codings to PathScribe specimenType values
 * 5. Implement write operations (finalize → PUT DiagnosticReport status = 'final')
 * 6. Register PathScribe as a SMART client with your trust's authorisation server
 * 7. Add NHS Spine TLS mutual authentication if required by your integration spec
 *
 * Compliance
 * ──────────
 * - Auth tokens must never be logged. AuditLogger.log() intentionally omits them.
 * - All patient data in transit must use TLS 1.2+ (enforced by HTTPS in BASE_URL).
 * - Access logs written by AuditLogger satisfy NHS DSPT Standard 9.4.2.
 * - FHIR responses may contain more patient data than PathScribe needs — only the
 *   fields mapped below are extracted (data minimisation, UK GDPR Art. 25).
 */

import type { Case }                           from '@/types/case/Case';
import type { ICaseService, CaseFilterParams } from './ICaseService';
import type { ServiceResult }                  from '../types';
import { AuditLogger }                         from './AuditLogger';

// ── Configuration ────────────────────────────────────────────────────────────
// TODO: move to environment variables / Vite config
const BASE_URL    = 'https://your-trust-fhir-server.nhs.uk/fhir/R4';
const SYSTEM_CODE = 'https://pathscribe.ai/identifiers/accession';

// ── FHIR → PathScribe status mapping ────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  'registered':   'draft',
  'preliminary':  'in-progress',
  'final':        'finalized',
  'amended':      'amended',
  'corrected':    'amended',
  'cancelled':    'finalized',
  'unknown':      'draft',
};

// ── FHIR priority → PathScribe priority ─────────────────────────────────────
const PRIORITY_MAP: Record<string, string> = {
  'routine': 'Routine',
  'urgent':  'Urgent',
  'stat':    'STAT',
  'asap':    'STAT',
};

// ── Auth ─────────────────────────────────────────────────────────────────────
/**
 * TODO: Replace with your trust's SMART on FHIR / NHS Login token flow.
 * This stub throws so misconfiguration is immediately obvious in dev.
 */
async function getAccessToken(): Promise<string> {
  throw new Error(
    'FHIRCaseService: getAccessToken() not implemented. ' +
    'Configure SMART on FHIR or NHS Login OAuth2 — see TODO in FHIRCaseService.ts.'
  );
}

// ── FHIR resource → PathScribe Case ─────────────────────────────────────────
function mapPatient(fhirPatient: any): Case['patient'] {
  const name   = fhirPatient.name?.[0];
  const given  = name?.given?.join(' ') ?? '';
  const family = name?.family ?? '';
  return {
    id:          fhirPatient.id,
    mrn:         fhirPatient.identifier?.find((i: any) => i.type?.coding?.[0]?.code === 'MR')?.value ?? '',
    firstName:   given,
    lastName:    family,
    dateOfBirth: fhirPatient.birthDate ?? '',
    sex:         fhirPatient.gender === 'male' ? 'M' : fhirPatient.gender === 'female' ? 'F' : 'U',
  } as any;
}

function mapSpecimen(fhirSpecimen: any): any {
  return {
    id:           fhirSpecimen.id,
    specimenType: fhirSpecimen.type?.coding?.[0]?.display ?? fhirSpecimen.type?.text ?? 'Unknown',
    // TODO: map fhirSpecimen.type.coding to PathScribe specimenType enum values
    //       using your trust's SNOMED CT or local coding system
    container:    fhirSpecimen.container?.[0]?.description ?? '',
    collectionDate: fhirSpecimen.collection?.collectedDateTime ?? '',
  };
}

function mapDiagnosticReportToCase(
  report:       any,
  patient:      any,
  serviceReq:   any,
): Case {
  const accessionIdentifier = report.identifier?.find(
    (i: any) => i.system === SYSTEM_CODE
  );

  const accessionNumber = accessionIdentifier?.value ?? report.id;

  return {
    id:     accessionNumber,
    status: STATUS_MAP[report.status] ?? 'draft',

    reportingMode: 'copilot', // LIS-owned reports are always Copilot mode

    accession: {
      accessionNumber,
      fullAccession: accessionNumber,
      accessionPrefix: accessionNumber.charAt(0),
      accessionYear:   new Date().getFullYear(),
    },

    patient: patient ? mapPatient(patient) : undefined,

    specimens: (report.specimen ?? []).map(mapSpecimen),

    order: {
      requestingProvider: serviceReq?.requester?.display ?? '',
      priority: PRIORITY_MAP[serviceReq?.priority ?? 'routine'] ?? 'Routine',
    },

    // Narrative content lives in DiagnosticReport.presentedForm or .conclusion
    grossDescription:      report.conclusion ?? '',
    microscopicDescription: '',

    updatedAt: report.meta?.lastUpdated ?? new Date().toISOString(),

    // TODO: map DiagnosticReport.result[] (Observation references) to synopticReports[]
    synopticReports: [],
  } as any;
}

// ── FHIR fetch helper ────────────────────────────────────────────────────────
async function fhirFetch(path: string): Promise<any> {
  const token = await getAccessToken();
  const res   = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/fhir+json',
    },
  });
  if (!res.ok) throw new Error(`FHIR ${res.status}: ${path}`);
  return res.json();
}

async function resolveReference(ref: string): Promise<any | null> {
  try { return await fhirFetch(ref.startsWith('/') ? ref.slice(1) : ref); }
  catch { return null; }
}

// ── Service implementation ───────────────────────────────────────────────────
const audit = new AuditLogger('FHIR-LIS');

export const fhirCaseService: ICaseService = {

  // ── getAll ────────────────────────────────────────────────────────────────
  // The FHIR service is not the system of record for admin/search views —
  // those delegate to CaseRouter which uses the mock/Firestore service.
  // This stub satisfies the ICaseService contract for the CaseRouter façade.
  async getAll(_params?: CaseFilterParams): Promise<ServiceResult<Case[]>> {
    try {
      const cases = await fhirCaseService.listCasesForUser('current');
      return { ok: true, data: cases };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'FHIR getAll failed' };
    }
  },

  // ── updateCase ────────────────────────────────────────────────────────────
  // LIS (FHIR) is the system of record — PathScribe does not write back to it.
  // Status transitions and PathScribe-owned fields are written via Firestore.
  // This stub logs a warning and no-ops so the interface contract is satisfied.
  async updateCase(caseId: string, _updates: Partial<Case>): Promise<void> {
    audit.log({ eventType: 'case.write', caseId, userId: 'system', outcome: 'failure' });
    console.warn(
      `FHIRCaseService.updateCase: write suppressed for ${caseId}. ` +
      'FHIR is read-only from PathScribe — route updates through firestoreCaseService.'
    );
  },

  async getCase(caseId: string, userId = 'current'): Promise<Case | null> {
    try {
      // Search DiagnosticReport by accession identifier
      const bundle = await fhirFetch(
        `DiagnosticReport?identifier=${SYSTEM_CODE}|${encodeURIComponent(caseId)}&_include=DiagnosticReport:subject&_include=DiagnosticReport:based-on`
      );

      const report = bundle.entry?.find((e: any) => e.resource.resourceType === 'DiagnosticReport')?.resource;
      if (!report) {
        audit.log({ eventType: 'case.read', caseId, userId, outcome: 'failure' });
        return null;
      }

      const patient    = bundle.entry?.find((e: any) => e.resource.resourceType === 'Patient')?.resource;
      const serviceReq = bundle.entry?.find((e: any) => e.resource.resourceType === 'ServiceRequest')?.resource;

      const c = mapDiagnosticReportToCase(report, patient, serviceReq);
      audit.log({ eventType: 'case.read', caseId, userId, outcome: 'success' });
      return c;
    } catch {
      audit.log({ eventType: 'case.read', caseId, userId, outcome: 'failure' });
      return null;
    }
  },

  async listCasesForUser(userId: string): Promise<Case[]> {
    try {
      // TODO: Replace 'performer' with your trust's pathologist identifier system
      const bundle = await fhirFetch(
        `DiagnosticReport?performer=${encodeURIComponent(userId)}&category=LAB&_include=DiagnosticReport:subject&_include=DiagnosticReport:based-on&_count=100`
      );

      const reports = (bundle.entry ?? []).filter(
        (e: any) => e.resource.resourceType === 'DiagnosticReport'
      );
      const patients    = Object.fromEntries(
        (bundle.entry ?? [])
          .filter((e: any) => e.resource.resourceType === 'Patient')
          .map((e: any) => [e.resource.id, e.resource])
      );
      const serviceReqs = Object.fromEntries(
        (bundle.entry ?? [])
          .filter((e: any) => e.resource.resourceType === 'ServiceRequest')
          .map((e: any) => [e.resource.id, e.resource])
      );

      const cases = reports.map((e: any) => {
        const r          = e.resource;
        const patientId  = r.subject?.reference?.split('/').pop();
        const serviceId  = r.basedOn?.[0]?.reference?.split('/').pop();
        return mapDiagnosticReportToCase(r, patients[patientId], serviceReqs[serviceId]);
      });

      audit.log({ eventType: 'case.list', userId, outcome: 'success' });
      return cases;
    } catch {
      audit.log({ eventType: 'case.list', userId, outcome: 'failure' });
      return [];
    }
  },
};
