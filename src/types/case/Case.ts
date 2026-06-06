// src/types/case/Case.ts
// ─────────────────────────────────────────────────────────────
// Authoritative Case domain model for PathScribe.
// FHIR-aligned (ServiceRequest, DiagnosticReport, Specimen, Task)
// ─────────────────────────────────────────────────────────────

import { Patient } from "./Patient";
import { Specimen } from "./Specimen";
import { CaseFlag } from "./CaseFlag";
import { SpecimenFlag } from "./SpecimenFlag";
import { CaseStatus } from "./CaseStatus";

export interface CaseCoding {
  icd10?: string[];
  icd11?: string[];
  icdO?: string[];
  snomed?: string[];
  loinc?: string[];
  cpt?: string[];
}

export interface AssignmentEvent {
  timestamp: string;
  assignedTo?: string;
  assignedBy?: string;
  reason?: string;
}

export interface OrderMetadata {
  priority: "Routine" | "STAT" | "ASAP" | "Critical";
  requestingProvider?: string;
  /** ID reference to the Client Dictionary — the institution that sent the specimen */
  clientId?: string;
  /** Cached display name — avoids async lookup on every render */
  clientName?: string;
  reasonCodes?: string[];
  clinicalIndication?: string;
  receivedDate?: string;
  assignedTo?: string;
  /** Participation type of the assigned pathologist — e.g. 'primary', 'consultant' */
  assignedParticipationTypeId?: string;
}

export interface DiagnosticMetadata {
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  diagnosisCodes?: string[];
  issuedDate?: string;
  finalizedBy?: string;
  synoptic?: {
    tumorType?: string;
    grade?: string;
    size?: string;
    margins?: string;
    lymphovascularInvasion?: string;
    biomarkers?: { er?: string; pr?: string; her2?: string; ki67?: string };
  };
  grossDescription?: string;
  microscopicDescription?: string;
  ancillaryStudies?: string;
}

export interface AccessionMetadata {
  accessionNumber: string;
  accessionPrefix?: string;
  accessionYear?: number;
  fullAccession?: string;
  caseNumber?: number;
  externalAccession?: string;
}

// ─────────────────────────────────────────────────────────────
// Synoptic Report Instance
// Represents one template attached to one specimen.
// A case can have many of these (multiple specimens × multiple templates).
// ─────────────────────────────────────────────────────────────
export type AiFieldVerification = 'unverified' | 'verified' | 'disputed';

export interface AiFieldSuggestion {
  value: string | string[];
  confidence: number;        // 0–100
  source: string;            // e.g. 'Gross: "2.3 × 1.8 × 1.5 cm"'
  verification: AiFieldVerification;
}

export interface SynopticReportInstance {
  /** Unique ID for this report instance */
  instanceId: string;
  /** Which specimen this report belongs to */
  specimenId: string;
  /** The template used (e.g. 'breast_invasive') */
  templateId: string;
  /** Human-readable template name (cached for sidebar display) */
  templateName: string;
  /** User's answers for this report */
  answers: Record<string, string | string[]>;
  /** AI-suggested values per field — keyed by fieldId */
  aiSuggestions?: Record<string, AiFieldSuggestion>;
  /** Draft | finalized */
  status: 'draft' | 'finalized' | 'pending-countersign' | 'deferred';
  /** If deferred, what is pending (e.g. 'IHC', 'Molecular panel', 'FISH') */
  deferredPending?: string;
  /** Per-report comment (html) */
  comment?: string;

  // ── Synoptic-level assignment (parent-child sign-off) ──────────────────
  /** Pathologist assigned to finalise this specific synoptic (may differ from case owner) */
  assignedTo?: string;
  /** Display name of assigned pathologist — cached for UI */
  assignedToName?: string;
  /** User ID of who assigned it */
  assignedBy?: string;
  /** When this synoptic was assigned */
  assignedAt?: string;
  /** Whether case owner must countersign after assignee finalises */
  requiresCountersign?: boolean;
  /** Who countersigned */
  countersignedBy?: string;
  /** When countersigned */
  countersignedAt?: string;
  /** Note from the assigning pathologist */
  assignmentNote?: string;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Main Case model
// ─────────────────────────────────────────────────────────────
export interface Case {
  id: string;

  // ── Multi-report synoptic system ──────────────────────────
  // Each entry is one template instance attached to one specimen.
  synopticReports?: SynopticReportInstance[];

  // ── Legacy single-report fields (kept for backwards compat) ──
  // Used by cases seeded before synopticReports[] was introduced.
  // New code should prefer synopticReports[].
  synopticTemplateId?: string;
  synopticAnswers?: Record<string, string | string[]>;

  accession: AccessionMetadata;
  originHospitalId: string;
  originEnterpriseId: string;
  isReferenceLabCase?: boolean;

  patient: Patient;
  specimens: Specimen[];
  order: OrderMetadata;
  assignmentHistory?: AssignmentEvent[];
  diagnostic?: DiagnosticMetadata;
  coding?: CaseCoding;
  caseFlags?: CaseFlag[];
  specimenFlags?: SpecimenFlag[];
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  sharedWith?: string[];
  acceptedBy?: string;
  returnedBy?: string;
  closedBy?: string;
  reportingMode?: "pathscribe" | "native" | "copilot";
}
