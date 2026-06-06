// src/types/case/Specimen.ts
// ─────────────────────────────────────────────────────────────
// Clinical-grade specimen model.
// Aligned with:
//   • FHIR Specimen
//   • LIS specimen workflows
//   • CAP synoptic reporting
//   • PathScribe flag + reporting workflows
// ─────────────────────────────────────────────────────────────

import { SpecimenFlag } from "./SpecimenFlag";

export interface SpecimenCollection {
  collectedAt?: string;          // ISO timestamp
  collectedBy?: string;          // Practitioner ID
  method?: string;               // "core biopsy", "excision", "FNA", etc.
  bodySite?: string;             // SNOMED or free text
}

export interface SpecimenProcessing {
  fixative?: string;             // "formalin", "Bouin", "alcohol", etc.
  processingDescription?: string;
  processedAt?: string;          // ISO timestamp
}

export interface SpecimenContainer {
  type?: string;                 // "jar", "slide", "block", etc.
  identifier?: string;           // container barcode
  description?: string;
}

export interface Specimen {
  /** Internal UUID */
  id: string;

  /** Specimen letter or number (A, B, C…) */
  label: string;

  /** Human-readable description ("Left breast biopsy") */
  description: string;

  /** Full display label ("Specimen A — Left breast biopsy") */
  displayName?: string;

  /** Collection metadata (FHIR Specimen.collection) */
  collection?: SpecimenCollection;

  /** Processing metadata (fixative, processing steps) */
  processing?: SpecimenProcessing;

  /** Container metadata (jar, slide, block) */
  container?: SpecimenContainer;

  /** When the lab received the specimen */
  receivedAt?: string; // ISO timestamp

  /** When the specimen was collected (if known) */
  collectedAt?: string; // ISO timestamp

  /** Flags applied to this specimen */
  specimenFlags?: SpecimenFlag[];

  /** Optional SNOMED specimen type code */
  snomedTypeCode?: string;

  /** Optional SNOMED anatomic site code */
  snomedSiteCode?: string;

  /** Whether this specimen is active (not deleted/retired) */
  active?: boolean;

  /** Audit metadata */
  createdAt?: string;
  updatedAt?: string;
}