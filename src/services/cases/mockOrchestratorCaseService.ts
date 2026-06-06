// src/services/cases/mockOrchestratorCaseService.ts
// ─────────────────────────────────────────────────────────────
// Orchestrator-mode mock cases for PathScribe development & QA.
//
// Assigned users:
//   PATH-001    — Pete Nimmo        (pete.nimmo@pathscribe.ai / demo@pathscribe.ai)
//   PATH-UK-001 — Paul Carter       (paul.carter@mft.nhs.uk)
//   PATH-US-001 — Amber Fehrs-Battey (amber.fehrs@demo.pathscribe.ai)
// ─────────────────────────────────────────────────────────────

import type { ICaseService } from './ICaseService';
import type { Case } from '../../types/case/Case';
import { storageGet, storageSet } from '../mockStorage';

// v2 key forces reset after reportingMode fix (was 'pathscribe', now 'orchestrator')
const STORAGE_KEY = 'orch_cases_v2';
const delay = (ms = 30) => new Promise(res => setTimeout(res, ms));

function isoYearsAgo(years: number, month = 6, day = 15): string {
  return new Date(new Date().getFullYear() - years, month - 1, day).toISOString();
}
function isoDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString();
}
function iid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Pete Nimmo (PATH-001) — 5 cases ─────────────────────────

const PETE_CASES: Case[] = [

  {
    id: 'O26-0001', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0001', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0001' },
    originHospitalId: 'HOSP-001', status: 'draft' as any,
    patient: { id: 'OPAT-001', mrn: '200001', firstName: 'Robert', lastName: 'Ashford', dateOfBirth: isoYearsAgo(67, 4, 22), sex: 'M' },
    specimens: [
      { id: 'O26-0001-SP-A', label: 'A', description: 'Right hemicolectomy',                   receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0001-SP-B', label: 'B', description: 'Ileocolic lymph nodes, separate packet', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0001-SP-C', label: 'C', description: 'Appendix',                              receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Mr. James Caldwell', clientId: 'c1', clientName: "St. Catherine's University Hospital", clinicalIndication: 'Colorectal adenocarcinoma. CT: 4.2 cm mass at hepatic flexure, no distant metastases. CEA 12.4. Proceeding to right hemicolectomy.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0001-SP-A_colon_${iid()}`, specimenId: 'O26-0001-SP-A', templateId: 'colon_resection', templateName: 'CAP Colon & Rectum Carcinoma — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0002', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0002', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0002' },
    originHospitalId: 'HOSP-001', status: 'draft' as any,
    patient: { id: 'OPAT-002', mrn: '200002', firstName: 'Patricia', lastName: 'Okafor', dateOfBirth: isoYearsAgo(61, 9, 3), sex: 'F' },
    specimens: [
      { id: 'O26-0002-SP-A', label: 'A', description: 'Right lower lobe lobectomy',      receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0002-SP-B', label: 'B', description: 'Station 7 subcarinal lymph nodes', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Mr. Andrew Pearce', clientId: 'c1', clientName: "St. Catherine's University Hospital", clinicalIndication: 'Right lower lobe mass 3.1 cm. Core biopsy: adenocarcinoma TTF-1+. EGFR/ALK/ROS1 pending. PET-CT: no distant disease. VATS right lower lobectomy.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0002-SP-A_lung_${iid()}`, specimenId: 'O26-0002-SP-A', templateId: 'lung_resection', templateName: 'CAP Lung — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0003', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0003', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0003' },
    originHospitalId: 'HOSP-001', status: 'draft' as any,
    patient: { id: 'OPAT-003', mrn: '200003', firstName: 'David', lastName: 'Marchetti', dateOfBirth: isoYearsAgo(64, 1, 8), sex: 'M' },
    specimens: [
      { id: 'O26-0003-SP-A', label: 'A', description: 'Radical prostatectomy',    receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0003-SP-B', label: 'B', description: 'Right pelvic lymph nodes',  receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0003-SP-C', label: 'C', description: 'Left pelvic lymph nodes',   receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Mr. Simon Hartley', clientId: 'c1', clientName: "St. Catherine's University Hospital", clinicalIndication: 'Prostate adenocarcinoma. Systematic biopsy: Gleason 3+4=7 (Grade Group 2), PSA 8.2. mpMRI: PI-RADS 4 left mid-gland. Robotic radical prostatectomy with bilateral pelvic lymph node dissection.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0003-SP-A_prostate_${iid()}`, specimenId: 'O26-0003-SP-A', templateId: 'prostate_resection', templateName: 'CAP Prostate Gland — Radical Prostatectomy', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
  } as any,

  {
    id: 'O26-0004', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0004', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0004' },
    originHospitalId: 'HOSP-001', status: 'in-progress' as any,
    patient: { id: 'OPAT-004', mrn: '200004', firstName: 'Sandra', lastName: 'Kovacs', dateOfBirth: isoYearsAgo(44, 7, 19), sex: 'F' },
    specimens: [
      { id: 'O26-0004-SP-A', label: 'A', description: 'Left total mastectomy',                        receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0004-SP-B', label: 'B', description: 'Left axillary sentinel lymph node — level I',   receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Rachel Kim', clientId: 'c2', clientName: 'Westside Surgical Centre', clinicalIndication: 'Triple-negative breast carcinoma. Core biopsy: Grade 3 IDC, Ki-67 78%. BRCA1 pathogenic variant. Neoadjuvant chemotherapy completed. Total mastectomy with sentinel lymph node biopsy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    firstTouchedAt: isoDaysAgo(0),
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0004-SP-A_breast_${iid()}`, specimenId: 'O26-0004-SP-A', templateId: 'breast_resection', templateName: 'CAP Breast — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0005', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0005', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0005' },
    originHospitalId: 'HOSP-001', status: 'draft' as any,
    patient: { id: 'OPAT-005', mrn: '200005', firstName: 'Grace', lastName: 'Nakamura', dateOfBirth: isoYearsAgo(38, 3, 12), sex: 'F' },
    specimens: [
      { id: 'O26-0005-SP-A', label: 'A', description: 'Total thyroidectomy',                   receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'O26-0005-SP-B', label: 'B', description: 'Right central compartment lymph nodes',  receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Thomas Walsh', clientId: 'c1', clientName: "St. Catherine's University Hospital", clinicalIndication: 'Papillary thyroid carcinoma. FNA: malignant (Bethesda VI). Ultrasound: 2.4 cm solid hypoechoic nodule right lobe. Total thyroidectomy with right central compartment dissection.', receivedDate: isoDaysAgo(2), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0005-SP-A_thyroid_${iid()}`, specimenId: 'O26-0005-SP-A', templateId: 'thyroid_resection', templateName: 'CAP Thyroid Gland — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2) }],
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2),
  } as any,
];

// ─── Paul Carter (PATH-UK-001) — 3 cases ─────────────────────

const PAUL_CASES: Case[] = [

  {
    id: 'O26-0006', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0006', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0006' },
    originHospitalId: 'HOSP-002', status: 'draft' as any,
    patient: { id: 'OPAT-006', mrn: '300001', firstName: 'James', lastName: 'Whitmore', dateOfBirth: isoYearsAgo(58, 11, 3), sex: 'M' },
    specimens: [
      { id: 'O26-0006-SP-A', label: 'A', description: 'Left radical nephrectomy', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0006-SP-B', label: 'B', description: 'Renal hilar lymph node',   receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Mr. Gavin Fletcher', clientId: 'c4', clientName: 'Royal Manchester Centre', clinicalIndication: 'Clear cell renal cell carcinoma. CT: 6.8 cm heterogeneous left renal mass with renal vein thrombus, no distant metastases. Left radical nephrectomy.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-UK-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0006-SP-A_kidney_${iid()}`, specimenId: 'O26-0006-SP-A', templateId: 'kidney_resection', templateName: 'CAP Kidney — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0007', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0007', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0007' },
    originHospitalId: 'HOSP-002', status: 'in-progress' as any,
    patient: { id: 'OPAT-007', mrn: '300002', firstName: 'William', lastName: 'Battersby', dateOfBirth: isoYearsAgo(63, 5, 28), sex: 'M' },
    specimens: [
      { id: 'O26-0007-SP-A', label: 'A', description: 'Ivor-Lewis oesophagectomy',   receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0007-SP-B', label: 'B', description: 'Mediastinal lymph nodes',       receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0007-SP-C', label: 'C', description: 'Coeliac axis lymph nodes',      receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Mr. Alistair Drummond', clientId: 'c4', clientName: 'Royal Manchester Centre', clinicalIndication: 'Oesophageal adenocarcinoma (GOJ). Biopsy: adenocarcinoma. CT/PET: T3N1M0. HER2 equivocal. Neoadjuvant FLOT x6 cycles, partial response. Ivor-Lewis oesophagectomy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-UK-001', assignedParticipationTypeId: 'primary' },
    firstTouchedAt: isoDaysAgo(0),
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0007-SP-A_oeso_${iid()}`, specimenId: 'O26-0007-SP-A', templateId: 'oesophagus_resection', templateName: 'CAP Oesophagus — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0008', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0008', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0008' },
    originHospitalId: 'HOSP-002', status: 'draft' as any,
    patient: { id: 'OPAT-008', mrn: '300003', firstName: 'Nora', lastName: 'Blackwood', dateOfBirth: isoYearsAgo(71, 2, 14), sex: 'F' },
    specimens: [
      { id: 'O26-0008-SP-A', label: 'A', description: 'TURBT — posterior wall bladder', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Mr. David Holloway', clientId: 'c4', clientName: 'Royal Manchester Centre', clinicalIndication: 'Haematuria. Cystoscopy: 3 cm papillary lesion posterior wall. Prior TURBT 18 months ago: pTa low-grade urothelial carcinoma. Re-resection.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-UK-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0008-SP-A_bladder_${iid()}`, specimenId: 'O26-0008-SP-A', templateId: 'bladder_turbt', templateName: 'CAP Urinary Bladder — TURBT', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,
];

// ─── Amber Fehrs-Battey (PATH-US-001) — 3 cases ──────────────

const AMBER_CASES: Case[] = [

  {
    id: 'O26-0009', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0009', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0009' },
    originHospitalId: 'HOSP-003', status: 'draft' as any,
    patient: { id: 'OPAT-009', mrn: '400001', firstName: 'Marcus', lastName: 'Delray', dateOfBirth: isoYearsAgo(47, 6, 9), sex: 'M' },
    specimens: [
      { id: 'O26-0009-SP-A', label: 'A', description: 'Wide local excision — right upper back',  receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0009-SP-B', label: 'B', description: 'Right axillary sentinel lymph node',       receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Lisa Fontaine', clientId: 'c1', clientName: "St. Catherine's University Hospital", clinicalIndication: 'Cutaneous melanoma right upper back. Shave biopsy: invasive melanoma Breslow 2.8 mm, Clark IV, no ulceration. Wide local excision with 2 cm margins and sentinel lymph node biopsy.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0009-SP-A_melanoma_${iid()}`, specimenId: 'O26-0009-SP-A', templateId: 'melanoma_excision', templateName: 'CAP Melanoma — Excision', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0010', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0010', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0010' },
    originHospitalId: 'HOSP-003', status: 'in-progress' as any,
    patient: { id: 'OPAT-010', mrn: '400002', firstName: 'Dorothy', lastName: 'Vasquez', dateOfBirth: isoYearsAgo(69, 10, 22), sex: 'F' },
    specimens: [
      { id: 'O26-0010-SP-A', label: 'A', description: 'Pancreaticoduodenectomy (Whipple)', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'O26-0010-SP-B', label: 'B', description: 'Peripancreatic lymph nodes',         receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Samuel Ortega', clientId: 'c2', clientName: 'Westside Surgical Centre', clinicalIndication: 'Pancreatic head adenocarcinoma. EUS-FNA: adenocarcinoma. CT: 2.9 cm mass abutting SMA <180 degrees, no distant disease. CA19-9 841. Neoadjuvant FOLFIRINOX x6 cycles, restaged resectable. Whipple procedure.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    firstTouchedAt: isoDaysAgo(0),
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0010-SP-A_pancreas_${iid()}`, specimenId: 'O26-0010-SP-A', templateId: 'pancreas_resection', templateName: 'CAP Pancreas — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
  } as any,

  {
    id: 'O26-0011', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0011', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0011' },
    originHospitalId: 'HOSP-003', status: 'draft' as any,
    patient: { id: 'OPAT-011', mrn: '400003', firstName: 'Leon', lastName: 'Hargrove', dateOfBirth: isoYearsAgo(62, 8, 5), sex: 'M' },
    specimens: [
      { id: 'O26-0011-SP-A', label: 'A', description: 'Supraglottic laryngectomy',     receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'O26-0011-SP-B', label: 'B', description: 'Left level II/III lymph nodes',  receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'O26-0011-SP-C', label: 'C', description: 'Right level II/III lymph nodes', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Angela Brooks', clientId: 'c2', clientName: 'Westside Surgical Centre', clinicalIndication: 'Supraglottic squamous cell carcinoma T2N1M0. Laryngoscopy biopsy: moderately differentiated SCC. PET-CT: supraglottic primary, single left level II node. Supraglottic laryngectomy with bilateral neck dissection.', receivedDate: isoDaysAgo(2), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0011-SP-A_larynx_${iid()}`, specimenId: 'O26-0011-SP-A', templateId: 'larynx_resection', templateName: 'CAP Larynx — Resection', status: 'draft', answers: {}, createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2) }],
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2),
  } as any,
];

// ─── Pool cases — unassigned, visible to all users ───────────
// 1 STAT (urgent) + 2 Routine

const POOL_CASES: Case[] = [

  // O26-0012: Cervical cone biopsy — STAT urgent pool case
  {
    id: 'O26-0012', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0012', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0012' },
    originHospitalId: 'HOSP-001', status: 'pool' as any,
    patient: { id: 'OPAT-012', mrn: '500001', firstName: 'Alicia', lastName: 'Fernandez', dateOfBirth: isoYearsAgo(34, 5, 17), sex: 'F' },
    specimens: [
      { id: 'O26-0012-SP-A', label: 'A', description: 'Cervical cone biopsy (LLETZ)',          receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
      { id: 'O26-0012-SP-B', label: 'B', description: 'Endocervical curettage — upper margin',  receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: {
      priority: 'STAT',
      requestingProvider: 'Dr. Jennifer Moss',
      clientId: 'c1', clientName: "St. Catherine's University Hospital",
      clinicalIndication: 'High-grade squamous intraepithelial lesion (HSIL/CIN3) on colposcopy biopsy. HPV 16 positive. Proceeding to LLETZ cone excision. Urgent margin assessment required.',
      receivedDate: isoDaysAgo(0),
      assignedTo: undefined as any,
      assignedParticipationTypeId: 'primary',
    },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0012-SP-A_cervix_${iid()}`, specimenId: 'O26-0012-SP-A', templateId: 'cervix_cone', templateName: 'CAP Cervix — Cone Biopsy', status: 'draft', answers: {}, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) }],
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
  } as any,

  // O26-0013: Skin excision — Routine pool case
  {
    id: 'O26-0013', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0013', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0013' },
    originHospitalId: 'HOSP-001', status: 'pool' as any,
    patient: { id: 'OPAT-013', mrn: '500002', firstName: 'Harold', lastName: 'Briggs', dateOfBirth: isoYearsAgo(71, 1, 30), sex: 'M' },
    specimens: [
      { id: 'O26-0013-SP-A', label: 'A', description: 'Skin excision — left forearm, 2.5 cm ellipse', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Carol Simmons',
      clientId: 'c2', clientName: 'Westside Surgical Centre',
      clinicalIndication: 'Pigmented lesion left forearm. Punch biopsy: atypical melanocytic proliferation, cannot exclude melanoma. Proceeding to wide local excision with 5 mm margins.',
      receivedDate: isoDaysAgo(1),
      assignedTo: undefined as any,
      assignedParticipationTypeId: 'primary',
    },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0013-SP-A_skin_${iid()}`, specimenId: 'O26-0013-SP-A', templateId: 'skin_excision', templateName: 'CAP Skin — Excision', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
  } as any,

  // O26-0014: Right breast core needle biopsy — Routine pool case
  {
    id: 'O26-0014', reportingMode: 'orchestrator',
    accession: { accessionNumber: 'O0014', accessionPrefix: 'O', accessionYear: 2026, fullAccession: 'O26-0014' },
    originHospitalId: 'HOSP-002', status: 'pool' as any,
    patient: { id: 'OPAT-014', mrn: '500003', firstName: 'Yvonne', lastName: 'Castellano', dateOfBirth: isoYearsAgo(52, 8, 11), sex: 'F' },
    specimens: [
      { id: 'O26-0014-SP-A', label: 'A', description: 'Right breast core needle biopsy — 12 o\'clock', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Martin Osei',
      clientId: 'c4', clientName: 'Royal Manchester Centre',
      clinicalIndication: 'Right breast mass 12 o\'clock position. Mammogram: 18 mm irregular speculated density, BI-RADS 5. Ultrasound-guided core needle biopsy for histological diagnosis prior to surgical planning.',
      receivedDate: isoDaysAgo(1),
      assignedTo: undefined as any,
      assignedParticipationTypeId: 'primary',
    },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [{ instanceId: `O26-0014-SP-A_breast_${iid()}`, specimenId: 'O26-0014-SP-A', templateId: 'breast_biopsy', templateName: 'CAP Breast — Core Needle Biopsy', status: 'draft', answers: {}, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1) }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
  } as any,
];

// ─── Seed ─────────────────────────────────────────────────────

const ORCH_CASES: Case[] = [...PETE_CASES, ...PAUL_CASES, ...AMBER_CASES, ...POOL_CASES];

let CASES: Case[] = (() => {
  const stored = storageGet<Case[]>(STORAGE_KEY, []);
  return stored?.length ? stored : ORCH_CASES;
})();

// ─── Service implementation ───────────────────────────────────

export const mockOrchestratorCaseService: ICaseService = {

  async getCase(id: string): Promise<Case | undefined> {
    await delay();
    return CASES.find(c => c.id === id);
  },

  async getAll(params?) {
    await delay();
    let results = [...CASES];
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(c =>
        c.accession?.fullAccession?.toLowerCase().includes(q) ||
        `${c.patient?.firstName} ${c.patient?.lastName}`.toLowerCase().includes(q)
      );
    }
    return { ok: true, data: results as any[] };
  },

  // Filter by assigned user — pool cases visible to all
  async listCasesForUser(userId: string): Promise<Case[]> {
    await delay();
    return CASES.filter(c =>
      c.order?.assignedTo === userId ||
      (c.status as string) === 'pool'
    );
  },

  async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
    await delay();
    const idx = CASES.findIndex(c => c.id === caseId);
    if (idx !== -1) {
      CASES[idx] = { ...CASES[idx], ...updates, updatedAt: new Date().toISOString() };
      storageSet(STORAGE_KEY, CASES);
    }
  },
};
