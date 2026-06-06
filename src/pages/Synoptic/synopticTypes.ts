// synopticTypes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared types for SynopticReportPage and its sub-components.
// Extracted from SynopticReportPage.tsx — do not re-define elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType   = 'text' | 'select' | 'comment';
export type CaseRole    = 'attending' | 'resident';

export const ROLE_META: Record<CaseRole, { label: string; color: string; bg: string; border: string }> = {
  attending: { label: 'Attending Pathologist', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
  resident:  { label: 'Resident / Fellow',     color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
};

export type CodeSource  = 'system' | 'ai' | 'manual';
export type SpecimenStatus = 'complete' | 'alert' | 'pending';

export type FieldVerification = 'unverified' | 'verified' | 'disputed';

export interface SynopticField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  confidence: number;
  aiSource: string;
  value: string;
  aiValue: string;
  dirty: boolean;
  verification: FieldVerification; 
  disputeReason?: string;
  attested?: boolean;
}

export interface MedicalCode {
  id: string;
  system: 'SNOMED' | 'ICD';
  code: string;
  display: string;
  source: CodeSource;
  /** Populated by AI only: 0-100 confidence score for this code assignment */
  confidence?: number;
  /** Populated by AI only: the report phrase that led to this code, e.g. 'Micro: "Lymphovascular invasion is present"' */
  aiSource?: string;
  /** AI codes only: pathologist review state — mirrors FieldVerification */
  verification?: FieldVerification;
}

// ─── Synoptic report node (recursive tree) ───────────────────────────────────
// Each node is an independent instance of a CAP protocol module.
// Children are fixed by the protocol template — pathologists fill values only.

export interface SynopticReportNode {
  instanceId: string;
  templateId: string;
  title: string;
  status: 'draft' | 'finalized';

  // FIELD GROUPS (UI expects all of these)
  tumorFields: SynopticField[];
  marginFields: SynopticField[];
  lymphNodes?: SynopticField[];        // ← add
  ancillaryFields?: SynopticField[];   // ← add
  specimenFields?: SynopticField[];    // ← add
  biomarkerFields: SynopticField[];

  specimenComment: string;
  codes: MedicalCode[];

  children: SynopticReportNode[];
}

export interface SpecimenSynoptic {
  specimenId: number;
  specimenName: string;
  specimenStatus: SpecimenStatus;
  specimenComment: string;
  reports: SynopticReportNode[];  // top-level reports for this specimen
}

export interface CaseData {
  accession: string;
  patient: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  mrn: string;
  protocol: string;
  overallConfidence: number;
  autoPopulated: string;
  caseComments: Partial<Record<CaseRole, string>>;
  synoptics: SpecimenSynoptic[];
}

export interface SpecimenOption {
  index: number;
  id: number;
  specimenId?: string | null;
  name: string;
}

export interface OtherRoleComment {
  role: CaseRole;
  text: string;
  createdAt: string;
}

// ─── Navigation: path through the tree ───────────────────────────────────────
// activePath = [specimenIndex, reportIndex, childIndex, grandchildIndex, ...]
// activePath[0] = which specimen
// activePath[1] = which top-level report within that specimen
// activePath[2+] = which child at each subsequent level
export type ActivePath = number[];
