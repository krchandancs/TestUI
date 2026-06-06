/**
 * ICaseService
 *
 * Defines the contract that any case data source must satisfy —
 * whether that is a mock, a Firestore collection, an HL7 FHIR R4
 * endpoint, or a direct LIS database connection.
 *
 * Production implementations:
 *  - ILISCaseService  → wraps NHS FHIR DiagnosticReport / Task endpoints
 *  - IOrchCaseService → wraps PathScribe Firestore / PostgreSQL collections
 *
 * Each implementation is responsible for its own auth token management,
 * retry logic, and DSPT-compliant audit logging.  The CaseRouter façade
 * never holds credentials or touches patient data directly.
 */

import type { Case }       from '@/types/case/Case';
import type { CaseStatus } from '@/types/case/CaseStatus';   // local import — used in CaseFilterParams below
export type { CaseStatus } from '@/types/case/CaseStatus';   // re-export for consumers
import type { ServiceResult } from '../types';

// ─── Type aliases expected by services/index.ts and Worklist/types.ts ────────
/** Full case record — alias for Case (LIS-sourced) */
export type PathologyCase = Case;
/** Case scheduling priority */
export type CasePriority = 'Routine' | 'STAT';
/** AI suggestion pipeline status */
export type AIStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'none';
/** Hex or named colour for a flag badge */
export type FlagColor = string;
/** Patient biological sex / gender identity */
export type CaseGender = 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Unknown';

/** Lightweight flag reference attached to a case (not the full FlagService.Flag definition) */
export interface Flag {
  id:        string;
  name:      string;
  color?:    string;
  level:     'case' | 'specimen';
  severity?: number;
}

// ─── Filter parameter contract ────────────────────────────────────────────────
// Used by SearchPage → caseService.getAll() and WorklistPage → caseService.getAll().
// All fields are optional; omitting a field means "no restriction on that axis".

export interface CaseFilterParams {
  // ── Identifier / text search ───────────────────────────────────────────────
  /** Free-text search across accession number and patient name */
  search?: string;
  /** Exact or partial patient full-name match */
  patientName?: string;
  /** MRN / hospital identifier */
  hospitalId?: string;
  /** Accession number (full or partial) */
  accessionNo?: string;

  // ── Accession date range (specimen receivedAt or case createdAt) ───────────
  /** ISO date string, inclusive lower bound for accession date */
  dateFrom?: string;
  /** ISO date string, inclusive upper bound for accession date */
  dateTo?: string;

  // ── Patient demographics ───────────────────────────────────────────────────
  /** E.g. ['Male', 'Female', 'Non-binary'] — normalised to M/F in service */
  genderList?: ('Male' | 'Female' | 'Non-binary' | 'Other' | 'Unknown')[];
  /** ISO date string lower bound for patient date-of-birth */
  dobFrom?: string;
  /** ISO date string upper bound for patient date-of-birth */
  dobTo?: string;
  /** Minimum patient age in years (computed from DOB at query time) */
  ageMin?: number;
  /** Maximum patient age in years (computed from DOB at query time) */
  ageMax?: number;

  // ── Worklist / status ─────────────────────────────────────────────────────
  /** Single status — legacy worklist usage; prefer statusList for SearchPage */
  status?: CaseStatus | CaseStatus[];
  /** One or more workflow statuses to include */
  statusList?: CaseStatus[];
  /** One or more case priorities to include */
  priorityList?: ('Routine' | 'STAT')[];
  /** Filter to a single clinical subspecialty */
  specialty?: string;

  // ── Assignment ─────────────────────────────────────────────────────────────
  /** Pathologist IDs (e.g. 'PATH-001') matched against order.assignedTo */
  pathologistIds?: string[];
  /**
   * Requesting / attending provider names (full display name, e.g. 'Dr. Sarah Chen').
   * SearchPage maps att-N UI IDs → full names before passing; service matches
   * against order.requestingProvider with title-stripped contains logic.
   */
  attendingNames?: string[];

  // ── Clinical content ───────────────────────────────────────────────────────
  /** Partial specimen description keywords */
  specimenList?: string[];
  /** Free-text diagnosis keywords */
  diagnosisList?: string[];
  /**
   * SNOMED CT codes (numeric strings, e.g. '413448000').
   * Matched against case.coding.snomed[].
   */
  snomedCodes?: string[];
  /**
   * ICD-10/11 codes (e.g. 'C50.412').
   * Matched against case.coding.icd10[] with prefix tolerance so 'C50' matches 'C50.412'.
   */
  icdCodes?: string[];

  // ── Protocols & flags ─────────────────────────────────────────────────────
  /**
   * Resolved synoptic templateId values (e.g. 'breast_invasive').
   * SearchPage maps ALL_SYNOPTICS p-keys → templateId before passing.
   * Matched against case.synopticReports[].templateId.
   */
  synopticProtocolIds?: string[];
  /**
   * Case flag display names (e.g. 'STAT — Rush Processing').
   * Matched with name-contains logic so partial selections still connect.
   */
  flagIds?: string[];

  // ── Submitting client ──────────────────────────────────────────────────────
  /** Client IDs (e.g. 'c1') matched against order.clientId */
  clientIds?: string[];
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface ICaseService {
  /**
   * Retrieve a single case by its accession ID.
   * Returns null/undefined if not found; rejects only on infrastructure error.
   */
  getCase(caseId: string): Promise<Case | null | undefined>;

  /**
   * List and filter cases.
   * No params → returns all cases visible to the calling context.
   */
  getAll(params?: CaseFilterParams): Promise<ServiceResult<Case[]>>;

  /**
   * List all cases visible to the given user (worklist view).
   * userId should be the authenticated pathologist's system ID.
   */
  listCasesForUser(userId: string): Promise<Case[]>;

  /**
   * Persist partial updates to an existing case.
   * Used by the report editor, delegation flows, and flag management.
   */
  updateCase(caseId: string, updates: Partial<Case>): Promise<void>;
}
