// src/services/cases/mockCaseService.ts
// ─────────────────────────────────────────────────────────────
// Realistic mock cases for PathScribe development & QA.
// Each case has coherent patient, specimens, narratives and
// pre-filled synoptic answers using real CAP eCC field IDs.

import { ICaseService } from "./ICaseService";
import { callAi } from '../aiIntegration/aiProviderService';
import { Case } from "../../types/case/Case";
import { CaseStatus } from "../../types/case/CaseStatus";
import { storageSet } from "../mockStorage";

const STORAGE_KEY = 'cases';

// Seed from storage if available, otherwise use MOCK_CASES defined below
// (populated after MOCK_CASES declaration)

const delay = (ms = 30) => new Promise(res => setTimeout(res, ms));

function isoYearsAgo(years: number, month = 6, day = 15): string {
  return new Date(new Date().getFullYear() - years, month - 1, day).toISOString();
}
function isoDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString();
}
// ─── Mock Cases ────────────────────────────────────────────────────────────────

const MOCK_CASES: Case[] = [

  // ── Case 1: Breast Invasive — multi-report, in-progress ──────────────────
  {
    id: 'S26-4401-BX-001',
    accession: { accessionNumber: '4401', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4401-BX-001' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-001', mrn: '100001',
      firstName: 'Grace', lastName: 'Thompson',
      dateOfBirth: isoYearsAgo(52, 3, 14), sex: 'F',
      phone: '555-201-4411', email: 'grace.thompson@example.org',
      address: '14 Maple Ave, Phoenix, AZ 85001',
    },
    specimens: [
      { id: 'S26-4401-SP-1', label: 'A', description: 'Left breast mastectomy', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
      { id: 'S26-4401-SP-2', label: 'B', description: 'Left axillary sentinel lymph node', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Sarah Chen', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Invasive ductal carcinoma, left breast 10 o\'clock, ER+/PR+/HER2 2+. Proceeding to mastectomy following multidisciplinary tumour board recommendation.', receivedDate: isoDaysAgo(3), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "left breast mastectomy" is a 487g specimen, 18.0 × 14.0 × 4.5 cm. The overlying skin ellipse measures 16.0 × 7.0 cm and is unremarkable. Sectioning reveals a firm, stellate, tan-white mass measuring 2.3 × 1.8 × 1.5 cm in the upper outer quadrant, 3.0 cm from the nipple and 2.0 cm from the deep margin. No satellite nodules identified. Remaining breast tissue is fibrofatty.',
      microscopicDescription: 'Sections show invasive carcinoma of no special type (NST), Nottingham grade 2 (tubules 3, nuclei 2, mitoses 1; total score 6). The invasive component measures 2.3 cm. Lymphovascular invasion is not identified. DCIS of intermediate nuclear grade, cribriform pattern, is present at the periphery of the invasive carcinoma, spanning approximately 4 mm. All margins are negative; closest margin is the deep margin at 2.0 mm.',
      ancillaryStudies: 'ER: Positive (Allred score 7/8, 90% strong). PR: Positive (Allred score 6/8, 70% moderate). HER2 IHC: 2+ (equivocal). HER2 ISH: Not amplified (HER2/CEP17 ratio 1.4). Ki-67: 18%. Sentinel lymph node (Specimen B): 1 of 1 node positive for metastatic carcinoma, largest deposit 4.5 mm, no extranodal extension.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4401-SP-1_breast_invasive_001',
        specimenId: 'S26-4401-SP-1',
        templateId: 'breast_invasive',
        templateName: 'CAP Breast Invasive Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'total_mastectomy',
          specimen_laterality: 'left',
          tumor_site: ['upper_outer_quadrant'],
          histologic_type: 'invasive_nst',
          histologic_grade: '2 (score 6)',
          tumor_size: '2.3 cm',
          tumor_focality: 'single_focus',
          lvi: 'lvi_not_identified',
          treatment_effect_breast: 'no_presurgical_therapy',
          treatment_effect_nodes: 'nodes_not_applicable',
          margin_status_invasive: 'all_margins_negative_invasive',
          distance_invasive_to_named_margins: '2.0 mm (deep margin)',
          margin_status_dcis: 'all_margins_negative_dcis',
          regional_ln_status: 'tumor_present_nodes',
          number_ln_macrometastases: '1',
          largest_nodal_met_mm: '4.5',
          extranodal_extension: 'ene_not_identified',
          total_ln_examined: '1',
          sentinel_ln_examined: '1',
        },
        aiSuggestions: {
          procedure:                        { value: 'total_mastectomy',          confidence: 97, source: 'Gross: "left breast mastectomy"',                     verification: 'unverified' },
          specimen_laterality:              { value: 'left',                      confidence: 99, source: 'Gross: "left breast"',                                verification: 'unverified' },
          tumor_site:                       { value: ['upper_outer_quadrant'],    confidence: 91, source: 'Gross: "upper outer quadrant, 3.0 cm from the nipple"',      verification: 'unverified' },
          histologic_type:                  { value: 'invasive_nst',              confidence: 95, source: 'Micro: "invasive carcinoma of no special type"',       verification: 'unverified' },
          histologic_grade:                 { value: '2 (score 6)',               confidence: 88, source: 'Micro: "Nottingham grade 2 (tubules 3, nuclei 2, mitoses 1; total score 6)"', verification: 'unverified' },
          tumor_size:                       { value: '2.3 cm',                    confidence: 96, source: 'Gross: "2.3 × 1.8 × 1.5 cm"',                        verification: 'unverified' },
          tumor_focality:                   { value: 'single_focus',              confidence: 85, source: 'Gross: "No satellite nodules identified"',             verification: 'unverified' },
          lvi:                              { value: 'lvi_not_identified',        confidence: 82, source: 'Micro: "Lymphovascular invasion is not identified"',   verification: 'unverified' },
          treatment_effect_breast:          { value: 'no_presurgical_therapy',    confidence: 78, source: 'No known presurgical therapy mentioned',          verification: 'unverified' },
          treatment_effect_nodes:           { value: 'nodes_not_applicable',      confidence: 72, source: 'No known presurgical therapy mentioned',          verification: 'unverified' },
          margin_status_invasive:           { value: 'all_margins_negative_invasive', confidence: 94, source: 'Micro: "All margins are negative"',               verification: 'unverified' },
          distance_invasive_to_named_margins: { value: '2.0 mm (deep margin)',    confidence: 89, source: 'Micro: "closest margin is the deep margin at 2.0 mm"', verification: 'unverified' },
          margin_status_dcis:               { value: 'all_margins_negative_dcis', confidence: 88, source: 'Micro: "All margins are negative"',                   verification: 'unverified' },
          regional_ln_status:               { value: 'tumor_present_nodes',       confidence: 92, source: 'Ancillary: "1 of 1 node positive for metastatic carcinoma"', verification: 'unverified' },
          number_ln_macrometastases:        { value: '1',                         confidence: 90, source: 'Ancillary: "1 of 1 node positive … deposit 4.5 mm"',  verification: 'unverified' },
          largest_nodal_met_mm:             { value: '4.5',                       confidence: 88, source: 'Ancillary: "largest deposit 4.5 mm"',                 verification: 'unverified' },
          extranodal_extension:             { value: 'ene_not_identified',        confidence: 85, source: 'Ancillary: "no extranodal extension"',                verification: 'unverified' },
          total_ln_examined:                { value: '1',                         confidence: 90, source: 'Ancillary: "1 of 1 node positive"',                   verification: 'unverified' },
          sentinel_ln_examined:             { value: '1',                         confidence: 88, source: 'Specimen B: "Left axillary sentinel lymph node"',      verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'tumor_board_schedule', name: 'Tumor Board — Thu 14:00', color: '#3b82f6',   level: 'Case', status: 'Active', severity: 3 },
      { tagClass: 'ADMINISTRATIVE', id: 'pending_clin_cor',     name: 'Pending Clinical Correlation',              color: '#f59e0b', level: 'Case', status: 'Active', severity: 2 },
    ],
    specimenFlags: [
      { id: 'comp-erh2-4401', name: 'ER/PR/HER2', lisCode: 'ERH2', color: '#3b82f6', severity: 2, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4401-SP-1' },
      { id: 'comp-her2f-4401', name: 'HER2 FISH', lisCode: 'HER2', color: '#3b82f6', severity: 2, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4401-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C50.412'], snomed: ['413448000'] },
  },

  // ── Case 2: Colorectal — sigmoid resection, partially filled ─────────────
  {
    id: 'S26-4402-COLON-RES',
    accession: { accessionNumber: '4402', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4402-COLON-RES' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-002', mrn: '100002',
      firstName: 'Robert', lastName: 'Jackson',
      dateOfBirth: isoYearsAgo(67, 8, 22), sex: 'M',
      phone: '555-202-4412', email: 'robert.jackson@example.org',
      address: '88 Desert Rose Blvd, Scottsdale, AZ 85251',
    },
    specimens: [
      { id: 'S26-4402-SP-1', label: 'A', description: 'Sigmoid colon resection', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'S26-4402-SP-2', label: 'B', description: 'Apical lymph node', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Michael Torres', clientId: 'c2', clientName: 'Riverside Medical Center', clinicalIndication: 'Sigmoid colon adenocarcinoma diagnosed on colonoscopy biopsy. CT staging: T3N1M0. Proceeding to laparoscopic sigmoid resection.', receivedDate: isoDaysAgo(2), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "sigmoid colon resection" is a segment of sigmoid colon measuring 22.0 cm in length. The serosal surface is smooth and glistening. A fungating, ulcerating tumor measuring 4.5 × 3.2 cm is present on the anterior wall, 9.0 cm from the distal margin and 11.0 cm from the proximal margin. The tumor invades through the muscularis propria into pericolorectal adipose tissue. The circumferential resection margin is 3 mm from the tumor.',
      microscopicDescription: 'Sections show moderately differentiated adenocarcinoma (low grade) infiltrating through the muscularis propria into pericolorectal adipose tissue (pT3). Perineural invasion is present. Lymphovascular invasion is not identified. All surgical margins (proximal, distal, radial) are uninvolved; the closest margin (radial) is 3 mm. 18 lymph nodes identified in the pericolorectal fat; 3 of 18 are positive for metastatic carcinoma, all without extranodal extension (pN1b).',
      ancillaryStudies: 'Mismatch repair proteins by IHC: MLH1, MSH2, MSH6, and PMS2 all retained (mismatch repair proficient, pMMR). KRAS mutation analysis: p.G12D detected. BRAF V600E: Wild type. RAS/RAF panel: Pending.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4402-SP-1_colon_resection_001',
        specimenId: 'S26-4402-SP-1',
        templateId: 'colon_resection',
        templateName: 'CAP Colon & Rectum Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'sigmoidectomy',
          tumor_site: ['sigmoid_colon'],
          histologic_type: 'adenocarcinoma',
          histologic_grade: 'g2',
          tumor_size: '4.5 cm',
          tumor_extent: 'extent_pericolic',
          lvi: ['lvi_not_identified'],
          perineural_invasion: 'pni_present',
          margin_status_invasive: 'all_margins_negative_invasive',
          distance_radial_margin: '3 mm',
          regional_ln_status: 'ln_all_negative',
          ln_with_tumor: '3',
          ln_examined: '18',
          pT_category: 'pT3',
          pN_category: 'pN1b',
          treatment_effect: 'te_no_presurgical',
        },
        aiSuggestions: {
          procedure:               { value: 'sigmoidectomy',         confidence: 96, source: 'Gross: "sigmoid colon resection … 22 cm segment"',                   verification: 'unverified' },
          tumor_site:              { value: ['sigmoid_colon'],        confidence: 98, source: 'Gross: "anterior wall … sigmoid colon"',                             verification: 'unverified' },
          histologic_type:         { value: 'adenocarcinoma',        confidence: 94, source: 'Micro: "moderately differentiated adenocarcinoma"',                  verification: 'unverified' },
          histologic_grade:        { value: 'g2',                    confidence: 89, source: 'Micro: "moderately differentiated"',                                  verification: 'unverified' },
          tumor_size:              { value: '4.5 cm',                confidence: 95, source: 'Gross: "tumor measuring 4.5 × 3.2 cm"',                              verification: 'unverified' },
          tumor_extent:            { value: 'extent_pericolic',      confidence: 93, source: 'Micro: "invades through muscularis propria into pericolorectal fat"', verification: 'unverified' },
          lvi:                     { value: ['lvi_not_identified'],   confidence: 87, source: 'Micro: "Lymphovascular invasion is not identified"',                  verification: 'unverified' },
          perineural_invasion:     { value: 'pni_present',           confidence: 91, source: 'Micro: "Perineural invasion is present"',                            verification: 'unverified' },
          margin_status_invasive:  { value: 'all_margins_negative_invasive', confidence: 90, source: 'Micro: "All surgical margins … uninvolved"',                 verification: 'unverified' },
          distance_radial_margin:  { value: '3 mm',                  confidence: 85, source: 'Micro: "closest margin (radial) is 3 mm"',                           verification: 'unverified' },
          regional_ln_status:      { value: 'ln_tumor_present',      confidence: 92, source: 'Micro: "3 of 18 are positive for metastatic carcinoma"',              verification: 'unverified' },
          ln_with_tumor:           { value: '3',                     confidence: 92, source: 'Micro: "3 of 18 are positive"',                                       verification: 'unverified' },
          ln_examined:             { value: '18',                    confidence: 94, source: 'Micro: "18 lymph nodes identified"',                                  verification: 'unverified' },
          pT_category:             { value: 'pT3',                   confidence: 93, source: 'Micro: "pT3 — pericolorectal fat invasion"',                         verification: 'unverified' },
          pN_category:             { value: 'pN1b',                  confidence: 88, source: 'Micro: "3 positive nodes — pN1b"',                                   verification: 'unverified' },
          treatment_effect:        { value: 'te_no_presurgical',     confidence: 80, source: 'No presurgical therapy mentioned',                                    verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'oncology_awaiting',   name: 'Oncology Awaiting Report',  color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
      { tagClass: 'ADMINISTRATIVE', id: 'stat_rush',           name: 'STAT — Rush Processing',    color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
    ],
    specimenFlags: [
      { id: 'comp-mol-4402', name: 'Molecular Panel', lisCode: 'MOL', color: '#10b981', severity: 2, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4402-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C18.7'], snomed: ['363346000'] },
  },

  // ── Case 3: Lung — right upper lobe lobectomy, draft ─────────────────────
  {
    id: 'S26-4403',
    accession: { accessionNumber: '4403', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4403' },
    originHospitalId: 'HOSP-002', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-003', mrn: '100003',
      firstName: 'Helen', lastName: 'Williams',
      dateOfBirth: isoYearsAgo(63, 11, 5), sex: 'F',
      phone: '555-203-4413', email: 'helen.williams@example.org',
      address: '230 Cactus Wren Dr, Tempe, AZ 85281',
    },
    specimens: [
      { id: 'S26-4403-SP-1', label: 'A', description: 'Right upper lobe lobectomy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4403-SP-2', label: 'B', description: 'Station 4R mediastinal lymph nodes', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4403-SP-3', label: 'C', description: 'Station 7 subcarinal lymph nodes', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. James Park', clientId: 'c3', clientName: 'Northside Clinic', clinicalIndication: '2.3 cm right upper lobe solid nodule, PET-avid (SUVmax 8.4). CT-guided biopsy: adenocarcinoma. EGFR/ALK negative. Proceeding to VATS right upper lobectomy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "right upper lobe" is a lobectomy specimen, 14.0 × 10.0 × 3.5 cm, weighing 180g. The pleural surface is smooth. Sectioning reveals a firm, tan-white, spiculated mass measuring 2.3 × 2.1 × 1.9 cm in the posterior segment, 1.5 cm from the bronchial margin and 0.3 cm from the pleural surface. The remaining lung parenchyma shows mild emphysematous change.',
      microscopicDescription: 'Sections show acinar-predominant adenocarcinoma, IASLC/ATS/ERS grade 2 (moderately differentiated). The invasive component measures 2.3 cm. Visceral pleural invasion is present (PL1, elastic layer). Lymphovascular invasion is not identified. The bronchial margin is negative (1.5 cm). Specimens B and C: 0 of 5 lymph nodes positive for metastatic carcinoma.',
      ancillaryStudies: 'TTF-1: Positive. Napsin A: Positive. p40: Negative. ALK (D5F3): Negative. ROS1: Negative. EGFR mutation: Wild type. KRAS: p.G12C detected. PD-L1 TPS: 45% (22C3 assay). NGS comprehensive panel: Pending.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4403-SP-1_lung_adeno_001',
        specimenId: 'S26-4403-SP-1',
        templateId: 'lung_adeno',
        templateName: 'CAP Lung — Resection',
        status: 'draft',
        answers: {
          procedure: ['lobectomy'],
          specimen_laterality: 'right',
          tumor_site: ['upper_lobe'],
          histologic_type: 'inv_acinar',
          histologic_grade: 'g2',
          tumor_size: '2.3 cm',
          invasive_component_size: '2.3 cm',
          visceral_pleura_invasion: 'vpi_present',
          lymphovascular_invasion: ['lvi_not_identified'],
          regional_ln_status: 'ln_all_negative',
          ln_examined_count: '5',
          ln_with_tumor_count: '0',
          pT_category: 'pT2a',
          pN_category: 'pN0',
          synchronous_tumors: 'sync_not_applicable',
          tumor_focality: 'single_focus',
        },
        aiSuggestions: {
          procedure:               { value: ['lobectomy'],         confidence: 97, source: 'Gross: "right upper lobe … lobectomy specimen"',                       verification: 'unverified' },
          specimen_laterality:     { value: 'right',               confidence: 99, source: 'Gross: "right upper lobe"',                                            verification: 'unverified' },
          tumor_site:              { value: ['upper_lobe'],        confidence: 96, source: 'Gross: "posterior segment … right upper lobe"',                        verification: 'unverified' },
          histologic_type:         { value: 'inv_acinar',          confidence: 95, source: 'Micro: "acinar-predominant adenocarcinoma"',                           verification: 'unverified' },
          histologic_grade:        { value: 'g2',                  confidence: 88, source: 'Micro: "IASLC/ATS/ERS grade 2 (moderately differentiated)"',           verification: 'unverified' },
          tumor_size:              { value: '2.3 cm',              confidence: 95, source: 'Micro: "invasive component measures 2.3 cm"',                          verification: 'unverified' },
          invasive_component_size: { value: '2.3 cm',              confidence: 93, source: 'Micro: "invasive component measures 2.3 cm"',                          verification: 'unverified' },
          visceral_pleura_invasion:{ value: 'vpi_present',         confidence: 82, source: 'Micro: "Visceral pleural invasion is present (PL1, elastic layer)"',   verification: 'unverified' },
          lymphovascular_invasion: { value: ['lvi_not_identified'], confidence: 90, source: 'Micro: "Lymphovascular invasion is not identified"',                  verification: 'unverified' },
          margin_status_invasive:  { value: 'Negative (1.5 cm bronchial margin)', confidence: 92, source: 'Micro: "bronchial margin is negative (1.5 cm)"',        verification: 'unverified' },
          regional_ln_status:      { value: 'ln_all_negative',     confidence: 94, source: 'Micro: "0 of 5 lymph nodes positive"',                                verification: 'unverified' },
          ln_examined_count:       { value: '5',                   confidence: 91, source: 'Micro: "0 of 5 lymph nodes positive"',                                 verification: 'unverified' },
          ln_with_tumor_count:     { value: '0',                   confidence: 94, source: 'Micro: "0 of 5 lymph nodes positive for metastatic carcinoma"',        verification: 'unverified' },
          pT_category:             { value: 'pT2a',                confidence: 85, source: 'Micro: "2.3 cm with pleural invasion — pT2a"',                        verification: 'unverified' },
          pN_category:             { value: 'pN0',                 confidence: 90, source: 'Micro: "0 of 5 lymph nodes positive"',                                 verification: 'unverified' },
          synchronous_tumors:      { value: 'sync_not_applicable', confidence: 80, source: 'Gross: single mass identified',                                        verification: 'unverified' },
          tumor_focality:          { value: 'single_focus',        confidence: 88, source: 'Gross: "spiculated mass … posterior segment"',                        verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'stat_rush',           name: 'STAT — Rush Processing',    color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
      { tagClass: 'ADMINISTRATIVE', id: 'thoracic_mdt',        name: 'Thoracic MDT — Fri 09:00', color: '#3b82f6',   level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [
      { id: 'comp-mprof-4403', name: 'Molecular Profiling', lisCode: 'MPROF', color: '#3b82f6', severity: 3, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4403-SP-1' },
      { id: 'comp-ihc-4403', name: 'IHC Panel (PD-L1)', lisCode: 'IHC', color: '#3b82f6', severity: 2, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4403-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C34.11'], snomed: ['254637007'] },
  },

  // ── Case 4: Prostate Needle Biopsy, draft ──────────────────────────────────
  {
    id: 'S26-4404',
    accession: { accessionNumber: '4404', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4404' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-004', mrn: '100004',
      firstName: 'David', lastName: 'Martinez',
      dateOfBirth: isoYearsAgo(71, 5, 30), sex: 'M',
      phone: '555-204-4414', email: 'david.martinez@example.org',
      address: '501 Sun Valley Rd, Mesa, AZ 85201',
    },
    specimens: [
      { id: 'S26-4404-SP-1', label: 'A', description: 'Prostate biopsy — right apex', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4404-SP-2', label: 'B', description: 'Prostate biopsy — right mid', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4404-SP-3', label: 'C', description: 'Prostate biopsy — right base', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4404-SP-4', label: 'D', description: 'Prostate biopsy — left apex', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4404-SP-5', label: 'E', description: 'Prostate biopsy — left mid', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4404-SP-6', label: 'F', description: 'Prostate biopsy — left base', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Anil Sharma', clientId: 'c4', clientName: 'Westview Surgery Center', clinicalIndication: 'PSA 8.4 ng/mL, rising from 5.2 ng/mL 12 months prior. Abnormal DRE: firm nodule right lobe. MRI prostate: PI-RADS 4 lesion right mid-gland. Proceeding to systematic + targeted biopsy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received in formalin are six containers labeled A through F, each containing prostate needle biopsy cores. Specimen A (right apex): 2 cores, 1.4 and 1.2 cm. Specimen B (right mid): 2 cores, 1.6 and 1.5 cm. Specimen C (right base): 2 cores, 1.8 and 1.6 cm. Specimens D–F (left apex, mid, base): 2 cores each, 1.3–1.7 cm. All cores are grey-white and rubbery.',
      microscopicDescription: 'Specimens A, B, C (right apex, mid, base): Acinar adenocarcinoma (usual type), Gleason score 3+4=7 (Grade Group 2). 4 of 6 cores involved. Maximum % core involvement: 70% (right mid). Perineural invasion present (right mid, right apex). Specimens D, E, F (left apex, mid, base): Benign prostatic tissue with mild chronic inflammation. No carcinoma identified.',
      ancillaryStudies: 'PSMA IHC: Strongly positive in carcinoma foci. PIN-4 cocktail: Confirms adenocarcinoma, loss of basal cells confirmed.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4404-SP-1_prostate_001',
        specimenId: 'S26-4404-SP-1',
        templateId: 'prostate_needle_biopsy',
        templateName: 'CAP Prostate — Needle Biopsy',
        status: 'draft',
        answers: {
          procedure: ['procedure_systematic_biopsy'],
          positive_specimen_locations: ['positive_right'],
          highest_gleason_score: 'gg2_3_4_7',
          sites_with_highest_gleason: ['highest_right'],
          total_number_of_cores: 12,
          number_of_positive_cores: 4,
          greatest_percentage_core_involvement: 'gpc_61_70',
          perineural_invasion: 'pni_present',
          lymphatic_vascular_invasion: 'lvi_not_identified',
          treatment_effect: ['tx_no_known_presurgical_therapy'],
        },
        aiSuggestions: {
          procedure:                    { value: ['procedure_systematic_biopsy'], confidence: 94, source: 'Gross: "six containers … prostate needle biopsy cores A through F"', verification: 'unverified' },
          positive_specimen_locations:  { value: ['positive_right'],              confidence: 90, source: 'Micro: "Specimens A, B, C (right) — carcinoma identified"',           verification: 'unverified' },
          highest_gleason_score:        { value: 'gg2_3_4_7',                     confidence: 93, source: 'Micro: "Gleason score 3+4=7, Grade Group 2"',                         verification: 'unverified' },
          sites_with_highest_gleason:   { value: ['highest_right'],               confidence: 88, source: 'Micro: "right mid … 70% core involvement"',                           verification: 'unverified' },
          total_number_of_cores:        { value: 12,                              confidence: 90, source: 'Gross: "2 cores each" × 6 containers = 12 total',                      verification: 'unverified' },
          number_of_positive_cores:     { value: 4,                               confidence: 88, source: 'Micro: "4 of 6 cores involved on right side"',                         verification: 'unverified' },
          greatest_percentage_core_involvement: { value: 'gpc_61_70',             confidence: 82, source: 'Micro: "Maximum % core involvement: 70% (right mid)"',                verification: 'unverified' },
          perineural_invasion:          { value: 'pni_present',                   confidence: 92, source: 'Micro: "Perineural invasion present (right mid, right apex)"',         verification: 'unverified' },
          lymphatic_vascular_invasion:  { value: 'lvi_not_identified',            confidence: 78, source: 'No lymphovascular invasion mentioned in report',                       verification: 'unverified' },
          treatment_effect:             { value: ['tx_no_known_presurgical_therapy'], confidence: 85, source: 'No presurgical therapy mentioned',                                  verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { id: 'urology-mdt',  tagClass: 'ADMINISTRATIVE', name: 'Urology MDT Scheduled',    lisCode: 'UROL',  color: '#3b82f6', severity: 2, level: 'Case', status: 'Active' },
      { id: 'gleason-upgrade', tagClass: 'ADMINISTRATIVE', name: 'Gleason Upgrade from Bx',  lisCode: 'GGU',   color: '#f59e0b', severity: 3, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'psma_ihc_pending',    name: 'PSMA IHC Noted Positive',  color: '#10b981',  level: 'Case', status: 'Active', severity: 1 },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C61'], snomed: ['254900004'] },
  },

  // ── Case 5: Breast DCIS — lumpectomy, finalized ───────────────────────────
  {
    id: 'S26-4405',
    accession: { accessionNumber: '4405', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4405' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-005', mrn: '100005',
      firstName: 'Susan', lastName: 'Taylor',
      dateOfBirth: isoYearsAgo(48, 9, 12), sex: 'F',
      phone: '555-205-4415', email: 'susan.taylor@example.org',
      address: '77 Palo Verde Circle, Chandler, AZ 85224',
    },
    specimens: [
      { id: 'S26-4405-SP-1', label: 'A', description: 'Right breast lumpectomy', receivedAt: isoDaysAgo(5), collectedAt: isoDaysAgo(6), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Lisa Wong', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Stereotactic biopsy: DCIS, intermediate grade. Screening mammogram calcifications right upper outer quadrant. Proceeding to wire-localised lumpectomy.', receivedDate: isoDaysAgo(6), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh, wire-localised, labeled "right breast lumpectomy" is a 68g specimen, 7.0 × 5.5 × 3.0 cm. Specimen radiograph confirms calcifications correlating with a firm, white, granular area measuring 1.8 × 1.2 cm in the upper outer quadrant. No discrete mass identified.',
      microscopicDescription: 'Sections show ductal carcinoma in situ (DCIS), intermediate nuclear grade, predominantly cribriform architecture with focal solid areas, spanning 18 mm. Calcifications are present within DCIS foci, correlating with the specimen radiograph. No invasive carcinoma identified. All margins are negative; closest margin is superior at 3 mm. No lymph nodes submitted.',
      ancillaryStudies: 'ER by IHC (DCIS): Positive (strong, diffuse). PR: Positive. HER2 IHC: 1+ (negative). Ki-67: 12%.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4405-SP-1_breast_dcis_001',
        specimenId: 'S26-4405-SP-1',
        templateId: 'breast_dcis_resection',
        templateName: 'CAP Breast DCIS — Resection',
        status: 'finalized',
        answers: {
          procedure: 'excision_less_than_total_mastectomy',
          specimen_laterality: 'right',
          tumor_type: 'dcis_without_invasion',
          tumor_site: ['upper_outer_quadrant'],
          dcis_nuclear_grade: 'grade_2_intermediate',
          dcis_architectural_patterns: ['cribriform'],
          dcis_size_extent: '18 mm',
          dcis_necrosis: 'necrosis_not_identified',
          microcalcifications: ['microcalc_in_dcis'],
          margin_status_dcis: 'all_margins_negative_dcis',
          distance_dcis_to_named_margins: '3 mm (superior)',
          regional_ln_status: 'no_nodes_submitted',
        },
        aiSuggestions: {
          procedure:               { value: 'excision_less_than_total_mastectomy', confidence: 95, source: 'Gross: "right breast lumpectomy … 68g specimen"',                  verification: 'verified' },
          specimen_laterality:     { value: 'right',                               confidence: 99, source: 'Gross: "right breast lumpectomy"',                                  verification: 'verified' },
          tumor_type:              { value: 'dcis_without_invasion',               confidence: 96, source: 'Micro: "No invasive carcinoma identified"',                         verification: 'verified' },
          tumor_site:              { value: ['upper_outer_quadrant'],               confidence: 88, source: 'Gross: "upper outer quadrant"',                                     verification: 'verified' },
          dcis_nuclear_grade:      { value: 'grade_2_intermediate',                confidence: 91, source: 'Micro: "DCIS, intermediate nuclear grade"',                         verification: 'verified' },
          dcis_architectural_patterns: { value: ['cribriform'],                     confidence: 88, source: 'Micro: "predominantly cribriform … focal solid"',                   verification: 'verified' },
          dcis_size_extent:        { value: '18 mm',                               confidence: 93, source: 'Micro: "spanning 18 mm"',                                           verification: 'verified' },
          dcis_necrosis:           { value: 'necrosis_not_identified',             confidence: 75, source: 'No necrosis mentioned in microscopic description',                  verification: 'verified' },
          microcalcifications:     { value: ['microcalc_in_dcis'],                  confidence: 87, source: 'Micro: "Calcifications are present within DCIS foci"',              verification: 'verified' },
          margin_status_dcis:      { value: 'all_margins_negative_dcis',           confidence: 96, source: 'Micro: "All margins are negative"',                                 verification: 'verified' },
          distance_dcis_to_named_margins: { value: '3 mm (superior)',             confidence: 90, source: 'Micro: "closest margin is superior at 3 mm"',                       verification: 'verified' },
          regional_ln_status:      { value: 'no_nodes_submitted',                  confidence: 92, source: 'Micro: "No lymph nodes submitted"',                                  verification: 'verified' },
        },
        createdAt: isoDaysAgo(5), updatedAt: isoDaysAgo(4),
      },
    ],
    status: 'finalized' as CaseStatus,
    createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(0),  // finalized today
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'second_opinion',      name: 'Second Opinion Requested', color: '#8b5cf6', level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'margins_close',       name: 'Close Margin — 3mm',       color: '#f59e0b', level: 'Case', status: 'Active', severity: 3 },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['D05.11'], snomed: ['397201007'] },
  },

  // ── Case 6: Breast Invasive — blank form, tests empty state ──────────────
  {
    id: 'S26-4406',
    accession: { accessionNumber: '4406', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4406' },
    originHospitalId: 'HOSP-002', originEnterpriseId: 'ENT-GLOBAL',
    patient: {
      id: 'PAT-006', mrn: '100006',
      firstName: 'Ruth', lastName: 'Anderson',
      dateOfBirth: isoYearsAgo(58, 1, 28), sex: 'F',
      phone: '555-206-4416', email: 'ruth.anderson@example.org',
      address: '320 Ironwood Pl, Gilbert, AZ 85295',
    },
    specimens: [
      { id: 'S26-4406-SP-1', label: 'A', description: 'Left breast core needle biopsy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Patricia Moore', clientId: 'c2', clientName: 'Riverside Medical Center', clinicalIndication: 'Palpable mass left breast 2 o\'clock. Ultrasound: 1.8 cm hypoechoic irregular mass. BIRADS 5. Proceeding to ultrasound-guided core needle biopsy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received in formalin labeled "left breast core needle biopsy" are 3 cores measuring 1.3, 1.4, and 1.5 cm, grey-white and firm.',
      microscopicDescription: 'Pending.',
      ancillaryStudies: 'Pending.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4406-SP-1_breast_invasive_001',
        specimenId: 'S26-4406-SP-1',
        templateId: 'breast_invasive',
        templateName: 'CAP Breast Invasive Carcinoma — Resection',
        status: 'draft',
        answers: {},
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'stat_rush',           name: 'STAT — Rush Processing',   color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
      { tagClass: 'ADMINISTRATIVE', id: 'frozen_section',      name: 'Frozen Section Pending',   color: '#f97316', level: 'Case', status: 'Active', severity: 4 },
    ],
    specimenFlags: [
      { id: 'comp-erh2-4406', name: 'ER/PR/HER2', lisCode: 'ERH2', color: '#3b82f6', severity: 2, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4406-SP-1' },
    ],
    reportingMode: 'copilot',
  },

  // ── Case 7: Colorectal — rectal resection, multi-specimen ─────────────────
  {
    id: 'S26-4407',
    accession: { accessionNumber: '4407', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4407' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-007', mrn: '100007',
      firstName: 'Michael', lastName: 'Chen',
      dateOfBirth: isoYearsAgo(74, 4, 9), sex: 'M',
      phone: '555-207-4417', email: 'michael.chen@example.org',
      address: '88 Mesquite Lane, Peoria, AZ 85345',
    },
    specimens: [
      { id: 'S26-4407-SP-1', label: 'A', description: 'Anterior resection — rectum', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
      { id: 'S26-4407-SP-2', label: 'B', description: 'Mesorectal lymph nodes', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. James Nguyen', clientId: 'c3', clientName: 'Northside Clinic', clinicalIndication: 'Rectal adenocarcinoma, 8 cm from anal verge. MRI: mrT3N2. Completed neoadjuvant chemoradiotherapy (FOLFOX × 6 + long-course RT). Restaging MRI: good response. Proceeding to low anterior resection.', receivedDate: isoDaysAgo(3), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "anterior resection" is a segment of rectum measuring 18.0 cm in length with attached mesorectum. The mesorectal fascia is intact (complete TME). An ulcerating tumor measuring 2.5 × 2.0 cm is present on the posterior wall, 8.0 cm from the distal margin. The tumor appears to penetrate through the muscularis propria. The circumferential resection margin is 4 mm.',
      microscopicDescription: 'Post-treatment rectal adenocarcinoma with moderate treatment response (Ryan score 2, <5% residual viable carcinoma). Residual carcinoma invades through muscularis propria into pericolorectal adipose tissue (ypT3). Perineural invasion not identified. Lymphovascular invasion not identified. Proximal and distal margins negative. CRM: 4 mm (negative). 14 of 16 lymph nodes show treatment effect only; 2 lymph nodes contain viable metastatic carcinoma (ypN1b).',
      ancillaryStudies: 'MMR IHC: MLH1 loss (abnormal). MSH2: Retained. MSH6: Retained. PMS2: Loss. Pattern consistent with MLH1 promoter hypermethylation (sporadic MSI-H). BRAF V600E: Positive. Lynch syndrome unlikely.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4407-SP-1_colon_resection_001',
        specimenId: 'S26-4407-SP-1',
        templateId: 'colon_resection',
        templateName: 'CAP Colon & Rectum Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'low_anterior_resection',
          tumor_site: ['rectum'],
          histologic_type: 'adenocarcinoma',
          histologic_grade: 'g2',
          treatment_effect: 'te_near_complete',
          tumor_size: '2.5 cm',
          tumor_extent: 'extent_pericolic',
          perineural_invasion: 'pni_not_identified',
          lvi: ['lvi_not_identified'],
          margin_status_invasive: 'all_margins_negative_invasive',
          distance_radial_margin: '4 mm',
          regional_ln_status: 'ln_all_negative',
          ln_with_tumor: '2',
          ln_examined: '16',
          pT_category: 'pT3',
          pN_category: 'pN1b',
          modified_classification: ['mod_y'],
          mesorectum_evaluation: 'meso_complete',
        },
        aiSuggestions: {
          procedure:               { value: 'low_anterior_resection',  confidence: 95, source: 'Gross: "anterior resection … segment of rectum"',                               verification: 'unverified' },
          tumor_site:              { value: ['rectum'],                 confidence: 98, source: 'Gross: "posterior wall … rectum … 8 cm from distal margin"',                    verification: 'unverified' },
          histologic_type:         { value: 'adenocarcinoma',          confidence: 93, source: 'Micro: "Post-treatment rectal adenocarcinoma"',                                 verification: 'unverified' },
          histologic_grade:        { value: 'g2',                      confidence: 76, source: 'Micro: "moderate treatment response" — pre-treatment grade g2',                 verification: 'unverified' },
          treatment_effect:        { value: 'te_near_complete',        confidence: 94, source: 'Micro: "Ryan score 2, <5% residual viable carcinoma"',                          verification: 'unverified' },
          tumor_size:              { value: '2.5 cm',                  confidence: 91, source: 'Gross: "ulcerating tumor measuring 2.5 × 2.0 cm"',                              verification: 'unverified' },
          tumor_extent:            { value: 'extent_pericolic',        confidence: 93, source: 'Micro: "invades through muscularis propria into pericolorectal fat"',            verification: 'unverified' },
          perineural_invasion:     { value: 'pni_not_identified',      confidence: 88, source: 'Micro: "Perineural invasion not identified"',                                   verification: 'unverified' },
          lvi:                     { value: ['lvi_not_identified'],     confidence: 89, source: 'Micro: "Lymphovascular invasion not identified"',                               verification: 'unverified' },
          margin_status_invasive:  { value: 'all_margins_negative_invasive', confidence: 87, source: 'Micro: "CRM: 4 mm (negative)"',                                          verification: 'unverified' },
          distance_radial_margin:  { value: '4 mm',                   confidence: 87, source: 'Micro: "CRM: 4 mm (negative)"',                                                  verification: 'unverified' },
          regional_ln_status:      { value: 'ln_tumor_present',        confidence: 91, source: 'Micro: "2 lymph nodes contain viable metastatic carcinoma"',                    verification: 'unverified' },
          ln_with_tumor:           { value: '2',                       confidence: 91, source: 'Micro: "2 lymph nodes contain viable metastatic carcinoma"',                    verification: 'unverified' },
          ln_examined:             { value: '16',                      confidence: 92, source: 'Micro: "14 of 16 lymph nodes show treatment effect only"',                      verification: 'unverified' },
          pT_category:             { value: 'pT3',                     confidence: 93, source: 'Micro: "ypT3 — pericolorectal fat invasion"',                                   verification: 'unverified' },
          pN_category:             { value: 'pN1b',                    confidence: 87, source: 'Micro: "2 positive nodes — ypN1b"',                                             verification: 'unverified' },
          modified_classification: { value: ['mod_y'],                 confidence: 85, source: 'Post-treatment specimen — ypT staging applies',                                 verification: 'unverified' },
          mesorectum_evaluation:   { value: 'meso_complete',           confidence: 82, source: 'Gross: "mesorectal fascia is intact (complete TME)"',                           verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'colorectal_mdt',      name: 'Colorectal MDT — Mon 13:00', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
      { tagClass: 'ADMINISTRATIVE', id: 'braf_msi_noted',      name: 'BRAF+ / MSI-H Noted',        color: '#f97316', level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [
      { id: 'comp-ihc-4407', name: 'MMR IHC Panel', lisCode: 'IHC', color: '#10b981', severity: 3, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4407-SP-1' },
      { tagClass: 'ADMINISTRATIVE', id: 'comp-mol-4407', name: 'Molecular Panel', lisCode: 'MOL', color: '#10b981', level: 'Case', status: 'Active', severity: 3 },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C20'], snomed: ['363346000'] },
  },

  // ── Case 8: Multi-template — breast invasive + DCIS same case ─────────────
  {
    id: 'S26-4408',
    accession: { accessionNumber: '4408', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4408' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-008', mrn: '100008',
      firstName: 'Carol', lastName: 'Davis',
      dateOfBirth: isoYearsAgo(61, 7, 3), sex: 'F',
      phone: '555-208-4418', email: 'carol.davis@example.org',
      address: '145 Saguaro Way, Glendale, AZ 85301',
    },
    specimens: [
      { id: 'S26-4408-SP-1', label: 'A', description: 'Right breast mastectomy', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'S26-4408-SP-2', label: 'B', description: 'Right axillary contents', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Sarah Chen', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Multifocal right breast carcinoma — index lesion 2.1 cm invasive NST plus extensive DCIS. BRCA1 positive. Opting for bilateral mastectomy.', receivedDate: isoDaysAgo(2), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "right breast mastectomy" is a 512g specimen. Index tumor: stellate tan-white mass 2.1 × 1.9 × 1.7 cm, upper outer quadrant. Surrounding DCIS-suspicious granular tissue spanning approximately 5 cm. Axillary contents contain abundant fibrofatty tissue.',
      microscopicDescription: 'Invasive carcinoma NST, grade 3 (score 9). Extensive high-grade DCIS, comedo type, spanning 52 mm. Lymphovascular invasion identified. All margins negative. Axillary lymph nodes: 2 of 22 positive, largest deposit 8 mm, no extranodal extension.',
      ancillaryStudies: 'ER: Negative. PR: Negative. HER2 IHC: 3+ (positive). Ki-67: 65%.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4408-SP-1_breast_invasive_001',
        specimenId: 'S26-4408-SP-1',
        templateId: 'breast_invasive',
        templateName: 'CAP Breast Invasive Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'total_mastectomy',
          specimen_laterality: 'right',
          tumor_site: ['upper_outer_quadrant'],
          histologic_type: 'invasive_nst',
          histologic_grade: '3 (score 9)',
          tumor_size: '2.1 cm',
          lvi: ['lvi_present'],
          margin_status_invasive: 'all_margins_negative_invasive',
          regional_ln_status: 'tumor_present_nodes',
          number_ln_macrometastases: '2',
          largest_nodal_met_mm: '8',
          extranodal_extension: 'ene_not_identified',
          total_ln_examined: '22',
          treatment_effect_breast: 'no_presurgical_therapy',
          treatment_effect_nodes: 'nodes_not_applicable',
        },
        aiSuggestions: {
          procedure:                { value: 'total_mastectomy',             confidence: 97, source: 'Gross: "right breast mastectomy … 512g specimen"',                        verification: 'unverified' },
          specimen_laterality:      { value: 'right',                        confidence: 99, source: 'Gross: "right breast mastectomy"',                                        verification: 'unverified' },
          tumor_site:               { value: ['upper_outer_quadrant'],       confidence: 90, source: 'Gross: "stellate tan-white mass … upper outer quadrant"',                 verification: 'unverified' },
          histologic_type:          { value: 'invasive_nst',                 confidence: 94, source: 'Micro: "Invasive carcinoma NST, grade 3"',                               verification: 'unverified' },
          histologic_grade:         { value: '3 (score 9)',                  confidence: 96, source: 'Micro: "grade 3 (score 9)"',                                             verification: 'unverified' },
          tumor_size:               { value: '2.1 cm',                       confidence: 93, source: 'Gross: "index tumor … 2.1 × 1.9 × 1.7 cm"',                              verification: 'unverified' },
          lvi:                      { value: ['lvi_present'],                 confidence: 95, source: 'Micro: "Lymphovascular invasion identified"',                             verification: 'unverified' },
          margin_status_invasive:   { value: 'all_margins_negative_invasive', confidence: 91, source: 'Micro: "All margins negative"',                                          verification: 'unverified' },
          regional_ln_status:       { value: 'tumor_present_nodes',          confidence: 95, source: 'Micro: "2 of 22 positive … axillary lymph nodes"',                       verification: 'unverified' },
          number_ln_macrometastases:{ value: '2',                             confidence: 94, source: 'Micro: "2 of 22 positive … largest deposit 8 mm"',                       verification: 'unverified' },
          largest_nodal_met_mm:     { value: '8',                             confidence: 90, source: 'Micro: "largest deposit 8 mm"',                                          verification: 'unverified' },
          extranodal_extension:     { value: 'ene_not_identified',            confidence: 88, source: 'Micro: "no extranodal extension"',                                       verification: 'unverified' },
          total_ln_examined:        { value: '22',                            confidence: 94, source: 'Micro: "2 of 22 … axillary lymph nodes"',                                verification: 'unverified' },
          treatment_effect_breast:  { value: 'no_presurgical_therapy',        confidence: 80, source: 'No presurgical therapy mentioned',                                       verification: 'unverified' },
          treatment_effect_nodes:   { value: 'nodes_not_applicable',          confidence: 78, source: 'No presurgical therapy mentioned',                                       verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
      {
        instanceId: 'S26-4408-SP-1_breast_dcis_001',
        specimenId: 'S26-4408-SP-1',
        templateId: 'breast_dcis_resection',
        templateName: 'CAP Breast DCIS — Resection',
        status: 'draft',
        answers: {
          procedure: 'total_mastectomy',
          specimen_laterality: 'right',
          tumor_type: 'dcis_without_invasion',
          dcis_nuclear_grade: 'grade_3_high',
          dcis_architectural_patterns: ['comedo'],
          dcis_size_extent: '52 mm',
          margin_status_dcis: 'all_margins_negative_dcis',
          regional_ln_status: 'no_nodes_submitted',
        },
        aiSuggestions: {
          procedure:               { value: 'total_mastectomy',          confidence: 97, source: 'Gross: "right breast mastectomy"',                         verification: 'unverified' },
          specimen_laterality:     { value: 'right',                     confidence: 99, source: 'Gross: "right breast mastectomy"',                         verification: 'unverified' },
          tumor_type:              { value: 'dcis_without_invasion',     confidence: 88, source: 'Micro: "Extensive high-grade DCIS, comedo type"',          verification: 'unverified' },
          dcis_nuclear_grade:      { value: 'grade_3_high',              confidence: 95, source: 'Micro: "Extensive high-grade DCIS"',                       verification: 'unverified' },
          dcis_architectural_patterns: { value: ['comedo'],               confidence: 94, source: 'Micro: "high-grade DCIS, comedo type"',                   verification: 'unverified' },
          dcis_size_extent:        { value: '52 mm',                     confidence: 91, source: 'Micro: "DCIS … spanning 52 mm"',                           verification: 'unverified' },
          margin_status_dcis:      { value: 'all_margins_negative_dcis', confidence: 90, source: 'Micro: "All margins negative"',                            verification: 'unverified' },
          regional_ln_status:      { value: 'no_nodes_submitted',        confidence: 70, source: 'DCIS template — node status per invasive report',          verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'oncology_hold',       name: 'Oncology Treatment on Hold', color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
      { tagClass: 'ADMINISTRATIVE', id: 'brca1_positive',      name: 'BRCA1 Pathogenic Variant',   color: '#8b5cf6', level: 'Case', status: 'Active', severity: 4 },
      { tagClass: 'ADMINISTRATIVE', id: 'stat_rush',           name: 'STAT — Rush Processing',     color: '#ef4444',    level: 'Case', status: 'Active', severity: 5 },
    ],
    specimenFlags: [
      { id: 'comp-erh2-4408', name: 'ER/PR/HER2', lisCode: 'ERH2', color: '#ef4444', severity: 3, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4408-SP-1' },
      { id: 'comp-her2f-4408', name: 'HER2 FISH', lisCode: 'HER2', color: '#ef4444', severity: 3, tagClass: 'COMPUTATIONAL', orderedVia: 'lis', specimenId: 'S26-4408-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C50.411'], snomed: ['413448000'] },
  },

  // ── Case 9: Centennial patient — tests 3-digit age display ───────────────
  {
    id: 'S26-4409',
    accession: { accessionNumber: '4409', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4409' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-009', mrn: '100009',
      firstName: 'Beatrice', lastName: 'Holloway',
      dateOfBirth: isoYearsAgo(100, 1, 3), sex: 'F',
      phone: '555-209-4419', email: '',
      address: '12 Veteran Lane, Phoenix, AZ 85001',
    },
    specimens: [
      { id: 'S26-4409-SP-1', label: 'A', description: 'Left breast lumpectomy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Sarah Chen', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Breast mass, left upper outer quadrant. 100-year-old female. Core biopsy: invasive carcinoma. Proceeding to lumpectomy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received fresh labeled "left breast lumpectomy" is a 42g specimen, 6.0 × 4.5 × 2.5 cm. A firm, tan-white, stellate mass measuring 1.4 × 1.1 × 1.0 cm is present in the upper outer quadrant.',
      microscopicDescription: 'Invasive carcinoma of no special type (NST), Nottingham grade 1. Margins negative.',
      ancillaryStudies: 'ER: Positive. PR: Positive. HER2: Negative.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4409-SP-1_breast_invasive_001',
        specimenId: 'S26-4409-SP-1',
        templateId: 'breast_invasive',
        templateName: 'CAP Breast Invasive Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'excision_less_than_total_mastectomy',
          specimen_laterality: 'left',
          histologic_type: 'invasive_nst',
          histologic_grade: '1',
          tumor_size: '1.4 cm',
          margin_status_invasive: 'all_margins_negative_invasive',
          treatment_effect_breast: 'no_presurgical_therapy',
          treatment_effect_nodes: 'nodes_not_applicable',
          lvi: ['lvi_not_identified'],
        },
        aiSuggestions: {
          procedure:              { value: 'excision_less_than_total_mastectomy', confidence: 93, source: 'Gross: "left breast lumpectomy … 42g specimen"',          verification: 'unverified' },
          specimen_laterality:    { value: 'left',                               confidence: 99, source: 'Gross: "left breast lumpectomy"',                           verification: 'unverified' },
          histologic_type:        { value: 'invasive_nst',                       confidence: 95, source: 'Micro: "invasive carcinoma of no special type (NST)"',     verification: 'unverified' },
          histologic_grade:       { value: '1',                                  confidence: 92, source: 'Micro: "Nottingham grade 1"',                               verification: 'unverified' },
          tumor_size:             { value: '1.4 cm',                             confidence: 94, source: 'Gross: "stellate mass measuring 1.4 × 1.1 × 1.0 cm"',     verification: 'unverified' },
          margin_status_invasive: { value: 'all_margins_negative_invasive',      confidence: 91, source: 'Micro: "Margins negative"',                                 verification: 'unverified' },
          treatment_effect_breast:{ value: 'no_presurgical_therapy',             confidence: 80, source: 'No presurgical therapy mentioned',                          verification: 'unverified' },
          treatment_effect_nodes: { value: 'nodes_not_applicable',               confidence: 78, source: 'No presurgical therapy mentioned',                          verification: 'unverified' },
          lvi:                    { value: ['lvi_not_identified'],                confidence: 70, source: 'No lymphovascular invasion mentioned',                      verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'geriatric_patient', name: 'Geriatric Patient — 100y', color: '#8b5cf6', level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C50.412'], snomed: ['413448000'] },
  },

  // ── Case 10: Neonate (< 1 month) — Product of Conception ─────────────────
  {
    id: 'S26-4410',
    accession: { accessionNumber: '4410', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4410' },
    originHospitalId: 'HOSP-002', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-010', mrn: '100010',
      firstName: 'Baby', lastName: 'Nguyen',
      dateOfBirth: (() => { const d = new Date(); d.setHours(d.getHours() - 4); return d.toISOString(); })(),
      sex: 'F',
      phone: '', email: '',
      address: '',
    },
    specimens: [
      { id: 'S26-4410-SP-1', label: 'A', description: 'Products of conception', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Lisa Wong', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Elective termination of pregnancy at 9 weeks gestation. Products of conception submitted for histological evaluation.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Received in formalin labeled "products of conception" is a 12g aggregate of pale grey-white, friable tissue measuring in aggregate 4.0 × 3.0 × 1.5 cm. Chorionic villi are identified grossly.',
      microscopicDescription: 'Pending.',
      ancillaryStudies: 'Pending.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4410-SP-1_poc_001',
        specimenId: 'S26-4410-SP-1',
        templateId: 'breast_dcis_resection',
        templateName: 'Non-Neoplastic — Default Negative',
        status: 'draft',
        answers: {},
        createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'poc_case', name: 'Products of Conception', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
  },

  // ── Case 11: Pending Review — awaiting attending sign-off ────────────────
  {
    id: 'S26-4411',
    accession: { accessionNumber: '4411', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4411' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-011', mrn: '100011',
      firstName: 'Margaret', lastName: 'Foster',
      dateOfBirth: isoYearsAgo(61, 4, 22), sex: 'F',
      phone: '555-211-4421', email: 'margaret.foster@example.org',
      address: '88 Ironwood Dr, Scottsdale, AZ 85251',
    },
    specimens: [
      { id: 'S26-4411-SP-1', label: 'A', description: 'Right breast core needle biopsy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Sarah Chen', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Suspicious right breast mass 1.5 cm. BI-RADS 5. Ultrasound-guided core needle biopsy.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Three cores, 1.2–1.5 cm, grey-white and firm.',
      microscopicDescription: 'Invasive carcinoma of no special type, Grade 2. ER/PR/HER2 pending.',
      ancillaryStudies: 'ER, PR, HER2 IHC: Pending.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4411-SP-1_breast_invasive_001',
        specimenId: 'S26-4411-SP-1',
        templateId: 'breast_invasive',
        templateName: 'CAP Breast Invasive Carcinoma — Resection',
        status: 'draft',
        answers: {
          procedure: 'excision_less_than_total_mastectomy',
          specimen_laterality: 'right',
          histologic_type: 'invasive_nst',
          histologic_grade: '2',
        },
        aiSuggestions: {
          procedure:           { value: 'excision_less_than_total_mastectomy', confidence: 88, source: 'Gross: "right breast core needle biopsy … 3 cores"',         verification: 'unverified' },
          specimen_laterality: { value: 'right',                               confidence: 99, source: 'Gross: "right breast core needle biopsy"',                   verification: 'unverified' },
          histologic_type:     { value: 'invasive_nst',                        confidence: 93, source: 'Micro: "Invasive carcinoma of no special type, Grade 2"',   verification: 'unverified' },
          histologic_grade:    { value: '2',                                   confidence: 91, source: 'Micro: "Invasive carcinoma of no special type, Grade 2"',   verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'pending-review' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'awaiting_sign_off',  name: 'Awaiting Attending Sign-off', color: '#f59e0b', level: 'Case', status: 'Active', severity: 3 },
      { tagClass: 'ADMINISTRATIVE', id: 'ihc_pending',        name: 'ER/PR/HER2 Pending',          color: '#3b82f6',   level: 'Case', status: 'Active', severity: 2 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C50.411'], snomed: ['413448000'] },
  },

  // ── Case 12: Amended — addendum after finalization ────────────────────────
  {
    id: 'S26-4412',
    accession: { accessionNumber: '4412', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4412' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-012', mrn: '100012',
      firstName: 'Harold', lastName: 'Bennett',
      dateOfBirth: isoYearsAgo(58, 9, 15), sex: 'M',
      phone: '555-212-4422', email: 'harold.bennett@example.org',
      address: '203 Cactus Ridge Rd, Mesa, AZ 85201',
    },
    specimens: [
      { id: 'S26-4412-SP-1', label: 'A', description: 'Prostate needle biopsy — right mid', receivedAt: isoDaysAgo(5), collectedAt: isoDaysAgo(6), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Anil Sharma', clientId: 'c4', clientName: 'Westview Surgery Center', clinicalIndication: 'PSA 7.2, PI-RADS 4. Targeted biopsy right mid-gland. Original report amended to update Gleason grade following second opinion review.', receivedDate: isoDaysAgo(6), assignedTo: 'PATH-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Two cores, 1.4 and 1.6 cm.',
      microscopicDescription: 'AMENDED: Acinar adenocarcinoma, Gleason score 3+4=7, Grade Group 2. Original report issued as Gleason 3+3=6 — amended following MDT review.',
      ancillaryStudies: 'PIN-4: Confirms adenocarcinoma.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4412-SP-1_prostate_001',
        specimenId: 'S26-4412-SP-1',
        templateId: 'prostate_needle_biopsy',
        templateName: 'CAP Prostate — Needle Biopsy',
        status: 'finalized',
        answers: {
          procedure: ['procedure_systematic_biopsy'],
          highest_gleason_score: 'gg2_3_4_7',
          total_number_of_cores: 2,
          number_of_positive_cores: 2,
          perineural_invasion: 'pni_not_identified',
          treatment_effect: ['tx_no_known_presurgical_therapy'],
        },
        aiSuggestions: {
          procedure:                  { value: ['procedure_systematic_biopsy'], confidence: 90, source: 'Gross: "Two cores, 1.4 and 1.6 cm … prostate needle biopsy"', verification: 'verified' },
          highest_gleason_score:      { value: 'gg2_3_4_7',                    confidence: 89, source: 'Micro (amended): "Gleason score 3+4=7 — amended from 3+3=6"', verification: 'disputed' },
          total_number_of_cores:      { value: 2,                              confidence: 93, source: 'Gross: "Two cores"',                                            verification: 'verified' },
          number_of_positive_cores:   { value: 2,                              confidence: 91, source: 'Micro: both cores involved by adenocarcinoma',                  verification: 'verified' },
          perineural_invasion:        { value: 'pni_not_identified',           confidence: 75, source: 'No perineural invasion mentioned',                              verification: 'verified' },
          treatment_effect:           { value: ['tx_no_known_presurgical_therapy'], confidence: 85, source: 'No presurgical therapy mentioned',                         verification: 'verified' },
        },
        createdAt: isoDaysAgo(5), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'amended' as CaseStatus,
    createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'amended_report',    name: 'Amended Report',              color: '#8b5cf6', level: 'Case', status: 'Active', severity: 4 },
      { tagClass: 'ADMINISTRATIVE', id: 'second_opinion',    name: 'Second Opinion — MDT Review', color: '#3b82f6',   level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C61'], snomed: ['254900004'] },
  },

  // ── Pool Cases ──────────────────────────────────────────────────────────────
  {
    id: 'S26-4415-BX-001',
    accession: { accessionNumber: '4415', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4415-BX-001' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: { id: 'PAT-015', mrn: '100015', firstName: 'Robert', lastName: 'Hawkins', dateOfBirth: '1958-11-22T07:00:00.000Z', sex: 'M', phone: '555-301-7711', email: 'rhawkins@example.org', address: '88 Cedar Rd, Phoenix, AZ 85004' },
    specimens: [{ id: 'S26-4415-SP-1', label: 'A', description: 'Sigmoid colon biopsy — three fragments', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] }],
    order: { priority: 'Routine', requestingProvider: 'Dr. Amanda Chen', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Change in bowel habits. Colonoscopy: 15mm polyp sigmoid colon.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: 'Received in formalin labeled "sigmoid colon biopsy" are three tan-pink fragments measuring 0.4–0.8 cm.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: '1',
    poolName: 'Gastrointestinal',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  {
    id: 'S26-4416-BX-001',
    accession: { accessionNumber: '4416', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4416-BX-001' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: { id: 'PAT-016', mrn: '100016', firstName: 'Linda', lastName: 'Okafor', dateOfBirth: '1971-04-09T07:00:00.000Z', sex: 'F', phone: '555-302-8822', email: 'lokafor@example.org', address: '22 Maple St, Phoenix, AZ 85006' },
    specimens: [{ id: 'S26-4416-SP-1', label: 'A', description: 'Skin punch biopsy — right forearm', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] }],
    order: { priority: 'Routine', requestingProvider: 'Dr. Susan Park', clientId: 'c2', clientName: 'Riverside Medical Center', clinicalIndication: 'Pigmented lesion right forearm, irregular border. Rule out melanoma.', receivedDate: isoDaysAgo(1), assignedTo: null },
    diagnostic: { grossDescription: 'Received in formalin labeled "skin punch biopsy right forearm" is a punch biopsy measuring 0.4 cm in diameter and 0.3 cm deep.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: '2',
    poolName: 'Dermatopathology',
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [], specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  {
    id: 'S26-4417-BX-001',
    accession: { accessionNumber: '4417', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4417-BX-001' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: { id: 'PAT-017', mrn: '100017', firstName: 'Marcus', lastName: 'Delgado', dateOfBirth: '1965-07-30T07:00:00.000Z', sex: 'M', phone: '555-303-9933', email: 'mdelgado@example.org', address: '54 Oak Ave, Phoenix, AZ 85008' },
    specimens: [{ id: 'S26-4417-SP-1', label: 'A', description: 'Colon resection — right hemicolectomy', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] }],
    order: { priority: 'STAT', requestingProvider: 'Dr. Kevin Ng', clientId: 'c1', clientName: 'Metro General Hospital', clinicalIndication: 'Ascending colon adenocarcinoma diagnosed on biopsy. CT: T3N0. STAT — OR case.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: 'Received fresh labeled "right hemicolectomy" is a 28 cm segment of right colon with attached terminal ileum. A fungating tumor measuring 3.8 × 3.2 cm is identified in the ascending colon.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: '1',
    poolName: 'Gastrointestinal',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [{ tagClass: 'ADMINISTRATIVE', id: 'stat_rush', name: 'STAT — Rush Processing', color: '#ef4444', level: 'Case', status: 'Active', severity: 5 }],
    specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  // ══════════════════════════════════════════════════════════════════════════════
  // UK DEMO CASES — Paul Carter (PATH-UK-001), Copilot Mode
  // NHS Trust: Manchester University NHS Foundation Trust
  // Templates: RCPath (en-GB), TNM 9
  // ══════════════════════════════════════════════════════════════════════════════

  // ── UK Case 1: Colorectal — Anterior Resection, in-progress ─────────────────
  {
    id: 'MFT26-8801-CR-RES',
    accession: { accessionNumber: '8801', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8801-CR-RES' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-001', mrn: '200001',
      firstName: 'William', lastName: 'Hartley',
      dateOfBirth: isoYearsAgo(68, 4, 12), sex: 'M',
      phone: '0161 234 5678', email: 'w.hartley@nhs.net',
      address: '14 Deansgate, Manchester, M3 2EX',
      nhsNumber: '485 777 3456',
    },
    specimens: [
      { id: 'MFT26-8801-SP-1', label: 'A', description: 'Anterior resection specimen', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
      { id: 'MFT26-8801-SP-2', label: 'B', description: 'Mesorectal lymph nodes', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Mr. James Whitfield',
      clinicalIndication: 'Rectal adenocarcinoma, 7 cm from anal verge. MRI staging: mrT3N1. Completed neoadjuvant long-course chemoradiotherapy. Good radiological response. Proceeding to laparoscopic anterior resection.',
      receivedDate: isoDaysAgo(3),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Received fresh labelled "anterior resection specimen" is a segment of rectum and sigmoid colon measuring 28 cm in length with attached mesorectum. The mesorectal envelope is intact and complete. An ulcerating tumour measuring 3.8 × 2.9 cm is present on the posterior wall, 7 cm from the distal resection margin. The tumour appears to invade into but not through the muscularis propria macroscopically. The circumferential resection margin appears clear. Multiple lymph nodes are identified within the mesorectal fat.',
      microscopicDescription: 'Sections show moderately differentiated adenocarcinoma with evidence of treatment response. Residual tumour invades into the pericolorectal adipose tissue (ypT3). The plane of mesorectal excision is at the level of the mesorectal fascia. Circumferential resection margin clear, closest approach 4 mm. Longitudinal margins clear. No lymphovascular invasion identified. Perineural invasion present. Tumour regression score: TRS 2 (residual cancer with evident tumour regression). 16 lymph nodes identified; 2 of 16 positive for metastatic carcinoma, no extranodal extension (ypN1b).',
      ancillaryStudies: 'Mismatch repair proteins: MLH1, PMS2, MSH2, MSH6 — all nuclear expression intact (MMR proficient). KRAS codon 12/13: p.G12V mutation detected. BRAF V600E: wild type. MSI testing: MS-stable.',
    },
    synopticReports: [
      {
        instanceId: 'MFT26-8801-SP-1_rcpath_colorectal_resection_001',
        specimenId: 'MFT26-8801-SP-1',
        templateId: 'rcpath_colorectal_resection',
        templateName: 'RCPath Colorectal Carcinoma — Resection (Appendix F)',
        status: 'draft',
        answers: {
          specimen_type: 'anterior_resection',
          tumour_site: 'rectum',
          maximum_tumour_diameter_mm: '38',
          tumour_perforation: 'perforation_no',
          relation_to_peritoneal_reflection: 'below_reflection',
          tumour_type: 'adenocarcinoma',
          differentiation: 'well_moderate',
          local_invasion: ['pT3'],
          max_distance_beyond_muscularis_propria_mm: '4',
          plane_of_mesorectal_excision: 'mesorectal_fascia',
          venous_invasion: 'venous_none',
          lymphatic_invasion: 'lymphatic_none',
          perineural_invasion: 'perineural_extramural',
          number_of_lymph_nodes_examined: '16',
          number_of_positive_lymph_nodes: '2',
          tumour_deposits: 'no_deposits',
          longitudinal_margin_involvement: 'longitudinal_not_involved',
          circumferential_margin_involvement: 'crm_not_involved',
          crm_distance_mm: '4',
          tumour_regression_score: 'trs_2',
          pt_category: 'ypT3',
          pn_category: 'ypN1b',
          pm_category: 'pM0',
          resection_status: 'r0',
          mmr_mlh1: 'mlh1_intact',
          mmr_pms2: 'pms2_intact',
          mmr_msh2: 'msh2_intact',
          mmr_msh6: 'msh6_intact',
          msi_status: 'ms_stable',
          kras_status: 'kras_mutant',
          kras_mutation_detail: 'p.G12V',
          braf_v600e: 'braf_absent',
          snomed_topography: 'T68000',
          snomed_morphology: 'M81403',
        },
        aiSuggestions: {
          specimen_type:           { value: 'anterior_resection',        confidence: 96, source: 'Gross: "anterior resection specimen"',                        verification: 'unverified' },
          tumour_site:             { value: 'rectum',                    confidence: 94, source: 'Order: "rectal adenocarcinoma, 7 cm from anal verge"',         verification: 'unverified' },
          maximum_tumour_diameter: { value: '38',                        confidence: 91, source: 'Gross: "3.8 × 2.9 cm"',                                       verification: 'unverified' },
          tumour_perforation:      { value: 'perforation_no',             confidence: 88, source: 'Gross: no perforation mentioned',                             verification: 'unverified' },
          relation_to_peritoneal_reflection: { value: 'below_reflection', confidence: 82, source: 'Order: "7 cm from anal verge"',                               verification: 'unverified' },
          tumour_type_adenocarcinoma: { value: 'adenocarcinoma',          confidence: 98, source: 'Micro: "moderately differentiated adenocarcinoma"',            verification: 'unverified' },
          differentiation:         { value: 'well_moderate',             confidence: 90, source: 'Micro: "moderately differentiated"',                          verification: 'unverified' },
          plane_of_mesorectal_excision: { value: 'mesorectal_fascia',    confidence: 93, source: 'Micro: "plane of mesorectal excision is at the level of the mesorectal fascia"', verification: 'unverified' },
          perineural_invasion:     { value: 'perineural_extramural',     confidence: 85, source: 'Micro: "perineural invasion present"',                         verification: 'unverified' },
          number_of_lymph_nodes:   { value: '16',                        confidence: 92, source: 'Micro: "16 lymph nodes identified"',                           verification: 'unverified' },
          number_of_involved_lymph_nodes: { value: '2',                  confidence: 92, source: 'Micro: "2 of 16 positive"',                                   verification: 'unverified' },
          distance_to_circumferential_margin: { value: '4',              confidence: 88, source: 'Micro: "closest approach 4 mm"',                              verification: 'unverified' },
          preoperative_therapy_response: { value: 'Residual cancer with evident tumour regression (TRS 2)', confidence: 87, source: 'Micro: "TRS 2"',            verification: 'unverified' },
          pT:                      { value: 'ypT3',                      confidence: 90, source: 'Micro: "ypT3"',                                               verification: 'unverified' },
          pN:                      { value: 'ypN1b',                     confidence: 90, source: 'Micro: "ypN1b"',                                              verification: 'unverified' },
          resection_status:        { value: 'r0',                         confidence: 89, source: 'Micro: "Longitudinal margins clear, CRM clear"',               verification: 'unverified' },
          mmr_mlh1:                { value: 'mlh1_intact',               confidence: 96, source: 'Ancillary: "MLH1 nuclear expression intact"',                  verification: 'unverified' },
          kras_mutation:           { value: 'kras_mutant',               confidence: 97, source: 'Ancillary: "p.G12V mutation detected"',                        verification: 'unverified' },
          kras_mutation_specify:   { value: 'p.G12V',                    confidence: 95, source: 'Ancillary: "KRAS codon 12/13: p.G12V"',                       verification: 'unverified' },
          braf_v600e:              { value: 'braf_absent',               confidence: 97, source: 'Ancillary: "BRAF V600E: wild type"',                          verification: 'unverified' },
          snomed_topography:       { value: 'T68000',                    confidence: 92, source: 'SNOMED: Rectum structure',                                    verification: 'unverified' },
          snomed_morphology:       { value: 'M81403',                    confidence: 94, source: 'SNOMED: Adenocarcinoma',                                      verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'mdt_colorectal', name: 'Colorectal MDT — Wed 14:00', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
      { tagClass: 'ADMINISTRATIVE', id: 'kras_result',    name: 'KRAS Result — Oncology Notified', color: '#10b981', level: 'Case', status: 'Active', severity: 1 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: {
      icd10: ['C20'],
      snomed: ['413448001'],
    },
  },

  // ── UK Case 2: Prostate — Needle Biopsy, draft ───────────────────────────────
  {
    id: 'MFT26-8802-PR-BX',
    accession: { accessionNumber: '8802', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8802-PR-BX' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-002', mrn: '200002',
      firstName: 'Geoffrey', lastName: 'Barrowclough',
      dateOfBirth: isoYearsAgo(71, 9, 3), sex: 'M',
      phone: '0161 345 6789', email: 'g.barrowclough@nhs.net',
      address: '7 Piccadilly Gardens, Manchester, M1 1RG',
      nhsNumber: '612 345 9087',
    },
    specimens: [
      { id: 'MFT26-8802-SP-1', label: 'A', description: 'Prostate biopsy — right apex', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8802-SP-2', label: 'B', description: 'Prostate biopsy — right mid', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8802-SP-3', label: 'C', description: 'Prostate biopsy — right base', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8802-SP-4', label: 'D', description: 'Prostate biopsy — left apex', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8802-SP-5', label: 'E', description: 'Prostate biopsy — left mid', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8802-SP-6', label: 'F', description: 'Prostate biopsy — left base', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Mr. David Whitmore', clientId: 'c-mft-02', clientName: 'Wythenshawe Hospital',
      clinicalIndication: 'PSA 12.4 ng/mL, rising trend. Abnormal DRE: nodule right lobe. mpMRI prostate: PI-RADS 5 lesion right mid-gland, 14 mm. Proceeding to MRI-targeted and systematic transperineal biopsy under general anaesthetic.',
      receivedDate: isoDaysAgo(1),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Received in formalin, six containers labelled A through F. Specimen A (right apex): 2 cores, 17 mm and 14 mm. Specimen B (right mid): 2 cores, 18 mm and 16 mm — targeted cores from PI-RADS 5 lesion. Specimen C (right base): 2 cores, 15 mm and 13 mm. Specimens D–F (left apex, mid, base): 2 cores each, 12–16 mm. All cores are grey-white and rubbery.',
      microscopicDescription: 'Specimens A, B, C (right apex, mid, base): Acinar adenocarcinoma (usual type), Gleason score 4+3=7 (Grade Group 3). 5 of 6 cores involved. Maximum % core involvement: 85% (right mid, targeted core). Perineural invasion present. No seminal vesicle involvement identified on biopsy. Specimens D, E, F (left apex, mid, base): Benign prostatic tissue with mild chronic inflammation. No carcinoma identified.',
      ancillaryStudies: 'PSMA IHC: Strongly positive in carcinoma foci. PIN-4 cocktail (CK5/6, p63, AMACR): Confirms adenocarcinoma, loss of basal cells confirmed.',
    },
    synopticReports: [
      {
        instanceId: 'MFT26-8802-SP-1_rcpath_prostate_biopsy_001',
        specimenId: 'MFT26-8802-SP-1',
        templateId: 'rcpath_prostate_biopsy',
        templateName: 'RCPath Prostate — Needle Biopsy',
        status: 'draft',
        answers: {},
        aiSuggestions: {
          procedure:                      { value: ['procedure_systematic_biopsy', 'procedure_targeted_biopsy'], confidence: 95, source: 'Gross: "systematic transperineal biopsy ... targeted cores"',  verification: 'unverified' },
          positive_specimen_locations:    { value: ['positive_right'],             confidence: 97, source: 'Micro: "Specimens A, B, C (right) — carcinoma identified"',           verification: 'unverified' },
          highest_gleason_score:          { value: 'gg3_4_3_7',                   confidence: 98, source: 'Micro: "Gleason score 4+3=7 (Grade Group 3)"',                        verification: 'unverified' },
          intraductal_carcinoma:          { value: 'idc_not_identified',           confidence: 80, source: 'Micro: no intraductal carcinoma mentioned',                           verification: 'unverified' },
          perineural_invasion:            { value: 'pni_present',                  confidence: 97, source: 'Micro: "Perineural invasion present"',                               verification: 'unverified' },
          seminal_vesicle_invasion:       { value: 'svi_not_identified',           confidence: 90, source: 'Micro: "No seminal vesicle involvement identified on biopsy"',        verification: 'unverified' },
        },
        createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'pending-countersign' as CaseStatus,
    requiresCountersign: true,
    caseTeam: [
      { userId: 'PATH-UK-001', role: 'Attending', name: 'Paul Carter' },
      { userId: 'PATH-UK-002', role: 'Resident',  name: 'Oliver Pemberton' },
    ],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'urology_mdt', name: 'Urology MDT — Fri 09:00', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
      { tagClass: 'ADMINISTRATIVE', id: 'psma_positive', name: 'PSMA IHC — Positive', color: '#f59e0b', level: 'Case', status: 'Active', severity: 2 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C61'], snomed: [] },
  },

  // ── UK Case 3: Colorectal — Local Excision, pending review ──────────────────
  {
    id: 'MFT26-8803-CR-LOC',
    accession: { accessionNumber: '8803', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8803-CR-LOC' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-003', mrn: '200003',
      firstName: 'Margaret', lastName: 'Ashworth',
      dateOfBirth: isoYearsAgo(58, 7, 19), sex: 'F',
      phone: '0161 456 7890', email: 'm.ashworth@nhs.net',
      address: '22 Oxford Road, Manchester, M13 9PL',
      nhsNumber: '345 678 1234',
    },
    specimens: [
      { id: 'MFT26-8803-SP-1', label: 'A', description: 'Transanal endoscopic microsurgery (TEMS) excision — rectal polyp', receivedAt: isoDaysAgo(3), collectedAt: isoDaysAgo(4), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Mr. James Whitfield',
      clinicalIndication: 'Sessile rectal polyp, 4 cm, 6 cm from anal verge. Colonoscopy biopsy: tubulovillous adenoma with high-grade dysplasia. Proceeding to TEMS excision.',
      receivedDate: isoDaysAgo(4),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Received fresh labelled "TEMS excision — rectal polyp" is an intact disc of rectal wall measuring 4.2 × 3.8 cm. The mucosal surface shows a sessile polyp measuring 3.9 × 3.5 cm with a villous surface. The deep margin is inked blue. Sectioning reveals the polyp extends to but does not appear to breach the muscularis propria.',
      microscopicDescription: 'Sections show a tubulovillous adenoma with focal areas of invasive adenocarcinoma (well differentiated, pT1). Maximum depth of invasive tumour from muscularis mucosae: 1.8 mm. Width of invasive tumour: 6 mm. Haggitt level: not applicable (sessile). Kikuchi level: sm1. No lymphovascular invasion. No perineural invasion. Deep margin: not involved (clearance 1.2 mm). Peripheral margin: not involved. Tumour budding: Bd1 (3 buds identified). Resection status: R0.',
      ancillaryStudies: 'MMR IHC: MLH1, PMS2, MSH2, MSH6 — all nuclear expression intact.',
    },
    synopticReports: [
      {
        instanceId: 'MFT26-8803-SP-1_rcpath_colorectal_local_excision_001',
        specimenId: 'MFT26-8803-SP-1',
        templateId: 'rcpath_colorectal_local_excision',
        templateName: 'RCPath Colorectal Carcinoma — Local Excision (Appendix D)',
        status: 'draft',
        answers: {
          specimen_type: 'Endoscopic submucosal dissection',
          site_of_tumour: 'Rectum',
          maximum_tumour_diameter: '39',
          tumour_type_adenocarcinoma: 'Yes',
          differentiation: 'Well/moderate',
          local_invasion: ['Submucosa (pT1)'],
          kikuchi_level: 'sm1',
          venous_invasion: 'None',
          lymphatic_invasion: 'None',
          perineural_invasion: 'None',
          tumour_budding: 'Bd1 (<5 buds)',
          margin_peripheral: 'Not involved',
          margin_deep: 'Not involved',
          resection_status: 'Yes (R0)',
          tnm_edition: 'UICC9',
          pT: 'pT1',
          pN: 'pNX',
          snomed_topography: 'T59600',
          snomed_morphology: 'M81403',
        },
        aiSuggestions: {
          specimen_type:       { value: 'Endoscopic submucosal dissection', confidence: 88, source: 'Order: "TEMS excision"', verification: 'unverified' },
          site_of_tumour:      { value: 'Rectum',                          confidence: 95, source: 'Order: "rectal polyp, 6 cm from anal verge"', verification: 'unverified' },
          differentiation:     { value: 'Well/moderate',                   confidence: 90, source: 'Micro: "well differentiated"', verification: 'unverified' },
          local_invasion:      { value: ['Submucosa (pT1)'],               confidence: 88, source: 'Micro: "invasive adenocarcinoma pT1"', verification: 'unverified' },
          kikuchi_level:       { value: 'sm1',                             confidence: 85, source: 'Micro: "Kikuchi level: sm1"', verification: 'unverified' },
          tumour_budding:      { value: 'Bd1 (<5 buds)',                   confidence: 82, source: 'Micro: "Bd1 (3 buds identified)"', verification: 'unverified' },
          margin_deep:         { value: 'Not involved',                    confidence: 90, source: 'Micro: "Deep margin: not involved"', verification: 'unverified' },
          resection_status:    { value: 'Yes (R0)',                        confidence: 92, source: 'Micro: "Resection status: R0"', verification: 'unverified' },
          pT:                  { value: 'pT1',                             confidence: 90, source: 'Micro: "pT1"', verification: 'unverified' },
          snomed_topography:   { value: 'T59600',                         confidence: 90, source: 'SNOMED: Rectum structure', verification: 'unverified' },
          snomed_morphology:   { value: 'M81403',                         confidence: 93, source: 'SNOMED: Adenocarcinoma', verification: 'unverified' },
        },
        createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'pending-review' as CaseStatus,
    createdAt: isoDaysAgo(4), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'second_opinion', name: 'Second Opinion Requested', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C20'], snomed: ['413448001'] },
  },

  // ── UK Case 4: Prostate — Radical Prostatectomy, draft ──────────────────────
  {
    id: 'MFT26-8804-PR-RP',
    accession: { accessionNumber: '8804', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8804-PR-RP' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-004', mrn: '200004',
      firstName: 'Thomas', lastName: 'Pemberton',
      dateOfBirth: isoYearsAgo(63, 11, 28), sex: 'M',
      phone: '0161 567 8901', email: 't.pemberton@nhs.net',
      address: '45 Wilmslow Road, Manchester, M14 5AQ',
      nhsNumber: '789 012 3456',
    },
    specimens: [
      { id: 'MFT26-8804-SP-1', label: 'A', description: 'Radical prostatectomy specimen', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8804-SP-2', label: 'B', description: 'Right pelvic lymph nodes', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'MFT26-8804-SP-3', label: 'C', description: 'Left pelvic lymph nodes', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Mr. David Whitmore', clientId: 'c-mft-02', clientName: 'Wythenshawe Hospital',
      clinicalIndication: 'Prostate adenocarcinoma, Gleason 4+3=7, Grade Group 3. PSA 11.2 ng/mL. MRI: T2N0. Proceeding to robot-assisted radical prostatectomy with bilateral pelvic lymph node dissection.',
      receivedDate: isoDaysAgo(1),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Received fresh labelled "radical prostatectomy" is a prostate gland with attached seminal vesicles weighing 54g and measuring 4.8 × 4.2 × 3.9 cm. The external surface is inked (right: red, left: black, anterior: blue). Serial sectioning reveals a firm, grey-white tumour predominantly involving the right mid and base, estimated to occupy 35% of the gland volume. The tumour appears to extend to the inked right posterolateral margin in one section. Bilateral seminal vesicles unremarkable. Bilateral pelvic lymph node packages submitted separately.',
      microscopicDescription: 'Sections show acinar adenocarcinoma, Gleason score 4+3=7 (Grade Group 3). Tumour involves right mid, right base, and right apex. Extraprostatic extension present at right posterolateral aspect, spanning 2.1 mm. Right posterolateral surgical margin positive over 1.2 mm. All other margins clear. No seminal vesicle invasion. No lymphovascular invasion. Right pelvic lymph nodes: 0 of 8 positive. Left pelvic lymph nodes: 0 of 7 positive.',
      ancillaryStudies: 'PIN-4 cocktail: confirms adenocarcinoma. PSMA IHC: positive.',
    },
    synopticReports: [
      {
        instanceId: 'MFT26-8804-SP-1_rcpath_prostate_rp_001',
        specimenId: 'MFT26-8804-SP-1',
        templateId: 'rcpath_prostate_radical_prostatectomy',
        templateName: 'RCPath Prostate — Radical Prostatectomy',
        status: 'draft',
        answers: {},
        aiSuggestions: {
          histological_tumour_type:         { value: ['acinar_adenocarcinoma'],  confidence: 99, source: 'Micro: "acinar adenocarcinoma"',                                          verification: 'unverified' },
          primary_gleason_grade:            { value: 'primary_4',               confidence: 98, source: 'Micro: "Gleason score 4+3=7"',                                            verification: 'unverified' },
          secondary_gleason_grade:          { value: 'secondary_3',             confidence: 98, source: 'Micro: "Gleason score 4+3=7"',                                            verification: 'unverified' },
          gleason_score_total:              { value: 'gleason_7',               confidence: 97, source: 'Micro: "Gleason score 4+3=7"',                                            verification: 'unverified' },
          grade_group:                      { value: 'gg_3',                    confidence: 97, source: 'Micro: "Grade Group 3"',                                                  verification: 'unverified' },
          extraprostatic_extension:         { value: 'epe_present',             confidence: 96, source: 'Micro: "Extraprostatic extension present at right posterolateral"',        verification: 'unverified' },
          extraprostatic_extension_extent:  { value: 'epe_established',         confidence: 88, source: 'Micro: "spanning 2.1 mm"',                                               verification: 'unverified' },
          seminal_vesicle_involvement:      { value: 'sv_not_involved',         confidence: 99, source: 'Micro: "No seminal vesicle invasion"',                                    verification: 'unverified' },
          margin_status:                    { value: 'margin_involved',         confidence: 97, source: 'Micro: "Right posterolateral surgical margin positive over 1.2 mm"',      verification: 'unverified' },
          lymphovascular_invasion:          { value: 'lvi_not_identified',      confidence: 96, source: 'Micro: "No lymphovascular invasion"',                                     verification: 'unverified' },
          n_category:                       { value: 'pN0',                     confidence: 99, source: 'Micro: "0 of 8 positive ... 0 of 7 positive"',                            verification: 'unverified' },
          t_category:                       { value: 'pT3a',                    confidence: 94, source: 'Micro: extraprostatic extension -> pT3a',                                 verification: 'unverified' },
        },
        createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'positive_margin', name: 'Positive Surgical Margin', color: '#ef4444', level: 'Case', status: 'Active', severity: 3 },
      { tagClass: 'ADMINISTRATIVE', id: 'urology_mdt', name: 'Urology MDT — Fri 09:00', color: '#3b82f6', level: 'Case', status: 'Active', severity: 2 },
    ],
    requiresCountersign: true,
    caseTeam: [
      { userId: 'PATH-UK-001', role: 'Attending', name: 'Paul Carter' },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C61'], snomed: [] },
  },

  // ── UK Case 5: Colorectal — Completed/Finalised ──────────────────────────────
  {
    id: 'MFT26-8805-CR-FIN',
    accession: { accessionNumber: '8805', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8805-CR-FIN' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-005', mrn: '200005',
      firstName: 'Patricia', lastName: 'Hollingsworth',
      dateOfBirth: isoYearsAgo(55, 2, 8), sex: 'F',
      phone: '0161 678 9012', email: 'p.hollingsworth@nhs.net',
      address: '8 King Street, Manchester, M2 6AQ',
      nhsNumber: '234 567 8901',
    },
    specimens: [
      { id: 'MFT26-8805-SP-1', label: 'A', description: 'Right hemicolectomy specimen', receivedAt: isoDaysAgo(7), collectedAt: isoDaysAgo(8), specimenFlags: [] },
      { id: 'MFT26-8805-SP-2', label: 'B', description: 'Apical lymph node', receivedAt: isoDaysAgo(7), collectedAt: isoDaysAgo(8), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Mr. James Whitfield',
      clinicalIndication: 'Caecal adenocarcinoma, colonoscopy biopsy confirmed. CT staging: T3N0M0. Proceeding to laparoscopic right hemicolectomy.',
      receivedDate: isoDaysAgo(8),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Right hemicolectomy specimen, 38 cm in length. Fungating tumour in caecum measuring 5.2 × 4.1 cm. Tumour invades through muscularis propria into pericolorectal fat. All margins clear.',
      microscopicDescription: 'Well differentiated adenocarcinoma, pT3. No lymphovascular invasion. No perineural invasion. 22 lymph nodes; 0 of 22 positive (pN0). CRM clear, 8 mm. R0 resection. MMR proficient.',
      ancillaryStudies: 'MMR IHC: all four proteins retained. MSI: MS-stable. KRAS: wild type. BRAF V600E: wild type.',
    },
    synopticReports: [
      {
        instanceId: 'MFT26-8805-SP-1_rcpath_colorectal_resection_001',
        specimenId: 'MFT26-8805-SP-1',
        templateId: 'rcpath_colorectal_resection',
        templateName: 'RCPath Colorectal Carcinoma — Resection (Appendix F)',
        status: 'draft',
        answers: {
          specimen_type: 'Right hemicolectomy',
          site_of_tumour: 'Caecum',
          maximum_tumour_diameter: '52',
          tumour_type_adenocarcinoma: 'Yes',
          differentiation: 'Well/moderate',
          local_invasion: ['Beyond muscularis propria'],
          venous_invasion: 'None',
          lymphatic_invasion: 'None',
          perineural_invasion: 'None',
          number_of_lymph_nodes: '22',
          number_of_involved_lymph_nodes: '0',
          margin_longitudinal: 'Not involved',
          margin_circumferential: 'Not involved',
          distance_to_circumferential_margin: '8',
          preoperative_therapy_response: 'Not applicable',
          tnm_edition: 'UICC9',
          pT: 'pT3',
          pN: 'pN0',
          pM: 'Not applicable',
          resection_status: 'Yes (R0)',
          mmr_mlh1: 'Yes', mmr_pms2: 'Yes', mmr_msh2: 'Yes', mmr_msh6: 'Yes',
          msi_status: 'MS-stable',
          kras_mutation: 'Absent',
          braf_v600e: 'Absent',
          snomed_topography: 'T59100',
          snomed_morphology: 'M81403',
        },
        aiSuggestions: {},
        createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(5),
      },
    ],
    status: 'finalized' as CaseStatus,
    createdAt: isoDaysAgo(8), updatedAt: isoDaysAgo(5),
    caseFlags: [],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C18.0'], snomed: ['413448001'] },
  },

  // ── UK Case 6: STAT — Colorectal, urgent, unstarted ──────────────────────────
  {
    id: 'MFT26-8806-CR-STAT',
    accession: { accessionNumber: '8806', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8806-CR-STAT' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: {
      id: 'PAT-UK-006', mrn: '200006',
      firstName: 'Edward', lastName: 'Blackwood',
      dateOfBirth: isoYearsAgo(74, 6, 30), sex: 'M',
      phone: '0161 789 0123', email: 'e.blackwood@nhs.net',
      address: '3 Albert Square, Manchester, M2 5PF',
      nhsNumber: '901 234 5678',
    },
    specimens: [
      { id: 'MFT26-8806-SP-1', label: 'A', description: 'Sigmoid colectomy — emergency resection', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: {
      priority: 'STAT',
      requestingProvider: 'Mr. Peter Thornton', clientId: 'c-mft-01', clientName: 'Manchester Royal Infirmary',
      clinicalIndication: 'Emergency presentation with perforated sigmoid colon. CT: sigmoid mass with free air. Proceeding to emergency Hartmann\'s procedure. Intraoperative finding: perforated sigmoid adenocarcinoma.',
      receivedDate: isoDaysAgo(0),
      assignedTo: 'PATH-UK-001',
    },
    diagnostic: {
      grossDescription: 'Fresh sigmoid colectomy specimen, 18 cm. Perforated tumour, 6.5 × 5.2 cm, on the anterior wall. Perforation site 8 mm in diameter. Tumour invades through full bowel wall thickness.',
      microscopicDescription: 'Pending processing.',
      ancillaryStudies: 'Pending.',
    },
    synopticReports: [],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'stat_flag', name: 'STAT — Rush Processing', color: '#ef4444', level: 'Case', status: 'Active', severity: 3 },
      { tagClass: 'ADMINISTRATIVE', id: 'perforation', name: 'Tumour Perforation — pT4', color: '#ef4444', level: 'Case', status: 'Active', severity: 3 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C18.7'], snomed: [] },
  },

  // ── UK Pool Cases — Manchester University NHS Foundation Trust ───────────────
  {
    id: 'MFT26-8807-POOL',
    accession: { accessionNumber: '8807', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8807-POOL' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: { id: 'PAT-UK-007', mrn: '200007', firstName: 'Susan', lastName: 'Hargreaves', dateOfBirth: isoYearsAgo(62, 5, 14), sex: 'F', phone: '0161 890 1234', email: 's.hargreaves@nhs.net', address: '19 Portland Street, Manchester, M1 3HU', nhsNumber: '345 891 2345' },
    specimens: [{ id: 'MFT26-8807-SP-1', label: 'A', description: 'Sigmoid colon biopsy — three fragments', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] }],
    order: { priority: 'Routine', requestingProvider: 'Dr. Helen Marsden', clientId: 'c-mft-03', clientName: 'North Manchester General Hospital', clinicalIndication: 'Change in bowel habit. Colonoscopy: 18mm sessile polyp sigmoid colon. Biopsy taken.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: 'Received in formalin labelled "sigmoid colon biopsy" are three tan-pink fragments measuring 0.3–0.7 cm.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: 'GI-UK',
    poolName: 'Gastrointestinal',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  {
    id: 'MFT26-8808-POOL',
    accession: { accessionNumber: '8808', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8808-POOL' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: { id: 'PAT-UK-008', mrn: '200008', firstName: 'Alan', lastName: 'Butterworth', dateOfBirth: isoYearsAgo(77, 3, 22), sex: 'M', phone: '0161 901 2345', email: 'a.butterworth@nhs.net', address: '6 St Anns Square, Manchester, M2 7LP', nhsNumber: '456 902 3456' },
    specimens: [{ id: 'MFT26-8808-SP-1', label: 'A', description: 'Prostate biopsy — right apex', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
                { id: 'MFT26-8808-SP-2', label: 'B', description: 'Prostate biopsy — right mid', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
                { id: 'MFT26-8808-SP-3', label: 'C', description: 'Prostate biopsy — right base', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] }],
    order: { priority: 'Routine', requestingProvider: 'Mr. David Whitmore', clientId: 'c-mft-02', clientName: 'Wythenshawe Hospital', clinicalIndication: 'PSA 9.1 ng/mL. PI-RADS 4 lesion right mid. Proceeding to targeted biopsy.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: 'Three containers labelled A–C, each containing 2 prostate needle biopsy cores, 12–15 mm each.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: 'URO-UK',
    poolName: 'Uropathology',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  {
    id: 'MFT26-8809-POOL',
    accession: { accessionNumber: '8809', accessionPrefix: 'MFT', accessionYear: 2026, fullAccession: 'MFT26-8809-POOL' },
    originHospitalId: 'HOSP-MFT', originEnterpriseId: 'ENT-MFT',
    patient: { id: 'PAT-UK-009', mrn: '200009', firstName: 'Dorothy', lastName: 'Whitworth', dateOfBirth: isoYearsAgo(49, 8, 5), sex: 'F', phone: '0161 012 3456', email: 'd.whitworth@nhs.net', address: '31 Chapel Street, Salford, M3 5JJ', nhsNumber: '567 013 4567' },
    specimens: [{ id: 'MFT26-8809-SP-1', label: 'A', description: 'Right hemicolectomy — emergency resection', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] }],
    order: { priority: 'STAT', requestingProvider: 'Mr. Peter Thornton', clientId: 'c-mft-01', clientName: 'Manchester Royal Infirmary', clinicalIndication: 'Emergency right hemicolectomy for obstructing caecal mass. CT: suspected adenocarcinoma.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: 'Right hemicolectomy specimen, 32 cm, received fresh. Obstructing tumour in caecum, 5.8 cm. Tumour perforates the serosal surface at one point.', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: 'GI-UK',
    poolName: 'Gastrointestinal',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [{ tagClass: 'ADMINISTRATIVE', id: 'stat_rush', name: 'STAT — Rush Processing', color: '#ef4444', level: 'Case', status: 'Active', severity: 5 }],
    specimenFlags: [],
    reportingMode: 'copilot', coding: {},
  } as any,

  // ─────────────────────────────────────────────────────────────────────────────
  // US DEMO CASES — Henry Ford Health System
  // Amber Fehrs-Battey (PATH-US-001) — Surgical Pathology
  // Dr. J. Mark Tuthill (PATH-US-002) — Pathology Informatics
  // Hospital: HOSP-HFHS  Enterprise: ENT-HFHS
  // ─────────────────────────────────────────────────────────────────────────────


  // ── S26-4420: Sarah Johnson — Melanoma Excision, Ready for Finalisation ──────
  {
    id: 'S26-4420-MEL',
    accession: { accessionNumber: '4420', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4420-MEL' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-001',
    patient: {
      id: 'PAT-4420', mrn: '104420',
      firstName: 'Margaret', lastName: 'Holloway',
      dateOfBirth: isoYearsAgo(54, 3, 18), sex: 'F',
      phone: '555-0420', email: 'm.holloway@email.com',
      address: '44 Elmwood Drive, Springfield, IL 62701',
    },
    specimens: [
      { tagClass: 'ADMINISTRATIVE', id: 'S26-4420-SP-1', label: 'A', description: 'Wide local excision — right forearm', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [
        { tagClass: 'ADMINISTRATIVE', id: 'thick_melanoma', name: 'Breslow > 2 mm', color: '#ef4444', level: 'Case', status: 'Active', severity: 4 },
      ]},
      { id: 'S26-4420-SP-2', label: 'B', description: 'Sentinel lymph node — right axilla', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Nancy Graves',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Pigmented lesion right forearm 2.1 cm, irregular border. Punch biopsy: invasive melanoma, superficial spreading type, Breslow 2.3 mm. Proceeding to wide local excision with 2 cm margin and sentinel node biopsy.',
      receivedDate: isoDaysAgo(1),
      assignedTo: 'PATH-001',
    },
    diagnostic: {
      grossDescription: 'A) Received in formalin, labelled "right forearm wide local excision", is an ellipse of skin measuring 6.2 × 4.1 cm with subcutaneous tissue to a depth of 1.8 cm. A scar/biopsy site is identified centrally measuring 1.2 × 0.8 cm with surrounding erythema. Margins are inked (peripheral: blue, deep: black). Sections taken perpendicular to the long axis. B) Received in formalin, labelled "right axillary sentinel lymph node", are two lymph nodes, the larger measuring 1.8 cm and the smaller 0.9 cm.',
      microscopicDescription: 'A) Sections of the excision show residual invasive melanoma, superficial spreading type, at the biopsy site. Breslow thickness 2.4 mm. Clark level IV. No ulceration. Mitotic rate 3/mm². No microsatellites or macroscopic satellite lesions identified. Lymphovascular invasion not identified. Neurotropism not identified. Tumour-infiltrating lymphocytes: non-brisk. Regression not identified. All peripheral and deep margins are negative; closest deep margin is 8 mm, closest peripheral margin is 11 mm. B) One of two sentinel lymph nodes contains a subcapsular deposit of metastatic melanoma, largest dimension 1.2 mm (micrometastasis). No extranodal extension. Second lymph node negative.',
      ancillaryStudies: 'Immunohistochemistry: SOX10 positive, S100 positive, HMB45 focal positive, Melan-A positive. MelanA/SOX10 highlight a subcapsular deposit in sentinel node A. BRAF V600E IHC: Positive.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4420-SYN-1',
        specimenId: 'S26-4420-SP-1',
        templateId: 'skin_melanoma_bx',
        templateName: 'CAP — Melanoma of the Skin',
        status: 'in-progress',
        answers: {
          procedure:                    ['biopsy_incisional'],
          specimen_laterality:          'right',
          histologic_type:              'superficial_spreading_melanoma',
          ulceration:                   'ulceration_not_identified',
          anatomic_clark_level:         'clark_iv',
          microsatellites:              'microsatellites_not_identified',
          lymphatic_vascular_invasion:  'lvi_not_identified',
          neurotropism:                 'neurotropism_not_identified',
          tumor_infiltrating_lymphocytes: 'til_non_brisk',
          margin_status_melanoma:       ['all_margins_negative'],
          macroscopic_satellite_lesions: 'macroscopic_not_identified',
        },
        aiSuggestions: {
          procedure:                   { value: ['biopsy_incisional'],              confidence: 93, source: 'Gross: "wide local excision … biopsy site"',                               verification: 'verified' },
          specimen_laterality:         { value: 'right',                            confidence: 99, source: 'Gross: "right forearm"',                                                    verification: 'verified' },
          histologic_type:             { value: 'superficial_spreading_melanoma',   confidence: 97, source: 'Micro: "superficial spreading type"',                                       verification: 'verified' },
          ulceration:                  { value: 'ulceration_not_identified',        confidence: 95, source: 'Micro: "No ulceration"',                                                    verification: 'verified' },
          anatomic_clark_level:        { value: 'clark_iv',                         confidence: 94, source: 'Micro: "Clark level IV"',                                                   verification: 'verified' },
          microsatellites:             { value: 'microsatellites_not_identified',   confidence: 93, source: 'Micro: "No microsatellites … identified"',                                  verification: 'verified' },
          lymphatic_vascular_invasion: { value: 'lvi_not_identified',              confidence: 96, source: 'Micro: "Lymphovascular invasion not identified"',                            verification: 'verified' },
          neurotropism:                { value: 'neurotropism_not_identified',      confidence: 95, source: 'Micro: "Neurotropism not identified"',                                      verification: 'verified' },
          tumor_infiltrating_lymphocytes: { value: 'til_non_brisk',                confidence: 88, source: 'Micro: "Tumour-infiltrating lymphocytes: non-brisk"',                       verification: 'verified' },
          margin_status_melanoma:      { value: ['all_margins_negative'],           confidence: 97, source: 'Micro: "All peripheral and deep margins are negative"',                     verification: 'verified' },
          macroscopic_satellite_lesions: { value: 'macroscopic_not_identified',    confidence: 91, source: 'Micro: "No macroscopic satellite lesions"',                                 verification: 'verified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
      },
      {
        instanceId: 'S26-4420-SYN-2',
        specimenId: 'S26-4420-SP-2',
        templateId: 'skin_melanoma_bx',
        templateName: 'CAP — Melanoma (Sentinel Node)',
        status: 'in-progress',
        answers: {
          procedure:                    ['biopsy_incisional'],
          margin_status_melanoma:       ['all_margins_negative'],
        },
        aiSuggestions: {
          procedure:               { value: ['biopsy_incisional'],     confidence: 88, source: 'Gross: "sentinel lymph node"',                                      verification: 'verified' },
          margin_status_melanoma:  { value: ['all_margins_negative'],  confidence: 90, source: 'Micro: sentinel node assessed — no margin involvement',             verification: 'verified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'in-progress' as CaseStatus,
    caseTeam: [{ userId: 'PATH-001', role: 'Attending', name: 'Dr. Sarah Johnson' }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'braf_positive',  name: 'BRAF V600E Positive — Targeted Therapy Eligible', color: '#0891b2',  level: 'Case', status: 'Active', severity: 3 },
      { tagClass: 'ADMINISTRATIVE', id: 'sentinel_pos',   name: 'Sentinel Node Positive — Completion Dissection?',  color: '#ef4444',   level: 'Case', status: 'Active', severity: 4 },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C43.61'], snomed: ['372244006'] },
  },

  // HFHS-001 — Amber: Invasive breast carcinoma, AI-assisted
  {
    id: 'MPA26-1001-BR',
    accession: { accessionNumber: '1001', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'MPA26-1001-BR' },
    originHospitalId: 'HOSP-MPA',  originEnterpriseId: 'ENT-MPA',
    patient: { id: 'PAT-US-001', mrn: '300001', firstName: 'Patricia', lastName: 'Novak', dateOfBirth: isoYearsAgo(58, 3, 14), sex: 'F', phone: '313-555-1001', email: 'p.novak@email.com', address: '4840 Woodward Ave, Detroit, MI 48201' },
    specimens: [
      { id: 'MPA26-1001-SP-1', label: 'A', description: 'Left breast lumpectomy — wire-guided excision', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'MPA26-1001-SP-2', label: 'B', description: 'Left axillary sentinel lymph node biopsy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Lisa Kaminski', clientId: 'c-mpa-01', clientName: 'Northwestern Memorial Hospital', clinicalIndication: 'Left breast mass 1.8 cm on mammogram. BI-RADS 5. Wire-guided excision. Sentinel node mapping performed.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'A) Lumpectomy specimen 4.2 x 3.8 x 2.1 cm. Irregular firm tan-white mass 1.9 cm at 12 o\'clock position, 0.3 cm from anterior margin. B) Three fragments of fibrofatty tissue, largest 1.2 cm. AF/mg',
      microscopicDescription: 'A) Sections show invasive ductal carcinoma, grade 2. Tubules: 3, nuclei: 2, mitoses: 1. Lymphovascular invasion identified. Margins: anterior 0.2 cm, posterior 1.1 cm, superior 0.8 cm, inferior 1.4 cm. B) One of three sentinel nodes positive for metastatic carcinoma, largest deposit 4 mm.',
      ancillaryStudies: 'ER 95% strong, PR 80% moderate, HER2 2+ (equivocal — FISH pending), Ki-67 18%.',
    },
    synopticReports: [{
      instanceId: 'MPA26-1001-SYN-1', specimenId: 'MPA26-1001-SP-1',
      templateId: 'breast_invasive', templateName: 'CAP — Breast Invasive Carcinoma',
      answers: {},
      aiSuggestions: {
        procedure:                          { value: 'excision_less_than_total_mastectomy', confidence: 96, source: 'Gross: "Lumpectomy specimen"',                 verification: 'unverified' },
        specimen_laterality:                { value: 'left',                           confidence: 99, source: 'Gross: "Left breast lumpectomy"',                       verification: 'unverified' },
        histologic_type:                    { value: 'invasive_nst',                   confidence: 97, source: 'Micro: "invasive ductal carcinoma"',                    verification: 'unverified' },
        histologic_grade:                   { value: '2 (score 6)',                    confidence: 92, source: 'Micro: "grade 2. Tubules: 3, nuclei: 2, mitoses: 1"',   verification: 'unverified' },
        tumor_size:                         { value: '1.9 cm',                         confidence: 95, source: 'Gross: "1.9 cm at 12 o\'clock position"',              verification: 'unverified' },
        tumor_focality:                     { value: 'single_focus',                   confidence: 88, source: 'Gross: single mass identified',                         verification: 'unverified' },
        lvi:                                { value: 'lvi_present',                    confidence: 90, source: 'Micro: "Lymphovascular invasion identified"',            verification: 'unverified' },
        margin_status_invasive:             { value: 'invasive_present_at_margin',     confidence: 88, source: 'Micro: "anterior 0.2 cm"',                              verification: 'unverified' },
        distance_invasive_to_named_margins: { value: '0.2 cm (anterior margin)',       confidence: 86, source: 'Micro: "anterior 0.2 cm"',                              verification: 'unverified' },
        regional_ln_status:                 { value: 'tumor_present_nodes',            confidence: 93, source: 'Micro: "One of three sentinel nodes positive"',         verification: 'unverified' },
        number_ln_macrometastases:          { value: '1',                              confidence: 91, source: 'Micro: "largest deposit 4 mm"',                         verification: 'unverified' },
        largest_nodal_met_mm:               { value: '4',                              confidence: 89, source: 'Micro: "largest deposit 4 mm"',                         verification: 'unverified' },
        total_ln_examined:                  { value: '3',                              confidence: 95, source: 'Micro: "One of three sentinel nodes"',                  verification: 'unverified' },
        sentinel_ln_examined:               { value: '3',                              confidence: 95, source: 'Specimen B: "Left axillary sentinel lymph node biopsy"', verification: 'unverified' },
      },
      status: 'draft', createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    }],
    status: 'in-progress' as CaseStatus,
    caseTeam: [{ userId: 'PATH-US-001', role: 'Attending', name: 'Amber Fehrs-Battey' }],
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // HFHS-002 — Amber: Colorectal adenocarcinoma, post-neoadjuvant
  {
    id: 'MPA26-1002-CR',
    accession: { accessionNumber: '1002', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'MPA26-1002-CR' },
    originHospitalId: 'HOSP-MPA',  originEnterpriseId: 'ENT-MPA',
    patient: { id: 'PAT-US-002', mrn: '300002', firstName: 'Robert', lastName: 'Dziedzic', dateOfBirth: isoYearsAgo(67, 11, 2), sex: 'M', phone: '313-555-1002', email: 'r.dziedzic@email.com', address: '15 Grand Blvd, Detroit, MI 48202' },
    specimens: [
      { id: 'MPA26-1002-SP-1', label: 'A', description: 'Low anterior resection — sigmoid/rectosigmoid', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. James Orringer', clientId: 'c-mpa-02', clientName: 'Rush University Medical Center', clinicalIndication: 'Rectal adenocarcinoma cT3N1. Post-neoadjuvant chemoradiation (5-FU/capecitabine). Low anterior resection. Assess treatment response.', receivedDate: isoDaysAgo(2), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Sigmoid/rectosigmoid resection 28 cm. Area of tumour regression 3.2 x 2.8 cm, firm, pale, 11 cm from distal margin. Mesorectum intact. 18 lymph nodes identified. AF/sd',
      microscopicDescription: 'Residual moderately differentiated adenocarcinoma with extensive treatment effect. Tumour regression grade 2 (Ryan scheme) — moderate response with residual cancer. pT3 pN0 (0/18). CRM clear by 3.1 mm. Proximal and distal margins uninvolved.',
      ancillaryStudies: 'MMR IHC: MLH1+, MSH2+, MSH6+, PMS2+ — mismatch repair proficient (pMMR). KRAS exon 2: wild type. NRAS: wild type. BRAF V600E: not detected.',
    },
    synopticReports: [{
      instanceId: 'MPA26-1002-SYN-1', specimenId: 'MPA26-1002-SP-1',
      templateId: 'colon_resection', templateName: 'CAP — Colon & Rectum Resection',
      answers: {},
      aiSuggestions: {
        procedure:              { value: 'low_anterior_resection',  confidence: 95, source: 'Gross: "Sigmoid/rectosigmoid resection"',                         verification: 'unverified' },
        tumor_site:             { value: ['rectosigmoid_colon'],    confidence: 94, source: 'Gross: "Sigmoid/rectosigmoid resection"',                         verification: 'unverified' },
        histologic_type:        { value: 'adenocarcinoma',          confidence: 95, source: 'Micro: "moderately differentiated adenocarcinoma"',               verification: 'unverified' },
        histologic_grade:       { value: 'g2',                      confidence: 91, source: 'Micro: "moderately differentiated"',                              verification: 'unverified' },
        treatment_effect:       { value: 'te_partial',              confidence: 93, source: 'Micro: "Tumour regression grade 2 (Ryan scheme)"',               verification: 'unverified' },
        pT_category:            { value: 'pT3',                     confidence: 97, source: 'Micro: "pT3"',                                                   verification: 'unverified' },
        pN_category:            { value: 'pN0',                     confidence: 99, source: 'Micro: "pN0 (0/18)"',                                            verification: 'unverified' },
        ln_examined:            { value: '18',                      confidence: 99, source: 'Micro: "0/18 lymph nodes"',                                      verification: 'unverified' },
        distance_radial_margin: { value: '3.1 mm',                  confidence: 96, source: 'Micro: "CRM clear by 3.1 mm"',                                   verification: 'unverified' },
      },
      status: 'draft', createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    }],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    caseFlags: [], specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // HFHS-003 — Amber: Prostate adenocarcinoma, radical prostatectomy
  {
    id: 'MPA26-1003-PRO',
    accession: { accessionNumber: '1003', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'MPA26-1003-PRO' },
    originHospitalId: 'HOSP-MPA',  originEnterpriseId: 'ENT-MPA',
    patient: { id: 'PAT-US-003', mrn: '300003', firstName: 'Charles', lastName: 'Okafor', dateOfBirth: isoYearsAgo(63, 7, 22), sex: 'M', phone: '313-555-1003', email: 'c.okafor@email.com', address: '2799 W Grand Blvd, Detroit, MI 48202' },
    specimens: [
      { id: 'MPA26-1003-SP-1', label: 'A', description: 'Radical prostatectomy — robotic-assisted', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'MPA26-1003-SP-2', label: 'B', description: 'Right pelvic lymph node dissection', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'MPA26-1003-SP-3', label: 'C', description: 'Left pelvic lymph node dissection', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Mani Menon', clientId: 'c-mpa-03', clientName: 'Advocate Illinois Masonic Medical Center', clinicalIndication: 'PSA 8.4. Biopsy Gleason 3+4=7 (Grade Group 2), 6/12 cores positive right lobe. Robotic-assisted radical prostatectomy with bilateral pelvic lymph node dissection.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-US-001', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Prostate gland 38g, 4.2 x 3.9 x 3.5 cm. Posterior right-sided induration. Seminal vesicles intact. Vas deferens bilaterally submitted. AF/mg',
      microscopicDescription: 'Prostatic adenocarcinoma, Gleason 3+4=7 (Grade Group 2). Dominant nodule 1.8 cm right posterior lobe. Extraprostatic extension present right posterolateral (focal). Seminal vesicles uninvolved. Surgical margin positive right posterior, 1 mm length. B+C) 0/14 lymph nodes with metastasis.',
      ancillaryStudies: '',
    },
    synopticReports: [{
      instanceId: 'MPA26-1003-SYN-1', specimenId: 'MPA26-1003-SP-1',
      templateId: 'prostate_resection', templateName: 'CAP — Prostate Gland Radical Prostatectomy',
      answers: {},
      aiSuggestions: {
        histologic_type:          { value: ['acinar_usual'],                 confidence: 97, source: 'Micro: "Acinar adenocarcinoma, conventional"',                   verification: 'unverified' },
        grade_group:              { value: 'gg2_3_4_7',                      confidence: 98, source: 'Micro: "Gleason Score 3+4=7, Grade Group 2"',                      verification: 'unverified' },
        idc_present:              { value: 'idc_not_identified',             confidence: 88, source: 'Micro: no intraductal carcinoma mentioned',                          verification: 'unverified' },
        treatment_effect:         { value: ['tx_no_presurgical'],            confidence: 92, source: 'Clinical: no neoadjuvant therapy documented',                        verification: 'unverified' },
        extraprostatic_extension: { value: 'epe_present_focal',             confidence: 91, source: 'Micro: "Extraprostatic extension present right posterolateral (focal)"', verification: 'unverified' },
        bladder_neck_invasion:    { value: 'bn_not_identified',             confidence: 95, source: 'Micro: bladder neck not mentioned as involved',                       verification: 'unverified' },
        seminal_vesicle_invasion: { value: 'sv_not_identified',             confidence: 99, source: 'Micro: "Seminal vesicles uninvolved"',                              verification: 'unverified' },
        lymphovascular_invasion:  { value: 'lvi_not_identified',            confidence: 90, source: 'Micro: no lymphovascular invasion identified',                        verification: 'unverified' },
        margin_status:            { value: 'margin_involved',               confidence: 94, source: 'Micro: "Surgical margin positive right posterior"',                  verification: 'unverified' },
        margins_involved:         { value: ['margin_right_posterior'],      confidence: 92, source: 'Micro: "right posterior margin"',                                    verification: 'unverified' },
        regional_ln_status:       { value: 'ln_all_negative',               confidence: 99, source: 'Micro: "0/14 lymph nodes"',                                         verification: 'unverified' },
        ln_number_examined:       { value: 14,                              confidence: 99, source: 'Micro: "0/14 lymph nodes"',                                         verification: 'unverified' },
        pT_category:              { value: 'pT3a',                          confidence: 90, source: 'Focal EPE → pT3a (AJCC 8th Ed.)',                                    verification: 'unverified' },
        pN_category:              { value: 'pN0',                           confidence: 99, source: 'Micro: "0/14 lymph nodes"',                                         verification: 'unverified' },
      },
      status: 'draft', createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    }],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // HFHS-004 — Tuthill: Lung adenocarcinoma — Pathology Informatics focus, AI routing demo
  {
    id: 'HFHS26-1004-LU',
    accession: { accessionNumber: '1004', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'HFHS26-1004-LU' },
    originHospitalId: 'HOSP-HFHS', originEnterpriseId: 'ENT-HFHS',
    patient: { id: 'PAT-US-004', mrn: '300004', firstName: 'Sandra', lastName: 'Kowalski', dateOfBirth: isoYearsAgo(71, 5, 8), sex: 'F', phone: '313-555-1004', email: 's.kowalski@email.com', address: '1 Ford Place, Dearborn, MI 48126' },
    specimens: [
      { id: 'HFHS26-1004-SP-1', label: 'A', description: 'Right upper lobe lobectomy — VATS', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'HFHS26-1004-SP-2', label: 'B', description: 'Level 4R lymph node — mediastinoscopy', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Harvey Pass', clientId: 'c-hfhs-01', clientName: 'Henry Ford Macomb Hospital', clinicalIndication: 'RUL nodule 2.4 cm, SUV 6.2 on PET. No mediastinal uptake. VATS lobectomy with mediastinal staging. Former smoker 40 pack-years.', receivedDate: isoDaysAgo(1), assignedTo: 'PATH-US-002', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Right upper lobe 12 x 9 x 4 cm. Subpleural nodule 2.4 x 2.1 x 1.9 cm, grey-white, firm, irregular. Pleural puckering overlying. MT/sd',
      microscopicDescription: 'Adenocarcinoma, predominantly acinar pattern with lepidic component (acinar 70%, lepidic 30%). Visceral pleural invasion present. Lymphovascular invasion absent. Surgical margins uninvolved. B) 0/3 lymph nodes.',
      ancillaryStudies: 'EGFR: exon 19 deletion detected. ALK: negative. ROS1: negative. PD-L1 TPS: 35% (22C3).',
    },
    synopticReports: [{
      instanceId: 'HFHS26-1004-SYN-1', specimenId: 'HFHS26-1004-SP-1',
      templateId: 'lung_resection', templateName: 'CAP — Lung Resection',
      answers: {},
      aiSuggestions: {
        procedure:                { value: ['lobectomy'],                  confidence: 97, source: 'Gross: "Right upper lobe lobectomy"',                          verification: 'unverified' },
        specimen_laterality:      { value: 'right',                        confidence: 99, source: 'Gross: "Right upper lobe"',                                   verification: 'unverified' },
        tumor_site:               { value: ['upper_lobe'],                 confidence: 99, source: 'Gross: "Right upper lobe"',                                   verification: 'unverified' },
        histologic_type:          { value: 'inv_acinar',                   confidence: 96, source: 'Micro: "Adenocarcinoma"',                                     verification: 'unverified' },
        tumor_size_invasive_cm:   { value: '2.4 cm',                       confidence: 98, source: 'Gross: "2.4 x 2.1 x 1.9 cm"',                               verification: 'unverified' },
        visceral_pleura_invasion: { value: 'vpi_present',                  confidence: 92, source: 'Micro: "Visceral pleural invasion present"',                  verification: 'unverified' },
        stas:                     { value: 'stas_not_identified',          confidence: 85, source: 'Micro: no spread through air spaces identified',              verification: 'unverified' },
        regional_ln_status:       { value: 'ln_all_negative',              confidence: 99, source: 'Micro: "0/3 lymph nodes"',                                   verification: 'unverified' },
        ln_number_examined:       { value: 3,                              confidence: 99, source: 'Micro: "0/3 lymph nodes"',                                   verification: 'unverified' },
        pT_category:              { value: 'pT2a',                        confidence: 89, source: 'Visceral pleural invasion + 2.4 cm → pT2a',                  verification: 'unverified' },
        pN_category:              { value: 'pN0',                         confidence: 99, source: 'Micro: "0/3 lymph nodes"',                                   verification: 'unverified' },
      },
      status: 'draft', createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    }],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [{ tagClass: 'ADMINISTRATIVE', id: 'egfr_actionable', name: 'Actionable Mutation — Oncology Alert', color: '#0891b2', level: 'Case', status: 'Active', severity: 4 }],
    specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // HFHS-005 — Tuthill: STAT frozen section — routing/workflow demo
  {
    id: 'HFHS26-1005-FS',
    accession: { accessionNumber: '1005', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'HFHS26-1005-FS' },
    originHospitalId: 'HOSP-HFHS', originEnterpriseId: 'ENT-HFHS',
    patient: { id: 'PAT-US-005', mrn: '300005', firstName: 'George', lastName: 'Washington', dateOfBirth: isoYearsAgo(55, 1, 18), sex: 'M', phone: '313-555-1005', email: 'g.washington@email.com', address: '6071 W Outer Dr, Detroit, MI 48235' },
    specimens: [
      { tagClass: 'ADMINISTRATIVE', id: 'HFHS26-1005-SP-1', label: 'A', description: 'Pancreatic head mass — INTRAOPERATIVE FROZEN SECTION', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [{ tagClass: 'ADMINISTRATIVE', id: 'frozen', name: 'Frozen Section', color: '#f59e0b', level: 'Case', status: 'Active', severity: 5 }] },
    ],
    order: { priority: 'STAT', requestingProvider: 'Dr. Mazen Iskandar', clientId: 'c-hfhs-03', clientName: 'Detroit Medical Center', clinicalIndication: 'Pancreatic head mass 3.1 cm. CA19-9 elevated 480. Whipple procedure. Intraoperative: assess pancreatic neck margin and common bile duct margin.', receivedDate: isoDaysAgo(0), assignedTo: 'PATH-US-002', assignedParticipationTypeId: 'primary' },
    diagnostic: {
      grossDescription: 'Pancreatic neck margin: grey-white fibrous tissue 1.2 cm. Common bile duct margin: tan tubular tissue 0.8 cm. MT/fs — called to OR at 10:42',
      microscopicDescription: 'FROZEN SECTION DIAGNOSIS: Pancreatic neck margin — NO CARCINOMA. Common bile duct margin — NO CARCINOMA. Permanent sections pending.',
      ancillaryStudies: '',
    },
    synopticReports: [],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'stat_frozen', name: 'STAT — Intraoperative Frozen Section', color: '#ef4444', level: 'Case', status: 'Active', severity: 5 },
      { tagClass: 'ADMINISTRATIVE', id: 'or_pending', name: 'OR Awaiting Result', color: '#f59e0b', level: 'Case', status: 'Active', severity: 4 },
    ],
    specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // HFHS-006 — Pool case (unassigned, routes to Surgical Pathology pool)
  {
    id: 'MPA26-1006-POOL',
    accession: { accessionNumber: '1006', accessionPrefix: 'HFHS', accessionYear: 2026, fullAccession: 'MPA26-1006-POOL' },
    originHospitalId: 'HOSP-MPA',  originEnterpriseId: 'ENT-MPA',
    patient: { id: 'PAT-US-006', mrn: '300006', firstName: 'Maria', lastName: 'Kowalczyk', dateOfBirth: isoYearsAgo(44, 9, 3), sex: 'F', phone: '313-555-1006', email: 'm.kowalczyk@email.com', address: '3990 John R St, Detroit, MI 48201' },
    specimens: [
      { id: 'MPA26-1006-SP-1', label: 'A', description: 'Cervical LEEP excision', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: { priority: 'Routine', requestingProvider: 'Dr. Carolyn Johnston', clientId: 'c-hfhs-07', clientName: 'Michigan Urology Centre', clinicalIndication: 'High-grade squamous intraepithelial lesion on colposcopy. LEEP excision. Assess margins and grade.', receivedDate: isoDaysAgo(0), assignedTo: null },
    diagnostic: { grossDescription: '', microscopicDescription: '', ancillaryStudies: '' },
    synopticReports: [],
    status: 'pool' as CaseStatus,
    poolId: 'GYN-MPA', poolName: 'Gynaecologic Pathology',
    createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
    caseFlags: [], specimenFlags: [], reportingMode: 'copilot', coding: {},
  } as any,

  // MPA26-1007-PED — Amber: Pediatric Wilms tumor (nephroblastoma)
  // Patient age 8 — below Metro General's pediatricAgeThreshold of 18
  // Used to test pediatric access control: Amber should see access-denied
  {
    id: 'MPA26-1007-PED',
    accession: { accessionNumber: '1007', accessionPrefix: 'MPA', accessionYear: 2026, fullAccession: 'MPA26-1007-PED' },
    originHospitalId: 'HOSP-MPA', originEnterpriseId: 'ENT-MPA',
    patient: {
      id: 'PAT-US-007', mrn: '300007',
      firstName: 'Liam', lastName: 'Osei',
      dateOfBirth: isoYearsAgo(8, 4, 12), sex: 'M',
      phone: '313-555-1007', email: 'osei.family@email.com',
      address: '1201 St Antoine St, Detroit, MI 48226',
    },
    specimens: [
      { id: 'MPA26-1007-SP-1', label: 'A', description: 'Right nephrectomy — radical', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Priya Nair',
      clientId: 'c1',
      clientName: 'Metro General Hospital',
      clinicalIndication: 'Right renal mass 7.2 cm on CT, detected incidentally. No metastatic disease on staging. Proceeding to right radical nephrectomy. Clinical diagnosis: Wilms tumour (nephroblastoma). Age 8.',
      receivedDate: isoDaysAgo(1),
      assignedTo: 'PATH-US-001',
    },
    diagnostic: {
      grossDescription: 'Right kidney with attached perirenal fat, 14 x 9 x 7 cm total, 220 g. Encapsulated tan-grey lobulated mass 7.2 x 6.8 x 6.1 cm arising from upper pole. Pseudocapsule intact. Cut surface: pale tan, fish-flesh, with areas of haemorrhage and necrosis. Remaining renal parenchyma compressed. Hilar vessels and ureter sampled. MT/amber',
      microscopicDescription: 'Triphasic nephroblastoma composed of blastemal, stromal, and epithelial elements. No anaplasia identified. Tumour confined within pseudocapsule. Surgical margins uninvolved. Hilar lymph node: 0/2 nodes involved.',
      ancillaryStudies: '',
    },
    synopticReports: [{
      instanceId:   'MPA26-1007-SYN-1',
      specimenId:   'MPA26-1007-SP-1',
      templateId:   'wilms_resection',
      templateName: 'CAP Kidney — Wilms & Pediatric Renal Tumors Resection',
      status:       'draft' as const,
      createdAt:    isoDaysAgo(1),
      updatedAt:    isoDaysAgo(0),
      answers: {
        expert_consultation:      'not_applicable',
        procedure:                'radical_nephrectomy',
        specimen_laterality:      ['right'],
        nephrectomy_weight_g:     '220',
        histologic_type:          'wilms_favorable',
        tumor_size_cm:            '7.2',
        tumor_focality:           'unifocal',
        nephrogenic_rests:        'not_identified',
        tumor_disruption:         'not_identified',
        renal_sinus_involvement:  'not_identified',
        extrarenal_vascular:      'not_identified',
        capsule_extension:        'not_identified',
        adjacent_organ_extension: 'not_identified',
        margin_status:            'all_negative',
        ln_status:                'all_negative',
        ln_number_examined:       '2',
        ln_number_positive:       '0',
        distant_metastasis:       ['not_applicable'],
        staging_system:           'cog',
        cog_stage:                'stage_i',
      },
      aiSuggestions: {
        histologic_type:    { value: 'wilms_favorable',   confidence: 97, source: 'Microscopic: "Triphasic nephroblastoma… No anaplasia identified"', verification: 'unverified' },
        tumor_size_cm:      { value: '7.2',               confidence: 99, source: 'Gross: "encapsulated tan-grey lobulated mass 7.2 x 6.8 x 6.1 cm"', verification: 'unverified' },
        tumor_focality:     { value: 'unifocal',          confidence: 95, source: 'Gross: "mass arising from upper pole"', verification: 'unverified' },
        margin_status:      { value: 'all_negative',      confidence: 98, source: 'Microscopic: "Surgical margins uninvolved"', verification: 'unverified' },
        ln_status:          { value: 'all_negative',      confidence: 99, source: 'Microscopic: "Hilar lymph node: 0/2 nodes involved"', verification: 'unverified' },
        ln_number_examined: { value: '2',                 confidence: 99, source: 'Microscopic: "0/2 nodes involved"', verification: 'unverified' },
        ln_number_positive: { value: '0',                 confidence: 99, source: 'Microscopic: "0/2 nodes involved"', verification: 'unverified' },
        cog_stage:          { value: 'stage_i',           confidence: 94, source: 'Tumor confined to kidney, margins negative, nodes negative', verification: 'unverified' },
      },
    }],
    caseFlags: [
      { tagClass: 'ADMINISTRATIVE', id: 'flag-ped-001', name: 'Pediatric Patient', color: '#f59e0b', severity: 3, level: 'Case', lisCode: 'PEDS', autoCreated: true },
    ],
    specimenFlags: [],
    status: 'draft' as CaseStatus,
    pediatricRestricted: true,
    reportingMode: 'copilot',
    coding: {},
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
  } as any,
  // ─────────────────────────────────────────────────────────────────────────
  // ROSSANA BABAKHANI (PATH-RB-001) — UX Review Cases
  // Two LIS (internal hospital) + Two Outreach (external clients)
  // ─────────────────────────────────────────────────────────────────────────

  // ── RB-01: THYROID — LIS / in-progress ──────────────────────────────────
  {
    id: 'S26-4480-THYROID',
    accession: { accessionNumber: '4480', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4480-THYROID' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-RB-01', mrn: '200101',
      firstName: 'Isabelle', lastName: 'Nakamura',
      dateOfBirth: isoYearsAgo(44, 7, 19), sex: 'F',
      phone: '555-301-4480', email: 'isabelle.nakamura@example.org',
      address: '12 Saguaro Heights, Phoenix, AZ 85004',
    },
    specimens: [
      { id: 'S26-4480-SP-1', label: 'A', description: 'Right thyroid lobe and isthmus', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
      { id: 'S26-4480-SP-2', label: 'B', description: 'Right central neck lymph nodes (level VI)', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Karen Shapiro',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Thyroid nodule right lobe, 2.8 cm. FNA: Bethesda V — suspicious for papillary thyroid carcinoma. TSH: 1.4. Ultrasound: hypoechoic nodule with microcalcifications and increased vascularity. Proceeding to right hemithyroidectomy + central neck dissection.',
      receivedDate: isoDaysAgo(2), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Received fresh labeled "right thyroid lobe and isthmus" is a hemithyroidectomy specimen weighing 18.4g, measuring 5.2 × 3.1 × 1.8 cm. The external surface is smooth and intact. On serial sectioning a firm, grey-white nodule measuring 2.6 × 2.0 × 1.8 cm is identified in the mid to lower pole. The nodule has irregular borders and demonstrates focal calcification on cut section. The remaining thyroid parenchyma is brown-tan and homogeneous. Specimen B: four lymph nodes, largest 0.9 cm.',
      microscopicDescription: 'Sections show papillary thyroid carcinoma, classical variant. The tumour measures 2.6 cm and demonstrates characteristic ground-glass nuclear features, nuclear grooves, and pseudoinclusions. Psammoma bodies are present. Tumour extends focally to the surgical margin. Lymphovascular invasion is identified. Specimen B: 2 of 4 lymph nodes contain metastatic papillary thyroid carcinoma; largest deposit 4 mm, no extracapsular extension.',
      ancillaryStudies: 'BRAF V600E mutation: Detected by PCR. TERT promoter: Wild type. Thyroglobulin IHC: Positive. CK19 / Galectin-3: Positive.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4480-SP-1_thyroid_ptc_001',
        specimenId: 'S26-4480-SP-1',
        templateId: 'thyroid_malignant',
        templateName: 'CAP Thyroid Gland — Malignant',
        status: 'draft',
        answers: {
          procedure: 'hemithyroidectomy',
          specimen_laterality: 'right',
          histologic_type: 'papillary_thyroid_carcinoma_classical',
          tumor_size: '2.6 cm',
          tumor_focality: 'unifocal',
          gross_extension: 'confined_to_thyroid',
          margin_status: 'positive',
          lvi: 'lvi_present',
          regional_ln_status: 'tumor_present_nodes',
          ln_with_tumor: '2',
          ln_examined: '4',
          braf_v600e: 'detected',
          pT_category: 'pT2',
          pN_category: 'pN1a',
        },
        aiSuggestions: {
          procedure:             { value: 'hemithyroidectomy',                    confidence: 97, source: 'Gross: "right thyroid lobe and isthmus"', verification: 'unverified' },
          specimen_laterality:   { value: 'right',                                confidence: 99, source: 'Gross: "right thyroid lobe"', verification: 'unverified' },
          histologic_type:       { value: 'papillary_thyroid_carcinoma_classical', confidence: 94, source: 'Micro: "papillary thyroid carcinoma, classical variant"', verification: 'unverified' },
          tumor_size:            { value: '2.6 cm',                               confidence: 96, source: 'Gross and micro: "2.6 × 2.0 × 1.8 cm"', verification: 'unverified' },
          tumor_focality:        { value: 'unifocal',                             confidence: 90, source: 'No mention of additional foci', verification: 'unverified' },
          margin_status:         { value: 'positive',                             confidence: 88, source: 'Micro: "tumour extends focally to the surgical margin"', verification: 'unverified' },
          lvi:                   { value: 'lvi_present',                          confidence: 91, source: 'Micro: "Lymphovascular invasion is identified"', verification: 'unverified' },
          regional_ln_status:    { value: 'tumor_present_nodes',                  confidence: 95, source: 'Specimen B: "2 of 4 lymph nodes contain metastatic PTC"', verification: 'unverified' },
          ln_with_tumor:         { value: '2',                                    confidence: 93, source: 'Specimen B: "2 of 4 lymph nodes"', verification: 'unverified' },
          ln_examined:           { value: '4',                                    confidence: 95, source: 'Gross: "four lymph nodes"', verification: 'unverified' },
          braf_v600e:            { value: 'detected',                             confidence: 98, source: 'Ancillary: "BRAF V600E mutation: Detected"', verification: 'unverified' },
          pT_category:           { value: 'pT2',                                  confidence: 87, source: 'Tumour 2.6 cm, confined to thyroid → pT2', verification: 'unverified' },
          pN_category:           { value: 'pN1a',                                 confidence: 89, source: 'Level VI nodes positive → pN1a', verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { id: 'thyroid-board', tagClass: 'ADMINISTRATIVE', name: 'Thyroid MDT',        lisCode: 'THYR',  color: '#3b82f6', severity: 3, level: 'Case', status: 'Active' },
      { id: 'braf-positive', tagClass: 'ADMINISTRATIVE', name: 'BRAF V600E Positive',lisCode: 'BRAF',  color: '#f59e0b', severity: 2, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [
      { id: 'braf-comp', tagClass: 'COMPUTATIONAL', name: 'BRAF V600E', lisCode: 'BRAFM', color: '#10b981', severity: 2, level: 'Specimen', status: 'Active', orderedVia: 'lis', specimenId: 'S26-4480-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C73'], snomed: ['363478007'] },
  },

  // ── RB-02: ENDOMETRIUM — LIS / draft ────────────────────────────────────
  {
    id: 'S26-4481-ENDO',
    accession: { accessionNumber: '4481', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4481-ENDO' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-RB-02', mrn: '200102',
      firstName: 'Constance', lastName: 'Adeyemi',
      dateOfBirth: isoYearsAgo(58, 2, 28), sex: 'F',
      phone: '555-302-4481', email: 'constance.adeyemi@example.org',
      address: '339 Ocotillo Lane, Mesa, AZ 85201',
    },
    specimens: [
      { id: 'S26-4481-SP-1', label: 'A', description: 'Endometrial curettings', receivedAt: isoDaysAgo(0), collectedAt: isoDaysAgo(0), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Patricia Owens',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Post-menopausal bleeding. Endometrial thickness 14 mm on ultrasound. Office biopsy non-diagnostic. Proceeding to D&C. CA-125 normal.',
      receivedDate: isoDaysAgo(1), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Received in formalin labeled "endometrial curettings" is a 4.3g aggregate of tan-brown tissue fragments measuring up to 1.2 cm in greatest dimension. Representative sections submitted in four cassettes.',
      microscopicDescription: 'Sections show endometrioid adenocarcinoma, FIGO grade 1. The tumour demonstrates glandular architecture with less than 5% solid growth. Nuclear atypia is mild. No myometrial tissue is identified in the curettings. No lymphovascular invasion seen in the submitted sections.',
      ancillaryStudies: 'MMR IHC: MLH1, MSH2, MSH6, PMS2 — all retained (mismatch repair proficient). ER: Positive (strong, 90%). PR: Positive (moderate, 60%). p53: Wild type pattern.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4481-SP-1_endo_001',
        specimenId: 'S26-4481-SP-1',
        templateId: 'endometrium_biopsy',
        templateName: 'CAP Endometrium — Biopsy/Curettage',
        status: 'draft',
        answers: {
          procedure: 'dilation_and_curettage',
          histologic_type: 'endometrioid_adenocarcinoma',
          figo_grade: 'grade_1',
          lvi: 'lvi_not_identified',
          mismatch_repair: 'mmr_proficient',
          er_status: 'er_positive',
          pr_status: 'pr_positive',
          p53: 'wild_type',
        },
        aiSuggestions: {
          procedure:       { value: 'dilation_and_curettage',    confidence: 91, source: 'Clinical: "Proceeding to D&C"', verification: 'unverified' },
          histologic_type: { value: 'endometrioid_adenocarcinoma', confidence: 95, source: 'Micro: "endometrioid adenocarcinoma, FIGO grade 1"', verification: 'unverified' },
          figo_grade:      { value: 'grade_1',                   confidence: 92, source: 'Micro: "less than 5% solid growth"', verification: 'unverified' },
          lvi:             { value: 'lvi_not_identified',         confidence: 84, source: 'Micro: "No lymphovascular invasion seen"', verification: 'unverified' },
          mismatch_repair: { value: 'mmr_proficient',            confidence: 98, source: 'Ancillary: "MLH1, MSH2, MSH6, PMS2 — all retained"', verification: 'unverified' },
          er_status:       { value: 'er_positive',               confidence: 97, source: 'Ancillary: "ER: Positive (strong, 90%)"', verification: 'unverified' },
          pr_status:       { value: 'pr_positive',               confidence: 95, source: 'Ancillary: "PR: Positive (moderate, 60%)"', verification: 'unverified' },
          p53:             { value: 'wild_type',                 confidence: 96, source: 'Ancillary: "p53: Wild type pattern"', verification: 'unverified' },
        },
        createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0),
      },
    ],
    status: 'draft' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0),
    caseFlags: [
      { id: 'gynaec-oncol', tagClass: 'ADMINISTRATIVE', name: 'Gynaecology Oncology', lisCode: 'GYNOC', color: '#3b82f6', severity: 2, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['C54.1'], snomed: ['413448000'] },
  },

  // ── RB-03: RENAL CELL CARCINOMA — Outreach / STAT / in-progress ──────────
  {
    id: 'S26-4482-RENAL',
    accession: { accessionNumber: '4482', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4482-RENAL' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-RB-03', mrn: '200103',
      firstName: 'Victor', lastName: 'Halloran',
      dateOfBirth: isoYearsAgo(62, 11, 3), sex: 'M',
      phone: '555-303-4482', email: 'victor.halloran@example.org',
      address: '58 Ironwood Trail, Scottsdale, AZ 85260',
    },
    specimens: [
      { id: 'S26-4482-SP-1', label: 'A', description: 'Partial nephrectomy — right renal mass', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'S26-4482-SP-2', label: 'B', description: 'Surgical margin shave', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'STAT',
      requestingProvider: 'Dr. Nathan Briggs',
      clientId: 'c_outreach_urology', clientName: 'Desert Hills Urology Associates',
      clinicalIndication: 'Incidental right renal mass 3.4 cm on CT abdomen. Enhancement pattern consistent with RCC. No lymphadenopathy. Serum creatinine stable. Robotic partial nephrectomy. Frozen section intraoperative.',
      receivedDate: isoDaysAgo(1), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Received fresh labeled "partial nephrectomy, right renal mass" is a 38.7g wedge of renal tissue measuring 5.5 × 4.0 × 2.8 cm. The cortical surface is bosselated. On sectioning a well-circumscribed, golden-yellow mass measuring 3.2 × 3.0 × 2.6 cm is identified, surrounded by a fibrous pseudocapsule. The mass is 0.2 cm from the closest surgical margin. Areas of central haemorrhage are present. No necrosis identified. Specimen B: A single shave of resection margin 0.1 cm in thickness.',
      microscopicDescription: 'Sections show clear cell renal cell carcinoma (ccRCC), ISUP/WHO grade 2. Tumour cells are arranged in alveolar and acinar patterns with abundant clear cytoplasm and small, round, uniform nuclei with inconspicuous nucleoli. A delicate sinusoidal vascular network is present. No sarcomatoid differentiation. No rhabdoid features. Lymphovascular invasion is not identified. The tumour is confined within the renal capsule. Surgical margin (Specimen B) is negative; closest approach 2 mm.',
      ancillaryStudies: 'CA IX IHC: Diffuse membranous positivity (consistent with ccRCC). CD10: Positive. CK7: Negative. TFE3: Negative. VHL sequencing: Mutation detected (c.332G>A, p.W111*). PD-L1 (22C3): CPS 2.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4482-SP-1_kidney_rcc_001',
        specimenId: 'S26-4482-SP-1',
        templateId: 'kidney_resection',
        templateName: 'CAP Kidney — Partial/Total Nephrectomy',
        status: 'draft',
        answers: {
          procedure: 'partial_nephrectomy',
          specimen_laterality: 'right',
          histologic_type: 'clear_cell_rcc',
          who_isup_grade: 'grade_2',
          tumor_size: '3.2 cm',
          tumor_focality: 'unifocal',
          renal_capsule: 'capsule_not_penetrated',
          lvi: 'lvi_not_identified',
          sarcomatoid: 'sarcomatoid_not_present',
          margin_status: 'margins_negative',
          distance_to_margin: '2 mm',
          pT_category: 'pT1b',
          pN_category: 'pNX',
        },
        aiSuggestions: {
          procedure:          { value: 'partial_nephrectomy',   confidence: 98, source: 'Gross: "partial nephrectomy, right renal mass"', verification: 'unverified' },
          specimen_laterality:{ value: 'right',                  confidence: 99, source: 'Gross: "right renal mass"', verification: 'unverified' },
          histologic_type:    { value: 'clear_cell_rcc',        confidence: 95, source: 'Micro: "clear cell renal cell carcinoma (ccRCC)"', verification: 'unverified' },
          who_isup_grade:     { value: 'grade_2',               confidence: 90, source: 'Micro: "ISUP/WHO grade 2 — inconspicuous nucleoli"', verification: 'unverified' },
          tumor_size:         { value: '3.2 cm',                confidence: 96, source: 'Gross: "3.2 × 3.0 × 2.6 cm"', verification: 'unverified' },
          tumor_focality:     { value: 'unifocal',              confidence: 93, source: 'Single mass described', verification: 'unverified' },
          renal_capsule:      { value: 'capsule_not_penetrated', confidence: 89, source: 'Micro: "confined within the renal capsule"', verification: 'unverified' },
          lvi:                { value: 'lvi_not_identified',    confidence: 88, source: 'Micro: "Lymphovascular invasion is not identified"', verification: 'unverified' },
          sarcomatoid:        { value: 'sarcomatoid_not_present', confidence: 94, source: 'Micro: "No sarcomatoid differentiation"', verification: 'unverified' },
          margin_status:      { value: 'margins_negative',      confidence: 92, source: 'Micro: "Surgical margin (Specimen B) is negative"', verification: 'unverified' },
          distance_to_margin: { value: '2 mm',                  confidence: 88, source: 'Micro: "closest approach 2 mm"', verification: 'unverified' },
          pT_category:        { value: 'pT1b',                  confidence: 86, source: 'Tumour 3.2 cm, organ confined → pT1b', verification: 'unverified' },
          pN_category:        { value: 'pNX',                   confidence: 85, source: 'No lymph nodes submitted', verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { id: 'f1',          tagClass: 'ADMINISTRATIVE', name: 'STAT — Rush Processing', lisCode: 'STAT',  color: '#ef4444', severity: 5, level: 'Case', status: 'Active' },
      { id: 'urology-mdt', tagClass: 'ADMINISTRATIVE', name: 'Urology MDT',            lisCode: 'UROL',  color: '#3b82f6', severity: 3, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [
      { id: 'vhl-mutation', tagClass: 'COMPUTATIONAL', name: 'VHL Mutation', lisCode: 'VHL', color: '#10b981', severity: 2, level: 'Specimen', status: 'Active', orderedVia: 'lis', specimenId: 'S26-4482-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C64.1'], snomed: ['41607009'] },
  },

  // ── RB-04: MELANOMA — Outreach / in-progress / multi-specimen ───────────
  {
    id: 'S26-4483-MELANOMA',
    accession: { accessionNumber: '4483', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-4483-MELANOMA' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-RB-04', mrn: '200104',
      firstName: 'Andrea', lastName: 'Morelli',
      dateOfBirth: isoYearsAgo(51, 5, 8), sex: 'F',
      phone: '555-304-4483', email: 'andrea.morelli@example.org',
      address: '214 Prickly Pear Road, Chandler, AZ 85225',
    },
    specimens: [
      { id: 'S26-4483-SP-1', label: 'A', description: 'Wide local excision — left upper back', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
      { id: 'S26-4483-SP-2', label: 'B', description: 'Sentinel lymph node — left axilla #1', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
      { id: 'S26-4483-SP-3', label: 'C', description: 'Sentinel lymph node — left axilla #2', receivedAt: isoDaysAgo(2), collectedAt: isoDaysAgo(3), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Michelle Foster',
      clientId: 'c_outreach_derm', clientName: 'Oasis Dermatology Partners',
      clinicalIndication: 'Melanoma left upper back. Excision biopsy: invasive melanoma, Breslow 1.8 mm, Clark level IV, ulceration present. Awaiting wide local excision + sentinel lymph node biopsy. Dermatoscopy: asymmetric lesion 1.4 cm. SLNB with Tc-99m lymphoscintigraphy.',
      receivedDate: isoDaysAgo(3), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Specimen A: An oriented ellipse of skin measuring 7.0 × 3.5 cm with a central stellate scar 1.6 × 0.8 cm at the biopsy site. The specimen is inked and serially sectioned perpendicular to the long axis. No residual pigmented lesion is identified macroscopically. Specimens B and C: Two intact lymph nodes measuring 1.4 cm and 1.1 cm respectively.',
      microscopicDescription: 'Specimen A: Biopsy site change. No residual melanoma identified. All margins (peripheral and deep) are negative; the deep margin at the biopsy site is 4 mm. Specimen B: Metastatic melanoma present in the subcapsular sinus and parenchyma of 1 of 1 sentinel lymph node; largest deposit 3.1 mm. No extranodal extension. Specimen C: No tumour in 1 sentinel lymph node examined.',
      ancillaryStudies: 'S100: Positive. SOX10: Positive. Melan-A: Positive. HMB-45: Positive. Ki-67: 28% in primary. BRAF V600E (original excision): Detected. PD-L1 (28-8): CPS 15.',
    },
    synopticReports: [
      {
        instanceId: 'S26-4483-SP-1_melanoma_001',
        specimenId: 'S26-4483-SP-1',
        templateId: 'melanoma_resection',
        templateName: 'CAP Melanoma — Wide Local Excision',
        status: 'in-progress',
        answers: {
          procedure: 'wide_local_excision',
          specimen_site: 'back',
          specimen_laterality: 'left',
          residual_melanoma: 'no_residual_melanoma',
          margin_status_peripheral: 'all_margins_negative',
          margin_status_deep: 'all_margins_negative',
          distance_to_deep_margin: '4 mm',
          regional_ln_status: 'tumor_present_nodes',
          sln_with_tumor: '1',
          sln_examined: '2',
          largest_sln_deposit: '3.1 mm',
          extranodal_extension: 'ene_not_identified',
          braf_v600e: 'detected',
          pdl1_cps: '15',
        },
        aiSuggestions: {
          procedure:                { value: 'wide_local_excision',      confidence: 97, source: 'Gross: "wide local excision — left upper back"', verification: 'verified' },
          specimen_site:            { value: 'back',                      confidence: 96, source: 'Specimen label and gross description', verification: 'verified' },
          specimen_laterality:      { value: 'left',                      confidence: 99, source: 'Specimen label: "left upper back"', verification: 'verified' },
          residual_melanoma:        { value: 'no_residual_melanoma',      confidence: 93, source: 'Micro: "No residual melanoma identified"', verification: 'verified' },
          margin_status_peripheral: { value: 'all_margins_negative',      confidence: 95, source: 'Micro: "All margins (peripheral and deep) are negative"', verification: 'verified' },
          margin_status_deep:       { value: 'all_margins_negative',      confidence: 94, source: 'Micro: "All margins … are negative"', verification: 'verified' },
          distance_to_deep_margin:  { value: '4 mm',                      confidence: 88, source: 'Micro: "deep margin … 4 mm"', verification: 'verified' },
          regional_ln_status:       { value: 'tumor_present_nodes',       confidence: 96, source: 'Specimen B: "1 of 1 sentinel lymph node" positive', verification: 'verified' },
          sln_with_tumor:           { value: '1',                         confidence: 95, source: 'Specimen B: "1 of 1 sentinel lymph node"', verification: 'verified' },
          sln_examined:             { value: '2',                         confidence: 94, source: 'Specimens B + C: two sentinel nodes', verification: 'verified' },
          largest_sln_deposit:      { value: '3.1 mm',                    confidence: 92, source: 'Specimen B: "largest deposit 3.1 mm"', verification: 'verified' },
          extranodal_extension:     { value: 'ene_not_identified',        confidence: 90, source: 'Specimen B: "No extranodal extension"', verification: 'verified' },
          braf_v600e:               { value: 'detected',                  confidence: 98, source: 'Ancillary: "BRAF V600E: Detected"', verification: 'verified' },
          pdl1_cps:                 { value: '15',                        confidence: 96, source: 'Ancillary: "PD-L1 (28-8): CPS 15"', verification: 'verified' },
        },
        createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { id: 'melanoma-mdt', tagClass: 'ADMINISTRATIVE', name: 'Melanoma MDT', lisCode: 'MEL',  color: '#3b82f6', severity: 3, level: 'Case', status: 'Active' },
      { id: 'braf-positive',tagClass: 'ADMINISTRATIVE', name: 'BRAF V600E Positive', lisCode: 'BRAF', color: '#10b981', severity: 2, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [
      { id: 'braf-comp',  tagClass: 'COMPUTATIONAL', name: 'BRAF V600E',  lisCode: 'BRAFM', color: '#10b981', severity: 2, level: 'Specimen', status: 'Active', orderedVia: 'lis', specimenId: 'S26-4483-SP-1' },
      { id: 'pdl1-result',tagClass: 'COMPUTATIONAL', name: 'PD-L1 CPS 15',lisCode: 'PDL1',  color: '#3b82f6', severity: 2, level: 'Specimen', status: 'Active', orderedVia: 'lis', specimenId: 'S26-4483-SP-1' },
    ],
    reportingMode: 'copilot',
    coding: { icd10: ['C43.59'], snomed: ['372244006'] },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ROSSANA BABAKHANI (PATH-RB-001) — UX/UIUX Workflow Demo Cases
  // Three cases showing the AI protocol re-evaluation + pre-finalisation flow.
  //   DEMO-RB-01: Gross submitted, AI assigned synoptic, awaiting microscopic
  //   DEMO-RB-02: Microscopic received, AI proposes protocol upgrade → use DEV button
  //   DEMO-RB-03: All sections complete, ready to open PreFinalisationModal
  // ─────────────────────────────────────────────────────────────────────────

  // ── DEMO-RB-01: Breast core biopsy — gross done, awaiting microscopic ────
  {
    id: 'DEMO-RB-01',
    accession: { accessionNumber: 'DEMO-01', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-DEMO-01' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-DEMO-RB-01', mrn: 'DEMO100001',
      firstName: 'Eleanor', lastName: 'Bishop',
      dateOfBirth: isoYearsAgo(52, 3, 14), sex: 'F',
      phone: '555-800-0001', email: 'eleanor.bishop@example.org',
      address: '88 Camelback Rd, Phoenix, AZ 85013',
    },
    specimens: [
      { id: 'DEMO-01-SP-1', label: 'A', description: 'Right breast core biopsy — 12 o\'clock, 2 cm FN', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Pamela Winters',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Screening mammogram abnormality, right breast 12 o\'clock, BIRADS 4B. Ultrasound: 8 mm irregular hypoechoic mass with microlobulated margins. Clinical concern for atypia vs. low-grade malignancy. Core biopsy performed under ultrasound guidance, 3 cores submitted.',
      receivedDate: isoDaysAgo(1), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Received in formalin labelled "right breast core biopsy A" are three tan-white cores of tissue, each measuring approximately 1.5 cm × 0.1 cm × 0.1 cm. All cores are submitted in one cassette. The tissue has a firm consistency without haemorrhage or necrosis.',
      microscopicDescription: '',
    },
    synopticReports: [
      {
        instanceId: 'DEMO-01-SYN-01',
        specimenId: 'DEMO-01-SP-1',
        templateId: 'breast_core_benign',
        templateName: 'Breast Core Biopsy (Benign/NOS)',
        status: 'draft',
        answers: {},
        aiSuggestions: {
          procedure:       { value: 'core_needle_biopsy', confidence: 98, source: 'Gross: "core biopsy performed under ultrasound guidance"', verification: 'unverified' },
          specimen_site:   { value: 'breast',             confidence: 99, source: 'Specimen label: "right breast core biopsy"', verification: 'unverified' },
          laterality:      { value: 'right',              confidence: 99, source: 'Specimen label: "right breast"', verification: 'unverified' },
          clock_position:  { value: '12',                 confidence: 94, source: 'Clinical: "12 o\'clock"', verification: 'unverified' },
          distance_nipple: { value: '2 cm',               confidence: 87, source: 'Clinical: "2 cm FN"', verification: 'unverified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: {},
  },

  // ── DEMO-RB-02: Breast core biopsy — micro received, protocol upgrade needed ─
  // UIUX: Open this case and click "DEV: Simulate Microscopic Received" to trigger
  //       the ProtocolChangeModal showing the proposed upgrade from NOS → CAP IDC.
  {
    id: 'DEMO-RB-02',
    accession: { accessionNumber: 'DEMO-02', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-DEMO-02' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-DEMO-RB-02', mrn: 'DEMO100002',
      firstName: 'Celia', lastName: 'Moreau',
      dateOfBirth: isoYearsAgo(48, 11, 7), sex: 'F',
      phone: '555-800-0002', email: 'celia.moreau@example.org',
      address: '14 Biltmore Ave, Phoenix, AZ 85016',
    },
    specimens: [
      { id: 'DEMO-02-SP-1', label: 'A', description: 'Left breast core biopsy — 9 o\'clock, 3 cm FN', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(2), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. Sandra Okafor',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Screening mammogram: left breast 9 o\'clock, BIRADS 4C. Ultrasound: 11 mm irregular mass with posterior acoustic shadowing and internal vascularity. High suspicion for malignancy. Stereotactic core biopsy, 4 cores.',
      receivedDate: isoDaysAgo(2), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Received in formalin labelled "left breast core biopsy A" are four tan-white cores, each approximately 1.5–1.6 cm × 0.1 cm. Two cores show a firm nodular area measuring approximately 0.4 cm. All cores submitted.',
      microscopicDescription: 'Sections show invasive ductal carcinoma of no special type (NST), Nottingham grade 2 (tubule formation 3, nuclear pleomorphism 2, mitotic count 1; total 6/9). Tumour cells form infiltrating glands and solid nests within a desmoplastic stroma. Nuclear grade is intermediate. No lymphovascular invasion is identified in the biopsy cores. Background breast parenchyma shows fibrocystic change. ER: Positive (Allred 7/8). PR: Positive (Allred 5/8). HER2: 1+ (negative). Ki-67: 14%.',
    },
    synopticReports: [
      {
        instanceId: 'DEMO-02-SYN-01',
        specimenId: 'DEMO-02-SP-1',
        templateId: 'breast_core_benign',
        templateName: 'Breast Core Biopsy (Benign/NOS)',
        status: 'draft',
        answers: {
          procedure:       'core_needle_biopsy',
          specimen_site:   'breast',
          laterality:      'left',
          clock_position:  '9',
          distance_nipple: '3 cm',
        },
        aiSuggestions: {
          procedure:       { value: 'core_needle_biopsy',   confidence: 98, source: 'Gross description', verification: 'verified' },
          specimen_site:   { value: 'breast',               confidence: 99, source: 'Specimen label', verification: 'verified' },
          laterality:      { value: 'left',                 confidence: 99, source: 'Specimen label', verification: 'verified' },
          clock_position:  { value: '9',                    confidence: 96, source: 'Clinical indication', verification: 'verified' },
        },
        createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1),
    caseFlags: [
      { id: 'demo-birads-4c', tagClass: 'ADMINISTRATIVE', name: 'BIRADS 4C', lisCode: 'BI4C', color: '#f59e0b', severity: 3, level: 'Case', status: 'Active' },
    ],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: {},
  },

  // ── DEMO-RB-03: Colon polyp — all sections complete, ready to finalise ───
  // UIUX: Click "Finalise" to open the PreFinalisationModal two-pane review.
  {
    id: 'DEMO-RB-03',
    accession: { accessionNumber: 'DEMO-03', accessionPrefix: 'S', accessionYear: 2026, fullAccession: 'S26-DEMO-03' },
    originHospitalId: 'HOSP-001', originEnterpriseId: 'ENT-ACME',
    patient: {
      id: 'PAT-DEMO-RB-03', mrn: 'DEMO100003',
      firstName: 'Martin', lastName: 'Hale',
      dateOfBirth: isoYearsAgo(67, 5, 22), sex: 'M',
      phone: '555-800-0003', email: 'martin.hale@example.org',
      address: '320 Central Ave, Phoenix, AZ 85004',
    },
    specimens: [
      { id: 'DEMO-03-SP-1', label: 'A', description: 'Sigmoid colon polyp — pedunculated, 18 mm', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
      { id: 'DEMO-03-SP-2', label: 'B', description: 'Ascending colon polyp — sessile, 6 mm', receivedAt: isoDaysAgo(1), collectedAt: isoDaysAgo(1), specimenFlags: [] },
    ],
    order: {
      priority: 'Routine',
      requestingProvider: 'Dr. James Fowler',
      clientId: 'c1', clientName: 'Metro General Hospital',
      clinicalIndication: 'Screening colonoscopy. Specimen A: 18 mm pedunculated polyp, sigmoid colon — hot snare polypectomy, retrieved intact. Specimen B: 6 mm sessile polyp, ascending colon — cold snare, retrieved. Background: family history CRC (father), previous adenoma 2021.',
      receivedDate: isoDaysAgo(1), assignedTo: 'PATH-RB-001', assignedParticipationTypeId: 'primary',
    },
    diagnostic: {
      grossDescription: 'Specimen A: A polypoid fragment of colonic mucosa with attached stalk measuring 1.8 × 1.2 × 1.0 cm. The polyp head is tan-brown and lobulated with a stalk 0.4 cm in length. Entirely submitted, 4 levels. Specimen B: A single flat fragment of tan-pink mucosa measuring 0.6 × 0.5 × 0.2 cm. Entirely submitted.',
      microscopicDescription: 'Specimen A: Tubulo-villous adenoma with low-grade dysplasia. The polyp shows tubular (65%) and villous (35%) architecture. Low-grade dysplastic epithelium lines all glandular structures. The stalk is free of neoplasia; margin is negative. No high-grade dysplasia or carcinoma is identified. Specimen B: Tubular adenoma with low-grade dysplasia, measuring 0.6 cm. No high-grade dysplasia.',
    },
    synopticReports: [
      {
        instanceId: 'DEMO-03-SYN-01',
        specimenId: 'DEMO-03-SP-1',
        templateId: 'colon_polyp',
        templateName: 'Colorectal Polyp (CAP)',
        status: 'draft',
        answers: {
          procedure:          'polypectomy',
          specimen_site:      'colon',
          anatomic_site:      'sigmoid_colon',
          polyp_size:         '18 mm',
          polyp_type:         'pedunculated',
          histologic_type:    'tubulo_villous_adenoma',
          dysplasia_grade:    'low_grade',
          villous_component:  '35%',
          margin_status:      'margins_negative',
          high_grade_dysplasia: 'not_identified',
          carcinoma:          'not_identified',
        },
        aiSuggestions: {
          procedure:          { value: 'polypectomy',            confidence: 99, source: 'Clinical: "hot snare polypectomy"', verification: 'verified' },
          anatomic_site:      { value: 'sigmoid_colon',          confidence: 98, source: 'Clinical: "sigmoid colon"', verification: 'verified' },
          polyp_size:         { value: '18 mm',                  confidence: 95, source: 'Gross: "1.8 × 1.2 × 1.0 cm"', verification: 'verified' },
          polyp_type:         { value: 'pedunculated',           confidence: 97, source: 'Clinical: "pedunculated polyp"', verification: 'verified' },
          histologic_type:    { value: 'tubulo_villous_adenoma', confidence: 94, source: 'Micro: "Tubulo-villous adenoma"', verification: 'verified' },
          dysplasia_grade:    { value: 'low_grade',              confidence: 96, source: 'Micro: "low-grade dysplasia"', verification: 'verified' },
          villous_component:  { value: '35%',                    confidence: 89, source: 'Micro: "villous (35%)"', verification: 'verified' },
          margin_status:      { value: 'margins_negative',       confidence: 93, source: 'Micro: "stalk is free of neoplasia; margin is negative"', verification: 'verified' },
          high_grade_dysplasia:{ value: 'not_identified',        confidence: 97, source: 'Micro: "No high-grade dysplasia"', verification: 'verified' },
          carcinoma:          { value: 'not_identified',         confidence: 98, source: 'Micro: "No … carcinoma"', verification: 'verified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
      {
        instanceId: 'DEMO-03-SYN-02',
        specimenId: 'DEMO-03-SP-2',
        templateId: 'colon_polyp',
        templateName: 'Colorectal Polyp (CAP)',
        status: 'draft',
        answers: {
          procedure:            'polypectomy',
          specimen_site:        'colon',
          anatomic_site:        'ascending_colon',
          polyp_size:           '6 mm',
          polyp_type:           'sessile',
          histologic_type:      'tubular_adenoma',
          dysplasia_grade:      'low_grade',
          high_grade_dysplasia: 'not_identified',
          carcinoma:            'not_identified',
        },
        aiSuggestions: {
          anatomic_site:        { value: 'ascending_colon',  confidence: 97, source: 'Clinical: "ascending colon"', verification: 'verified' },
          polyp_size:           { value: '6 mm',             confidence: 96, source: 'Gross: "0.6 × 0.5 cm"', verification: 'verified' },
          polyp_type:           { value: 'sessile',          confidence: 96, source: 'Clinical: "sessile polyp"', verification: 'verified' },
          histologic_type:      { value: 'tubular_adenoma',  confidence: 95, source: 'Micro: "Tubular adenoma"', verification: 'verified' },
          dysplasia_grade:      { value: 'low_grade',        confidence: 97, source: 'Micro: "low-grade dysplasia"', verification: 'verified' },
        },
        createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
      },
    ],
    status: 'in-progress' as CaseStatus,
    createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
    caseFlags: [],
    specimenFlags: [],
    reportingMode: 'copilot',
    coding: { icd10: ['K63.5'], snomed: ['68526002'] },
  },


];

// ─── Per-case patient history & similar cases ────────────────────────────────

export interface SimilarCase {
  id: string; accession: string; patient: string; diagnosis: string;
  date: string; similarity: number; site: string; outcome: string;
}

export const mockPatientHistoryMap: Record<string, string> = {

  // ── US Demo — Amber Fehrs-Battey (MPA) ──────────────────────────────────────
  'MPA26-1007-PED': 'No prior pathology on file. First surgical specimen for this patient.',

  'MPA26-1001-BR':
    "MPA23-0441 (Mar 2023) — Screening mammogram bilateral. BI-RADS 3 left breast — short-interval follow-up advised. | " +
    "MPA24-1882 (Jun 2024) — Diagnostic mammogram + ultrasound left breast. BI-RADS 4B, 1.4 cm mass 12 o\'clock. Core biopsy recommended. | " +
    "MPA24-3301 (Aug 2024) — Ultrasound-guided core needle biopsy left breast 12 o\'clock. Dx: Atypical ductal hyperplasia (ADH). Excision recommended.",
  'MPA26-1002-CR':
    "MPA19-0088 (Jan 2019) — Colonoscopy polypectomy, sigmoid colon. Dx: Tubular adenoma, low grade, completely excised. Surveillance in 5 years. | " +
    "MPA22-4401 (Apr 2022) — Colonoscopy biopsy, rectosigmoid junction. Dx: Tubulovillous adenoma with low grade dysplasia. Repeat colonoscopy in 3 years. | " +
    "MPA24-9910 (Oct 2024) — Colonoscopy biopsy, sigmoid/rectosigmoid mass 28 cm from AV. Dx: Adenocarcinoma, moderately differentiated. MRI staging: cT3N1. Neoadjuvant chemoradiation commenced.",
  'MPA26-1003-PRO':
    "MPA18-3301 (Jun 2018) — Prostate needle biopsy x12. Dx: Benign prostatic tissue. PSA 3.8. Annual PSA surveillance. | " +
    "MPA21-7712 (Sep 2021) — Prostate needle biopsy x12. Dx: Benign with focal high-grade PIN. PSA 5.6. MRI surveillance in 12 months. | " +
    "MPA24-4401 (Apr 2024) — MRI prostate PI-RADS 4 right posterior mid-gland. PSA 7.9. MRI-targeted biopsy recommended. | " +
    "MPA25-0881 (Jan 2025) — MRI-targeted + systematic biopsy x14. Dx: Acinar adenocarcinoma Gleason 3+4=7 (GG2) right posterior, 3/6 targeted cores positive. Radical prostatectomy planned.",

  // ── US Demo — Dr. Mark Tuthill (HFHS) ───────────────────────────────────────
  'HFHS26-1004-LU':
    "HFHS21-4401 (Oct 2021) — CT chest incidental finding: 8 mm RUL nodule. Fleischner low-risk — repeat CT in 12 months. | " +
    "HFHS22-6610 (Dec 2022) — CT chest surveillance: RUL nodule 11 mm, stable. Continue surveillance. | " +
    "HFHS24-3301 (May 2024) — CT chest: RUL nodule 1.9 cm, new ground-glass component. PET-CT arranged. | " +
    "HFHS25-8801 (Oct 2025) — PET-CT: RUL lesion 2.2 cm, SUVmax 5.8. No mediastinal uptake. CT-guided biopsy planned. | " +
    "HFHS25-9910 (Nov 2025) — CT-guided needle biopsy RUL mass. Dx: Adenocarcinoma acinar predominant. EGFR pending. VATS lobectomy booked.",
  'HFHS26-1005-FS':
    "HFHS24-0441 (Jan 2024) — EUS-FNA pancreatic head mass 2.1 cm. Dx: Atypical cells — insufficient for definitive diagnosis. CA19-9 210. Repeat imaging in 3 months. | " +
    "HFHS24-4401 (May 2024) — CT abdomen/pelvis: pancreatic head mass 2.7 cm, no vascular involvement. CA19-9 380. Surgical referral placed. | " +
    "HFHS25-8810 (Sep 2025) — EUS-FNA repeat. Dx: Adenocarcinoma, moderately differentiated. MDT: borderline resectable. Neoadjuvant FOLFIRINOX commenced.",

  'S26-4420-MEL':
    "S20-3301 (Jul 2020) — Punch biopsy right forearm pigmented lesion 0.6 cm. Dx: Dysplastic naevus, moderate atypia. Complete excision recommended. | " +
    "S22-8801 (Oct 2022) — Shave biopsy right forearm, recurrence at prior site. Dx: Dysplastic naevus, severe atypia (almost melanoma in situ). Wide local excision with 5 mm margins advised. | " +
    "S24-1102 (Feb 2024) — Punch biopsy new pigmented lesion right forearm, 1.4 cm, adjacent to scar. Dx: Melanoma in situ, superficial spreading type. Wide local excision 1 cm margins performed. | " +
    "S25-8801 (Oct 2025) — Punch biopsy right forearm lesion 2.1 cm, irregular border, rapid growth. Dx: Invasive melanoma, superficial spreading type, Breslow 2.3 mm. Wide local excision + sentinel node planned.",
  'S26-4401':
    "S22-4471 (Mar 2022) — Core needle biopsy, left breast 10 o'clock. Dx: Atypical ductal hyperplasia (ADH). ER+/PR+. Excision recommended; patient deferred. | " +
    "S23-7809 (Nov 2023) — Wire-localised excision, left breast. Dx: DCIS intermediate grade, cribriform, 8 mm. Margins clear >2 mm. XRT planned. | " +
    "S25-1104 (Jan 2025) — Screening mammogram bilateral. BI-RADS 3 — short-interval follow-up advised.",
  'S26-4402':
    "S21-8832 (Aug 2021) — Colonoscopy polypectomy, sigmoid colon. Dx: Tubular adenoma, low grade, completely excised. Surveillance in 3 years. | " +
    "S24-0091 (Jan 2024) — Surveillance colonoscopy biopsy, sigmoid colon. Dx: Tubulovillous adenoma with high grade dysplasia. Surgical referral placed. | " +
    "S24-6210 (Jun 2024) — Colonoscopy biopsy, sigmoid mass. Dx: Adenocarcinoma, moderately differentiated. CT staging arranged.",
  'S26-4403':
    "S22-3310 (Apr 2022) — CT-guided core biopsy, right upper lobe nodule 1.1 cm. Dx: Atypical adenomatous hyperplasia. Active surveillance. | " +
    "S24-9912 (Nov 2024) — PET-CT: RUL lesion 2.3 cm SUVmax 8.4. CT-guided biopsy planned. | " +
    "S25-0044 (Jan 2025) — CT-guided needle biopsy, RUL mass. Dx: Adenocarcinoma, acinar predominant. KRAS G12C. Surgical referral.",
  'S26-4404':
    "S20-5541 (Jun 2020) — Prostate needle biopsy x12. Dx: Benign, all cores. PSA 4.1. Annual surveillance. | " +
    "S22-7723 (Sep 2022) — Prostate needle biopsy x12. Dx: Benign with focal PIN. PSA 5.2. 12-month follow-up. | " +
    "S24-3301 (Mar 2024) — MRI prostate PI-RADS 3 right mid-gland. PSA 6.8. Active surveillance continued.",
  'S26-4405':
    "S23-4499 (Jul 2023) — Screening mammogram. BI-RADS 0 — calcifications right UOQ. Recall for additional views. | " +
    "S23-6610 (Sep 2023) — Stereotactic biopsy, right breast calcifications. Dx: DCIS intermediate grade. Lumpectomy + XRT recommended.",
  'S26-4406':
    "S25-8801 (Dec 2025) — Screening mammogram bilateral. BI-RADS 4B right breast mass 2 o'clock. Ultrasound-guided biopsy recommended.",
  'S26-4407':
    "S23-1140 (Feb 2023) — Colonoscopy biopsy, rectal mass 8 cm from AV. Dx: Adenocarcinoma, moderately differentiated. MRI staging: mrT3N2M0. | " +
    "S23-4482 (May 2023) — Restaging post-neoadjuvant FOLFOX + long-course RT. Endoscopy: near-complete response. Pathology: mucin pools, no viable tumour. | " +
    "S25-9901 (Oct 2025) — Surveillance colonoscopy. No anastomotic recurrence. CEA stable 2.1.",
  'S26-4408':
    "S22-0091 (Jan 2022) — BRCA1/2 germline testing: BRCA1 pathogenic variant c.5266dupC. Risk-reducing surgery discussed. | " +
    "S23-9901 (Dec 2023) — MRI screening bilateral. BI-RADS 4C right breast 2.1 cm UOQ. Biopsy arranged. | " +
    "S24-0441 (Jan 2024) — Ultrasound-guided biopsy, right breast 2 o'clock. Dx: Invasive carcinoma NST, Grade 3, HER2 3+. Pre-op pertuzumab/trastuzumab.",
};

export const mockSimilarCasesMap: Record<string, SimilarCase[]> = {
  'S26-4420-MEL': [
    { id: 'S25-9902', accession: 'S25-9902', patient: 'Whitmore, Carol',   diagnosis: 'Melanoma, superficial spreading, Breslow 2.1 mm, Clark IV, no ulceration, pT2b, pN1a SLN+', date: '2025-11-20', similarity: 96, site: 'Right forearm',   outcome: 'Finalized' },
    { id: 'S25-6611', accession: 'S25-6611', patient: 'Pemberton, Diana',  diagnosis: 'Melanoma, superficial spreading, Breslow 2.8 mm, Clark IV, ulcerated, pT3b, pN0 SLN-',      date: '2025-07-14', similarity: 91, site: 'Left forearm',    outcome: 'Finalized' },
    { id: 'S25-1103', accession: 'S25-1103', patient: 'Ashworth, Helen',   diagnosis: 'Melanoma, superficial spreading, Breslow 1.9 mm, Clark IV, no ulceration, pT2a, pN0',        date: '2025-03-08', similarity: 84, site: 'Right upper arm', outcome: 'Finalized' },
    { id: 'S24-8802', accession: 'S24-8802', patient: 'Griffith, Sandra',  diagnosis: 'Melanoma, nodular type, Breslow 3.4 mm, Clark V, ulcerated, pT3b, pN1a SLN+, BRAF+',        date: '2024-10-22', similarity: 76, site: 'Right forearm',   outcome: 'Finalized' },
    { id: 'S24-3302', accession: 'S24-3302', patient: 'Morrison, Jean',    diagnosis: 'Melanoma, superficial spreading, Breslow 1.5 mm, Clark III, no ulceration, pT2a, pN0',       date: '2024-04-17', similarity: 69, site: 'Left arm',        outcome: 'Amended'   },
  ],
  'S26-4401': [
    { id: 'S25-3301', accession: 'S25-3301', patient: 'Harrison, Mary',    diagnosis: 'Invasive carcinoma NST, Grade 2, 2.1 cm, ER+/PR+/HER2-, pN1(1/3)',       date: '2025-08-14', similarity: 96, site: 'Left breast UOQ',    outcome: 'Finalized' },
    { id: 'S25-1872', accession: 'S25-1872', patient: 'Foster, Diane',     diagnosis: 'Invasive carcinoma NST, Grade 2, 1.8 cm, ER+/PR+/HER2 2+ (FISH neg)',    date: '2025-03-22', similarity: 91, site: 'Left breast',         outcome: 'Finalized' },
    { id: 'S24-7809', accession: 'S24-7809', patient: 'Nelson, Patricia',  diagnosis: 'Invasive lobular carcinoma, Grade 2, 2.6 cm, ER+/PR+/HER2-',             date: '2024-11-08', similarity: 84, site: 'Left breast UIQ',    outcome: 'Finalized' },
    { id: 'S24-4451', accession: 'S24-4451', patient: 'Reed, Barbara',     diagnosis: 'Invasive carcinoma NST, Grade 1, 1.4 cm, ER+/PR+/HER2-, pN0',            date: '2024-06-19', similarity: 79, site: 'Right breast UOQ',   outcome: 'Finalized' },
    { id: 'S23-9103', accession: 'S23-9103', patient: 'Cox, Margaret',     diagnosis: 'Invasive carcinoma NST, Grade 3, 3.1 cm, ER+/PR-/HER2-, pN2(4/14)',      date: '2023-12-01', similarity: 72, site: 'Left breast',         outcome: 'Amended'   },
  ],
  'S26-4402': [
    { id: 'S25-4401', accession: 'S25-4401', patient: 'Butler, George',    diagnosis: 'Adenocarcinoma sigmoid, low grade, pT3N0, pMMR, KRAS G12D',              date: '2025-09-10', similarity: 94, site: 'Sigmoid colon',       outcome: 'Finalized' },
    { id: 'S25-0812', accession: 'S25-0812', patient: 'Simmons, Frank',    diagnosis: 'Adenocarcinoma sigmoid, low grade, pT3N1b(3/18), pMMR',                  date: '2025-05-17', similarity: 89, site: 'Sigmoid colon',       outcome: 'Finalized' },
    { id: 'S24-6631', accession: 'S24-6631', patient: 'Grant, Thomas',     diagnosis: 'Adenocarcinoma descending colon, low grade, pT3N0, MSI-H',               date: '2024-10-03', similarity: 81, site: 'Descending colon',    outcome: 'Finalized' },
    { id: 'S24-2210', accession: 'S24-2210', patient: 'Webb, Arthur',      diagnosis: 'Adenocarcinoma rectosigmoid, pT4aN1a(1/12), pMMR, KRAS wt',             date: '2024-04-22', similarity: 74, site: 'Rectosigmoid',        outcome: 'Finalized' },
    { id: 'S23-8814', accession: 'S23-8814', patient: 'Murray, Charles',   diagnosis: 'Mucinous adenocarcinoma sigmoid, high grade, pT3N2b, MSI-H',             date: '2023-08-15', similarity: 67, site: 'Sigmoid colon',       outcome: 'Finalized' },
  ],
  'S26-4403': [
    { id: 'S25-5501', accession: 'S25-5501', patient: 'Fleming, Barbara',  diagnosis: 'Adenocarcinoma RUL, acinar predominant, Grade 2, pT1cN0, KRAS G12C',     date: '2025-10-05', similarity: 95, site: 'Right upper lobe',    outcome: 'Finalized' },
    { id: 'S25-2219', accession: 'S25-2219', patient: 'Gibson, Anne',      diagnosis: 'Adenocarcinoma LUL, lepidic/acinar, Grade 2, pT2aN0, EGFR exon 19 del', date: '2025-06-11', similarity: 87, site: 'Left upper lobe',     outcome: 'Finalized' },
    { id: 'S24-8802', accession: 'S24-8802', patient: 'Hawkins, Sandra',   diagnosis: 'Adenocarcinoma RUL, papillary predominant, Grade 3, pT2bN1, ALK+',       date: '2024-12-20', similarity: 80, site: 'Right upper lobe',    outcome: 'Finalized' },
    { id: 'S24-3318', accession: 'S24-3318', patient: 'Preston, Judith',   diagnosis: 'Adenocarcinoma RLL, acinar, Grade 2, pT1bN0, KRAS G12V',                date: '2024-07-08', similarity: 73, site: 'Right lower lobe',    outcome: 'Finalized' },
    { id: 'S23-7741', accession: 'S23-7741', patient: 'Lawson, Shirley',   diagnosis: 'Invasive mucinous adenocarcinoma RUL, Grade 1, pT3N0, KRAS G12D',        date: '2023-11-14', similarity: 65, site: 'Right upper lobe',    outcome: 'Finalized' },
  ],
  'S26-4404': [
    { id: 'S25-6601', accession: 'S25-6601', patient: 'Carpenter, James',  diagnosis: 'Acinar adenocarcinoma, Gleason 3+4=7 (GG2), 5/12 cores, PNI present',   date: '2025-11-02', similarity: 97, site: 'Prostate bilateral',   outcome: 'Finalized' },
    { id: 'S25-3318', accession: 'S25-3318', patient: 'Stone, Edward',     diagnosis: 'Acinar adenocarcinoma, Gleason 3+4=7 (GG2), 4/12 cores, PNI absent',    date: '2025-07-19', similarity: 92, site: 'Prostate right',       outcome: 'Finalized' },
    { id: 'S24-9912', accession: 'S24-9912', patient: 'Walsh, Joseph',     diagnosis: 'Acinar adenocarcinoma, Gleason 4+3=7 (GG3), 6/12 cores, PNI present',   date: '2024-09-30', similarity: 84, site: 'Prostate bilateral',   outcome: 'Finalized' },
    { id: 'S24-5514', accession: 'S24-5514', patient: 'Ryan, Patrick',     diagnosis: 'Acinar adenocarcinoma, Gleason 3+3=6 (GG1), 2/12 cores, PNI absent',    date: '2024-05-14', similarity: 76, site: 'Prostate right',       outcome: 'Finalized' },
    { id: 'S23-8801', accession: 'S23-8801', patient: 'Kennedy, William',  diagnosis: 'Acinar adenocarcinoma, Gleason 4+4=8 (GG4), 8/12 cores, PNI present',   date: '2023-10-07', similarity: 68, site: 'Prostate bilateral',   outcome: 'Finalized' },
  ],
  'S26-4405': [
    { id: 'S25-4402', accession: 'S25-4402', patient: 'Palmer, Christine', diagnosis: 'DCIS intermediate grade, cribriform, 15 mm, margins clear >3 mm',       date: '2025-08-21', similarity: 95, site: 'Right breast UOQ',    outcome: 'Finalized' },
    { id: 'S25-1101', accession: 'S25-1101', patient: 'Gardner, Frances',  diagnosis: 'DCIS intermediate grade, solid/cribriform, 22 mm, closest margin 2 mm', date: '2025-04-09', similarity: 88, site: 'Left breast',         outcome: 'Finalized' },
    { id: 'S24-7712', accession: 'S24-7712', patient: 'Burton, Jean',      diagnosis: 'DCIS high grade, comedo, 11 mm, margins clear',                         date: '2024-10-17', similarity: 79, site: 'Right breast UIQ',    outcome: 'Finalized' },
  ],
  'S26-4406': [
    { id: 'S25-3301', accession: 'S25-3301', patient: 'Harrison, Mary',    diagnosis: 'Invasive carcinoma NST, Grade 2, 2.1 cm, ER+/PR+/HER2-, pN1(1/3)',       date: '2025-08-14', similarity: 82, site: 'Left breast UOQ',    outcome: 'Finalized' },
    { id: 'S24-7809', accession: 'S24-7809', patient: 'Nelson, Patricia',  diagnosis: 'Invasive lobular carcinoma, Grade 2, 2.6 cm, ER+/PR+/HER2-',             date: '2024-11-08', similarity: 74, site: 'Left breast UIQ',    outcome: 'Finalized' },
  ],
  'S26-4407': [
    { id: 'S25-8801', accession: 'S25-8801', patient: 'Sherman, Harold',   diagnosis: 'Rectal adenocarcinoma post-CRT, ypT2N0, Ryan score 2, pMMR',             date: '2025-09-22', similarity: 93, site: 'Rectum',             outcome: 'Finalized' },
    { id: 'S25-3309', accession: 'S25-3309', patient: 'Gibson, Walter',    diagnosis: 'Rectal adenocarcinoma post-CRT, ypT3N1b(2/14), Ryan score 2, MSI-H',    date: '2025-04-15', similarity: 88, site: 'Rectum',             outcome: 'Finalized' },
    { id: 'S24-7809', accession: 'S24-7809', patient: 'Cross, Ralph',      diagnosis: 'Rectal adenocarcinoma post-CRT, ypT0N0 (pCR), Ryan score 0',             date: '2024-08-30', similarity: 79, site: 'Rectum',             outcome: 'Finalized' },
    { id: 'S24-2201', accession: 'S24-2201', patient: 'Hunt, Ernest',      diagnosis: 'Rectal adenocarcinoma post-CRT, ypT3N2b(5/16), Ryan score 3, pMMR',     date: '2024-02-11', similarity: 71, site: 'Rectum',             outcome: 'Finalized' },
  ],
  // ── US Demo — Amber (MPA) ───────────────────────────────────────────────────
  'MPA26-1001-BR': [
    { id: 'MPA25-4401', accession: 'MPA25-4401', patient: 'Jensen, Carol',     diagnosis: 'Invasive carcinoma NST, Grade 2, 2.0 cm, ER+/PR+/HER2 2+ FISH neg, pN1(1/3), LVI+', date: '2025-09-14', similarity: 95, site: 'Left breast 12 o\'clock', outcome: 'Finalized' },
    { id: 'MPA25-1882', accession: 'MPA25-1882', patient: 'Kowalski, Ruth',    diagnosis: 'Invasive carcinoma NST, Grade 2, 1.7 cm, ER+/PR+/HER2-, pN0, margin 0.1 cm anterior', date: '2025-04-22', similarity: 91, site: 'Left breast',            outcome: 'Finalized' },
    { id: 'MPA24-8801', accession: 'MPA24-8801', patient: 'Brennan, Helen',    diagnosis: 'Invasive carcinoma NST, Grade 2, 2.2 cm, ER+/PR+/HER2 2+ FISH pos, pN1(2/4)',       date: '2024-11-08', similarity: 86, site: 'Left breast UOQ',          outcome: 'Finalized' },
    { id: 'MPA24-3301', accession: 'MPA24-3301', patient: 'Patel, Sunita',     diagnosis: 'Invasive carcinoma NST, Grade 1, 1.5 cm, ER+/PR+/HER2-, pN0, all margins >2 mm',    date: '2024-06-19', similarity: 80, site: 'Left breast',            outcome: 'Finalized' },
    { id: 'MPA23-9103', accession: 'MPA23-9103', patient: 'Torres, Maria',     diagnosis: 'Invasive lobular carcinoma, Grade 2, 2.4 cm, ER+/PR+/HER2-, pN1(1/2)',              date: '2023-12-01', similarity: 73, site: 'Left breast UIQ',          outcome: 'Finalized' },
  ],
  'MPA26-1002-CR': [
    { id: 'MPA25-8801', accession: 'MPA25-8801', patient: 'Kowalczyk, Peter',  diagnosis: 'Rectal adenocarcinoma post-CRT, ypT3N0, Ryan grade 2 (moderate response), pMMR, KRAS wt', date: '2025-10-22', similarity: 94, site: 'Rectosigmoid',  outcome: 'Finalized' },
    { id: 'MPA25-3309', accession: 'MPA25-3309', patient: 'Nowak, Richard',    diagnosis: 'Rectal adenocarcinoma post-CRT, ypT2N0, Ryan grade 1, pMMR, KRAS G12D',             date: '2025-05-15', similarity: 89, site: 'Rectum',              outcome: 'Finalized' },
    { id: 'MPA24-7712', accession: 'MPA24-7712', patient: 'Grabowski, Frank',  diagnosis: 'Rectal adenocarcinoma post-CRT, ypT3N1b(2/16), Ryan grade 2, pMMR, BRAF wt',        date: '2024-09-03', similarity: 82, site: 'Rectosigmoid',          outcome: 'Finalized' },
    { id: 'MPA24-2201', accession: 'MPA24-2201', patient: 'Wisniewski, Carl',  diagnosis: 'Rectal adenocarcinoma post-CRT, ypT0N0 (pCR), Ryan grade 0, pMMR',                   date: '2024-03-11', similarity: 74, site: 'Rectum',              outcome: 'Finalized' },
    { id: 'MPA23-8814', accession: 'MPA23-8814', patient: 'Kaminski, Robert',  diagnosis: 'Rectal adenocarcinoma post-CRT, ypT3N2b(4/18), Ryan grade 3, pMMR, KRAS G12V',       date: '2023-08-20', similarity: 66, site: 'Rectum',              outcome: 'Finalized' },
  ],
  'MPA26-1003-PRO': [
    { id: 'MPA25-6601', accession: 'MPA25-6601', patient: 'Mueller, Thomas',   diagnosis: 'Acinar adenocarcinoma, Gleason 3+4=7 (GG2), pT3a, EPE focal, margin+ 1 mm, pN0',    date: '2025-11-02', similarity: 97, site: 'Prostate right posterior', outcome: 'Finalized' },
    { id: 'MPA25-3318', accession: 'MPA25-3318', patient: 'Hoffman, David',    diagnosis: 'Acinar adenocarcinoma, Gleason 3+4=7 (GG2), pT2c, margins clear, pN0(0/12)',         date: '2025-07-19', similarity: 91, site: 'Prostate bilateral',      outcome: 'Finalized' },
    { id: 'MPA24-9912', accession: 'MPA24-9912', patient: 'Schultz, Michael',  diagnosis: 'Acinar adenocarcinoma, Gleason 4+3=7 (GG3), pT3a, EPE extensive, SVI absent, pN0',  date: '2024-09-30', similarity: 84, site: 'Prostate bilateral',      outcome: 'Finalized' },
    { id: 'MPA24-5514', accession: 'MPA24-5514', patient: 'Fischer, Gary',     diagnosis: 'Acinar adenocarcinoma, Gleason 3+4=7 (GG2), pT3a, margin+ 2 mm, pN1(1/14)',         date: '2024-05-14', similarity: 77, site: 'Prostate right',          outcome: 'Amended'   },
    { id: 'MPA23-8801', accession: 'MPA23-8801', patient: 'Wagner, Kenneth',   diagnosis: 'Acinar adenocarcinoma, Gleason 3+3=6 (GG1), pT2b, all margins clear, pN0(0/9)',     date: '2023-10-07', similarity: 69, site: 'Prostate right',          outcome: 'Finalized' },
  ],

  // ── US Demo — Tuthill (HFHS) ─────────────────────────────────────────────────
  'HFHS26-1004-LU': [
    { id: 'HFHS25-5501', accession: 'HFHS25-5501', patient: 'Kowalski, James', diagnosis: 'Adenocarcinoma RUL, acinar predominant, pT2a pN0, EGFR exon 19 del, PD-L1 28%',    date: '2025-10-05', similarity: 96, site: 'Right upper lobe',  outcome: 'Finalized' },
    { id: 'HFHS25-2219', accession: 'HFHS25-2219', patient: 'Petrovich, Ann',  diagnosis: 'Adenocarcinoma LUL, acinar/lepidic, pT1c pN0, EGFR exon 21 L858R, PD-L1 10%',      date: '2025-06-11', similarity: 89, site: 'Left upper lobe',   outcome: 'Finalized' },
    { id: 'HFHS24-8802', accession: 'HFHS24-8802', patient: 'Ostrowski, Paul', diagnosis: 'Adenocarcinoma RUL, acinar predominant, pT2b pN1, KRAS G12C, PD-L1 45%',           date: '2024-12-20', similarity: 82, site: 'Right upper lobe',  outcome: 'Finalized' },
    { id: 'HFHS24-3318', accession: 'HFHS24-3318', patient: 'Grabowski, Sue',  diagnosis: 'Adenocarcinoma RUL, papillary predominant, pT2a pN0, EGFR exon 19 del, PL1',        date: '2024-07-08', similarity: 75, site: 'Right upper lobe',  outcome: 'Finalized' },
    { id: 'HFHS23-7741', accession: 'HFHS23-7741', patient: 'Malinowski, Ed',  diagnosis: 'Adenocarcinoma RUL, solid predominant, pT3 pN2, PD-L1 65%, no targetable mutation', date: '2023-11-14', similarity: 67, site: 'Right upper lobe',  outcome: 'Finalized' },
  ],

  'S26-4408': [
    { id: 'S25-7701', accession: 'S25-7701', patient: 'Holt, Virginia',    diagnosis: 'Invasive carcinoma NST, Grade 3, 2.4 cm, ER-/PR-/HER2 3+, pN0, BRCA1+', date: '2025-10-11', similarity: 96, site: 'Right breast',        outcome: 'Finalized' },
    { id: 'S25-4410', accession: 'S25-4410', patient: 'Warren, Dorothy',   diagnosis: 'Invasive carcinoma NST, Grade 3, 1.9 cm, ER-/PR-/HER2 3+, pN1(2/15)',   date: '2025-06-28', similarity: 91, site: 'Left breast',         outcome: 'Finalized' },
    { id: 'S24-9801', accession: 'S24-9801', patient: 'Fowler, Evelyn',    diagnosis: 'Invasive carcinoma NST, Grade 3, 3.3 cm, ER-/PR-/HER2 3+, pN2, BRCA2+', date: '2024-11-14', similarity: 85, site: 'Left breast UIQ',    outcome: 'Amended'   },
    { id: 'S24-3309', accession: 'S24-3309', patient: 'Hawkins, Mildred',  diagnosis: 'Invasive carcinoma NST, Grade 3, 2.8 cm, ER+/PR-/HER2 3+, pN1(1/8)',    date: '2024-05-03', similarity: 77, site: 'Right breast',        outcome: 'Finalized' },
  ],
};

const DEFAULT_HISTORY = 'No prior pathology cases on record for this patient.';
const DEFAULT_SIMILAR: SimilarCase[] = [];

export function getSimilarCases(caseId: string): SimilarCase[] {
  return mockSimilarCasesMap[caseId] ?? DEFAULT_SIMILAR;
}
export function getPatientHistory(caseId: string): string {
  return mockPatientHistoryMap[caseId] ?? DEFAULT_HISTORY;
}

// Legacy static exports
export const mockSimilarCases = mockSimilarCasesMap['S26-4401'] ?? [];
export const mockPatientHistory = mockPatientHistoryMap['S26-4401'] ?? DEFAULT_HISTORY;


// ─── Persisted case store ─────────────────────────────────────────────────────
// Version bump here forces a re-seed whenever mock data changes structurally.
// Increment MOCK_VERSION whenever MOCK_CASES fields are added/changed.
const MOCK_VERSION = '28'; // bumped: added computational specimenFlags // bumped: added assignedParticipationTypeId: primary to all assigned cases
const VERSION_KEY  = 'pathscribe_mock_cases_version';

const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== MOCK_VERSION) {
  // Stale data — wipe and re-seed from MOCK_CASES
  localStorage.removeItem('pathscribe_mock_' + STORAGE_KEY);
  localStorage.setItem(VERSION_KEY, MOCK_VERSION);
}

const stored = localStorage.getItem('pathscribe_mock_' + STORAGE_KEY);
let CASES: Case[] = stored ? JSON.parse(stored) : null;
if (!CASES) {
  CASES = JSON.parse(JSON.stringify(MOCK_CASES));
  storageSet(STORAGE_KEY, CASES);
}

// ─── AI Suggestion Generator ─────────────────────────────────────────────────
// Called when a template is first attached to a case (no prior aiSuggestions).
// Uses the Anthropic API to analyse the gross/micro/ancillary text and return
// field-level suggestions with confidence scores and source citations.

export async function generateAiSuggestionsForReport(
  caseData: Case,
  templateId: string,
  templateFields: Array<{ id: string; label: string; options?: Array<{ id: string; label: string }> }>,
  computationalResults?: Record<string, Record<string, string | number | boolean | null>>
): Promise<Record<string, { value: string | string[]; confidence: number; source: string; verification: 'unverified' }>> {
  const fieldList = templateFields.map(f => {
    const opts = f.options?.map(o => `${o.id} (${o.label})`).join(', ');
    return opts ? `- ${f.id} | ${f.label} | options: [${opts}]` : `- ${f.id} | ${f.label} | free text`;
  }).join('\n');

  // Format discrete computational results for the prompt when available.
  // These are higher-fidelity signals than the narrative ancillary text —
  // the AI should prefer them when they conflict with narrative.
  const computationalSection = computationalResults && Object.keys(computationalResults).length > 0
    ? '\n\nCOMPUTATIONAL RESULTS (discrete, authoritative — prefer over narrative when present):\n' +
      Object.entries(computationalResults)
        .map(([assay, data]) => {
          const fields = Object.entries(data)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n');
          return `${assay}:\n${fields}`;
        })
        .join('\n\n')
    : '';

  const prompt = `You are a pathology AI assistant. Analyse the following pathology case data and suggest answers for each synoptic field.

TEMPLATE: ${templateId}
CASE ID: ${caseData.id}
GROSS DESCRIPTION: ${caseData.diagnostic?.grossDescription ?? '—'}
MICROSCOPIC DESCRIPTION: ${caseData.diagnostic?.microscopicDescription ?? '—'}
ANCILLARY STUDIES: ${caseData.diagnostic?.ancillaryStudies ?? '—'}${computationalSection}

SYNOPTIC FIELDS (id | label | allowed option ids):
${fieldList}

Return ONLY a JSON object (no markdown, no preamble) with this exact structure for every field you can answer:
{
  "field_id": {
    "value": "option_id_or_free_text_string",
    "confidence": 85,
    "source": "Short quote from the case text that supports this answer"
  }
}

Rules:
- value must be an option id (not the label) when options are listed, or a plain string for free text
- For checkboxes/multi-select fields, value may be an array of option ids
- confidence is 0–100 based on how clearly the text supports the answer
- source is a short (≤12 word) direct quote or paraphrase from gross/micro/ancillary/computational
- Only include fields you can answer with reasonable confidence (≥30)
- Do NOT invent findings not present in the text`;

  try {
    const { text: raw } = await callAi({
      system: 'You are a pathology AI assistant. You return only valid JSON — no markdown, no preamble.',
      prompt,
    });
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Stamp every field with verification: 'unverified'
    const result: Record<string, any> = {};
    for (const [fieldId, sug] of Object.entries(parsed) as any) {
      result[fieldId] = { ...sug, verification: 'unverified' };
    }
    return result;
  } catch (e) {
    console.error('[PathScribe] AI suggestion generation failed:', e);
    return {};
  }
}

// ─── Migrate stored cases: backfill aiSuggestions from MOCK_CASES ────────────
// Runs once after load. If a stored synopticReport instance is missing
// aiSuggestions, it copies them from the matching MOCK_CASES entry.
// This is safe to run on every boot — it only fills gaps, never overwrites.
(function migratAiSuggestions() {
  let mutated = false;
  CASES.forEach(storedCase => {
    const mockCase = MOCK_CASES.find(m => m.id === storedCase.id);
    if (!mockCase?.synopticReports) return;
    storedCase.synopticReports?.forEach(storedReport => {
      const mockReport = mockCase.synopticReports!.find(m => m.instanceId === storedReport.instanceId);
      if (mockReport && (mockReport as any).aiSuggestions && !(storedReport as any).aiSuggestions) {
        (storedReport as any).aiSuggestions = (mockReport as any).aiSuggestions;
        mutated = true;
      }
    });
  });
  if (mutated) storageSet(STORAGE_KEY, CASES);
})();

// ─── AI Feedback Logger ──────────────────────────────────────────────────────
// Records every user correction/confirmation so the AI can learn over time.
// In production this would POST to your ML feedback endpoint.
// For now it persists to localStorage so corrections survive refresh and
// can be bulk-exported when a real endpoint is available.

export interface AiFeedbackEntry {
  timestamp: string;
  caseId: string;
  instanceId: string;
  templateId: string;
  fieldId: string;
  fieldLabel: string;
  aiValue: string | string[];
  aiConfidence: number;
  userValue: string | string[];
  action: 'confirmed' | 'overridden' | 'missed';
  source: string;
}

const FEEDBACK_KEY = 'pathscribe_ai_feedback';

export function recordAiFeedback(entry: AiFeedbackEntry): void {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const log: AiFeedbackEntry[] = raw ? JSON.parse(raw) : [];
    log.push(entry);
    // Keep last 500 entries to avoid unbounded growth
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(log));
    console.info('[PathScribe AI] Feedback recorded:', entry.action, entry.fieldId,
      entry.action === 'overridden'
        ? `AI said "${entry.aiValue}" → user chose "${entry.userValue}"`
        : `"${entry.aiValue}" confirmed`
    );
  } catch (e) {
    console.error('[PathScribe AI] Failed to record feedback', e);
  }
}

export function getAiFeedbackLog(): AiFeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Persist updated aiSuggestions for a single report instance ──────────────
// Called after every field change so override/confirmed state is durable.
export async function saveReportSuggestions(
  caseId: string,
  instanceId: string,
  suggestions: Record<string, import('../../types/case/Case').AiFieldSuggestion>
): Promise<void> {
  const c = CASES.find(x => x.id === caseId);
  if (!c) return;
  const report = c.synopticReports?.find(r => r.instanceId === instanceId);
  if (!report) return;
  (report as any).aiSuggestions = suggestions;
  report.updatedAt = new Date().toISOString();
  storageSet(STORAGE_KEY, CASES);
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ─── Delegation & Pool Claim Functions ───────────────────────────────────────

const CLAIM_TTL_MS        = 30_000;
const DELEGATION_STORE_KEY = 'ps_delegations_v1';
const CLAIM_STORE_KEY      = 'ps_claims_v1';

export interface ClaimResult {
  success: boolean;
  claimedBy?: string;
  error?: string;
}

export interface DelegationRecord {
  id: string;
  caseId: string;
  fromUserId: string;
  toUserId?: string;
  toPoolId?: string;
  toPoolName?: string;
  delegationType: string;
  note?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'passed' | 'completed';
}

function loadDelegations(): DelegationRecord[] {
  try { return JSON.parse(localStorage.getItem(DELEGATION_STORE_KEY) ?? '[]'); } catch { return []; }
}
function saveDelegations(records: DelegationRecord[]): void {
  try { localStorage.setItem(DELEGATION_STORE_KEY, JSON.stringify(records)); } catch {}
}
function loadClaims(): Record<string, { userId: string; expiresAt: number }> {
  try { return JSON.parse(localStorage.getItem(CLAIM_STORE_KEY) ?? '{}'); } catch { return {}; }
}
function saveClaims(claims: Record<string, { userId: string; expiresAt: number }>): void {
  try { localStorage.setItem(CLAIM_STORE_KEY, JSON.stringify(claims)); } catch {}
}

/** Attempt to claim a pool case before showing accept/pass prompt */
export async function claimPoolCase(caseId: string, userId: string): Promise<ClaimResult> {
  await delay(200);
  const claims = loadClaims();
  const existing = claims[caseId];
  if (existing && existing.expiresAt > Date.now() && existing.userId !== userId) {
    return { success: false, claimedBy: existing.userId, error: 'Case is being claimed by another pathologist' };
  }
  claims[caseId] = { userId, expiresAt: Date.now() + CLAIM_TTL_MS };
  saveClaims(claims);
  return { success: true };
}

/** Accept a pool case — assigns to pathologist, removes from pool */
export async function acceptPoolCase(caseId: string, userId: string): Promise<void> {
  await delay(300);
  const claims = loadClaims();
  delete claims[caseId];
  saveClaims(claims);
  // Update case in CASES array
  const idx = CASES.findIndex((c: any) => c.id === caseId);
  if (idx >= 0) {
    CASES[idx] = { ...CASES[idx], status: 'in-progress' as CaseStatus, order: { ...CASES[idx].order, assignedTo: userId }, updatedAt: new Date().toISOString() } as any;
    storageSet(STORAGE_KEY, CASES);
  }
  const delegations = loadDelegations();
  const delIdx = delegations.findIndex(d => d.caseId === caseId && d.status === 'pending');
  if (delIdx >= 0) { delegations[delIdx].status = 'accepted'; saveDelegations(delegations); }
}

/** Pass on a pool case — release claim, case stays in pool */
export async function passPoolCase(caseId: string): Promise<void> {
  await delay(200);
  const claims = loadClaims();
  delete claims[caseId];
  saveClaims(claims);
}

/** Delegate a case to an individual or pool */
export async function delegateCase(
  caseId: string,
  fromUserId: string,
  delegationType: string,
  toUserId?: string,
  toPoolId?: string,
  toPoolName?: string,
  note?: string,
): Promise<DelegationRecord> {
  await delay(400);
  const record: DelegationRecord = {
    id: Math.random().toString(36).slice(2),
    caseId, fromUserId, toUserId, toPoolId, toPoolName, delegationType,
    note, timestamp: new Date().toISOString(), status: 'pending',
  };
  const idx = CASES.findIndex((c: any) => c.id === caseId);
  if (idx >= 0) {
    const newStatus: CaseStatus = delegationType === 'POOL' ? 'pool'
      : delegationType === 'REASSIGN' ? 'in-progress'
      : 'pending-review';
    CASES[idx] = {
      ...CASES[idx],
      status: newStatus,
      ...(toPoolId   ? { poolId: toPoolId }     : {}),
      ...(toPoolName ? { poolName: toPoolName }  : {}),
      order: { ...CASES[idx].order, assignedTo: toUserId ?? CASES[idx].order?.assignedTo },
      updatedAt: new Date().toISOString(),
    } as any;
    storageSet(STORAGE_KEY, CASES);
  }
  const delegations = loadDelegations();
  delegations.push(record);
  saveDelegations(delegations);
  return record;
}

/** Get delegation history, optionally filtered by case */
export async function getDelegations(caseId?: string): Promise<DelegationRecord[]> {
  await delay(100);
  const all = loadDelegations();
  return caseId ? all.filter(d => d.caseId === caseId) : all;
}

// ─── Synoptic-level Assignment ────────────────────────────────────────────────

export interface SynopticAssignment {
  caseId: string;
  instanceId: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedAt: string;
  requiresCountersign: boolean;
  note?: string;
}

/** Assign a specific synoptic report instance to another pathologist */
export async function assignSynoptic(
  caseId: string,
  instanceId: string,
  assignedTo: string,
  assignedToName: string,
  assignedBy: string,
  requiresCountersign = true,
  note?: string,
): Promise<void> {
  await delay(300);
  const idx = CASES.findIndex((c: any) => c.id === caseId);
  if (idx < 0) return;
  const reportIdx = (CASES[idx].synopticReports ?? []).findIndex(
    (r: any) => r.instanceId === instanceId
  );
  if (reportIdx < 0) return;

  const updated = { ...CASES[idx] };
  const reports = [...(updated.synopticReports ?? [])];
  reports[reportIdx] = {
    ...reports[reportIdx],
    assignedTo,
    assignedToName,
    assignedBy,
    assignedAt: new Date().toISOString(),
    requiresCountersign,
    assignmentNote: note,
    status: 'draft',
  };
  updated.synopticReports = reports;
  CASES[idx] = updated as any;
  storageSet(STORAGE_KEY, CASES);

  // Record delegation entry
  const record: DelegationRecord = {
    id: Math.random().toString(36).slice(2),
    caseId, fromUserId: assignedBy, toUserId: assignedTo,
    delegationType: 'SYNOPTIC_ASSIGN',
    note, timestamp: new Date().toISOString(), status: 'pending',
  };
  const delegations = loadDelegations();
  delegations.push(record);
  saveDelegations(delegations);
}

/** Countersign a synoptic that was finalised by an assigned pathologist */
export async function countersignSynoptic(
  caseId: string,
  instanceId: string,
  countersignedBy: string,
): Promise<void> {
  await delay(300);
  const idx = CASES.findIndex((c: any) => c.id === caseId);
  if (idx < 0) return;
  const reportIdx = (CASES[idx].synopticReports ?? []).findIndex(
    (r: any) => r.instanceId === instanceId
  );
  if (reportIdx < 0) return;

  const updated = { ...CASES[idx] };
  const reports = [...(updated.synopticReports ?? [])];
  reports[reportIdx] = {
    ...reports[reportIdx],
    countersignedBy,
    countersignedAt: new Date().toISOString(),
    status: 'finalized',
  };
  updated.synopticReports = reports;
  CASES[idx] = updated as any;
  storageSet(STORAGE_KEY, CASES);
}

// ─── Pathologist ID → Name map ────────────────────────────────────────────────
// Matches the assignedTo IDs used in MOCK_CASES orders.
const PATHOLOGIST_NAMES: Record<string, string> = {
  'PATH-001': 'Dr. Sarah Chen',
  'PATH-002': 'Dr. Michael Torres',
  'PATH-003': 'Dr. Anil Sharma',
  'PATH-004': 'Dr. Linda Park',
  'PATH-005': 'Dr. James Nguyen',
  'PATH-UK-001': 'Dr. Paul Carter',
  'PATH-UK-002': 'Dr. Oliver Pemberton',
};

// ─── Patient History ──────────────────────────────────────────────────────────
// Prior pathology for known patients, keyed by MRN.
// This is the "query input" the AI uses to find similar cases.

export interface PatientHistoryCase {
  id: string;
  date: string;
  diagnosis: string;
  site: string;
  procedure: string;
  physician: string;
  receptors: string;
  ki67: string;
  margins: string;
  nodes: string;
  gross: string;
  microscopic: string;
  comment: string;
  tags: string[];
  // Internal fields used by the similarity scorer
  _templateId?: string;
  _grade?: number;
  _erPositive?: boolean;
  _her2Positive?: boolean;
  _snomedMorphology?: string[];  // SNOMED CT concept IDs for morphology matching
}

export const MOCK_PRIOR_PATHOLOGY: Record<string, PatientHistoryCase[]> = {
  // ── US patients ───────────────────────────────────────────────────────────

  // Robert Jackson — MRN 100002 — Colorectal (current: sigmoid resection)
  '100002': [
    {
      id: 'S23-09812',
      date: 'Jun 18, 2023',
      diagnosis: 'Tubular adenoma with low grade dysplasia — surveillance colonoscopy',
      site: 'Sigmoid colon',
      procedure: 'Colonoscopic polypectomy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '< 15%', margins: 'Clear', nodes: 'Not sampled',
      gross: 'Single pedunculated polyp 1.4 cm. Pink-tan mucosal surface.',
      microscopic: 'Tubular adenoma with low grade dysplasia. No high grade dysplasia or invasive carcinoma. Stalk margin clear.',
      comment: 'Tubular adenoma completely excised. 3-year colonoscopic surveillance recommended.',
      tags: ['Adenoma', 'Low grade dysplasia', 'Polypectomy', 'Complete excision'],
      _templateId: 'colon_resection', _grade: 1, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['413448000', '363346000'],
    },
  ],

  // Helen Williams — MRN 100003 — Lung (current: VATS right upper lobectomy)
  '100003': [
    {
      id: 'S24-11203',
      date: 'Aug 29, 2024',
      diagnosis: 'Adenocarcinoma of lung — CT-guided core biopsy, acinar predominant',
      site: 'Right upper lobe, subpleural nodule',
      procedure: 'CT-guided core needle biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '32%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Two core biopsies each 1.4 cm × 2 mm. Submitted entirely.',
      microscopic: 'Moderately differentiated adenocarcinoma, acinar predominant pattern. TTF-1 positive.',
      comment: 'Pulmonary adenocarcinoma confirmed. EGFR/ALK/ROS1 negative. Referral to thoracic surgery for VATS resection.',
      tags: ['Lung adenocarcinoma', 'Acinar', 'EGFR−', 'ALK−', 'Pre-surgical biopsy'],
      _templateId: 'lung_resection', _grade: 2, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['254637007', '413448000'],
    },
  ],

  // David Martinez — MRN 100004 — Prostate (current: TRUS biopsy)
  '100004': [
    {
      id: 'S22-08871',
      date: 'Apr 12, 2022',
      diagnosis: 'Benign prostatic tissue — no malignancy. HGPIN in 1 core.',
      site: 'Prostate, bilateral',
      procedure: 'TRUS-guided 12-core biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '< 2%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: '12 core biopsies submitted by anatomical site.',
      microscopic: 'Benign prostatic glands with focal chronic prostatitis. High-grade PIN in 1 core. No invasive carcinoma.',
      comment: 'No malignancy. HGPIN in 1 core — rebiopsy recommended. PSA 5.1 ng/mL.',
      tags: ['Benign', 'HGPIN', 'No malignancy', 'Surveillance'],
      _templateId: 'prostate_needle_biopsy', _grade: 1, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['399068003'],
    },
  ],

  // Susan Taylor — MRN 100005 — Breast DCIS (current: wire-localised lumpectomy)
  '100005': [
    {
      id: 'S23-31102',
      date: 'Nov 14, 2023',
      diagnosis: 'DCIS — intermediate nuclear grade, cribriform pattern — stereotactic biopsy',
      site: 'Right breast, upper outer quadrant — microcalcifications',
      procedure: 'Stereotactic vacuum-assisted biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'ER+ (85%), PR+ (60%), HER2−', ki67: '12%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Multiple vacuum-assisted biopsy cores aggregating 2.8 cm.',
      microscopic: 'DCIS, intermediate nuclear grade, cribriform and micropapillary patterns, with calcifications. No invasive carcinoma.',
      comment: 'DCIS confirmed. ER/PR positive. Wire-localised excision recommended.',
      tags: ['DCIS', 'Intermediate grade', 'ER+', 'Cribriform', 'Pre-excision biopsy'],
      _templateId: 'breast_dcis_resection', _grade: 2, _erPositive: true, _her2Positive: false,
      _snomedMorphology: ['413448000', '397201007'],
    },
  ],

  // Carol Davis — MRN 100008 — Breast bilateral mastectomy (BRCA1)
  '100008': [
    {
      id: 'S24-19034',
      date: 'Jan 22, 2024',
      diagnosis: 'Invasive NST carcinoma, Grade III, right breast — core biopsy',
      site: 'Right breast, 10 o\'clock, 2.1 cm mass',
      procedure: 'Ultrasound-guided core needle biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'ER− PR− HER2 2+ (equivocal)', ki67: '68%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Four core biopsies each 1.6 cm.',
      microscopic: 'High grade invasive carcinoma of no special type. Marked nuclear pleomorphism, frequent mitoses. Nottingham grade 3.',
      comment: 'High grade triple-negative-like breast carcinoma. BRCA1 germline testing recommended.',
      tags: ['Grade III', 'ER−', 'HER2 equivocal', 'BRCA1 testing', 'High Ki-67'],
      _templateId: 'breast_invasive', _grade: 3, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['413448000', '254838004'],
    },
  ],

  // Ruth Anderson — MRN 100006 — Breast core biopsy
  '100006': [
    {
      id: 'S24-22341',
      date: 'Sep 5, 2024',
      diagnosis: 'Fibrocystic changes with apocrine metaplasia — no atypia',
      site: 'Left breast, 9 o\'clock position',
      procedure: 'Ultrasound-guided core needle biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '< 3%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Three core biopsies each 1.2 cm. Submitted entirely.',
      microscopic: 'Fibrocystic changes with apocrine metaplasia and mild adenosis. No atypia. No malignancy.',
      comment: 'Benign fibrocystic changes. Clinical and imaging follow-up recommended.',
      tags: ['Benign', 'Fibrocystic', 'No atypia', 'Surveillance'],
      _templateId: 'breast_invasive', _grade: 1, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['413448000'],
    },
  ],

  // Michael Chen — MRN 100007 — Colorectal (current: anterior resection)
  '100007': [
    {
      id: 'S24-16782',
      date: 'Jul 14, 2024',
      diagnosis: 'Rectal adenocarcinoma — staging biopsy, moderately differentiated',
      site: 'Rectum, 8 cm from anal verge',
      procedure: 'Flexible sigmoidoscopy biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '48%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Four fragments of rectal mucosa 0.3–0.6 cm. Submitted entirely.',
      microscopic: 'Moderately differentiated adenocarcinoma infiltrating the submucosa. No lymphovascular invasion in the biopsy.',
      comment: 'Rectal adenocarcinoma confirmed. CT staging: mrT3N1. Referred for neoadjuvant chemoradiotherapy.',
      tags: ['Rectal adenocarcinoma', 'Grade 2', 'Staging biopsy', 'Pre-treatment'],
      _templateId: 'colon_resection', _grade: 2, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['363346000', '413448000'],
    },
    {
      id: 'S21-09234',
      date: 'Mar 22, 2021',
      diagnosis: 'Tubulovillous adenoma with low grade dysplasia',
      site: 'Sigmoid colon',
      procedure: 'Colonoscopic polypectomy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '< 20%', margins: 'Clear', nodes: 'Not sampled',
      gross: 'Pedunculated polyp 1.8 cm. Submitted entirely.',
      microscopic: 'Tubulovillous adenoma (villous component 25%) with low grade dysplasia. Stalk margin clear.',
      comment: 'Completely excised. 3-year surveillance recommended.',
      tags: ['Tubulovillous adenoma', 'Low grade', 'Complete excision'],
      _templateId: 'colon_resection', _grade: 1, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['413448009'],
    },
  ],

  // Beatrice Holloway — MRN 100009 — Breast lumpectomy
  '100009': [
    {
      id: 'S25-41102',
      date: 'Feb 8, 2025',
      diagnosis: 'Invasive lobular carcinoma, Grade I — core biopsy',
      site: 'Left breast, upper outer quadrant',
      procedure: 'Ultrasound-guided core needle biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'ER+ (100%), PR+ (85%), HER2−', ki67: '6%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Three core biopsies each 1.3 cm. Submitted entirely.',
      microscopic: 'Invasive lobular carcinoma, classic type, single file pattern. Nottingham grade 1. E-cadherin negative.',
      comment: 'ER/PR strongly positive, HER2 negative. Low Ki-67. Excellent hormone receptor profile. Wire-localised lumpectomy planned.',
      tags: ['Invasive lobular', 'Grade I', 'ER+', 'PR+', 'HER2−', 'Low Ki-67'],
      _templateId: 'breast_invasive', _grade: 1, _erPositive: true, _her2Positive: false,
      _snomedMorphology: ['413448002', '254838004'],
    },
  ],

  // Margaret Foster — MRN 100011 — Breast core biopsy
  '100011': [
    {
      id: 'S25-38871',
      date: 'Dec 3, 2025',
      diagnosis: 'Invasive ductal carcinoma, Grade III — core biopsy',
      site: 'Right breast, upper inner quadrant',
      procedure: 'Ultrasound-guided core needle biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'ER− PR− HER2 3+ (positive)', ki67: '72%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: 'Four core biopsies each 1.5 cm. Submitted entirely.',
      microscopic: 'High grade invasive ductal carcinoma, Nottingham grade 3. Marked pleomorphism, brisk mitotic activity.',
      comment: 'HER2-positive, hormone receptor-negative. HER2 FISH confirmed amplified. Anti-HER2 therapy eligible.',
      tags: ['Grade III', 'ER−', 'HER2+', 'High Ki-67', 'Anti-HER2 eligible'],
      _templateId: 'breast_invasive', _grade: 3, _erPositive: false, _her2Positive: true,
      _snomedMorphology: ['413448000', '254838004'],
    },
  ],

  // Harold Bennett — MRN 100012 — Prostate biopsy
  '100012': [
    {
      id: 'S20-14432',
      date: 'Aug 19, 2020',
      diagnosis: 'Benign prostatic tissue — no malignancy',
      site: 'Prostate, bilateral',
      procedure: 'TRUS-guided 12-core biopsy',
      physician: 'Dr. S. Johnson',
      receptors: 'N/A', ki67: '< 1%', margins: 'N/A (biopsy)', nodes: 'Not sampled',
      gross: '12 core biopsies submitted by anatomical site.',
      microscopic: 'Benign prostatic glands with focal benign prostatic hyperplasia. No PIN. No invasive carcinoma.',
      comment: 'No malignancy. PSA 4.2 ng/mL. Annual PSA surveillance recommended.',
      tags: ['Benign', 'BPH', 'No malignancy', 'Surveillance'],
      _templateId: 'prostate_needle_biopsy', _grade: 1, _erPositive: false, _her2Positive: false,
      _snomedMorphology: ['399068003'],
    },
  ],

  // ── Grace Thompson — MRN 100001 (existing entry) ──────────────────────────
  '100001': [
    {
      id: 'S24-04821',
      date: 'Mar 14, 2024',
      diagnosis: 'Invasive Ductal Carcinoma, Grade II',
      site: 'Right breast, upper outer quadrant',
      procedure: 'Core needle biopsy',
      physician: 'Dr. A. Patel',
      receptors: 'ER+ (95%), PR+ (80%), HER2−',
      ki67: '18%',
      margins: 'N/A (biopsy)',
      nodes: 'Not sampled',
      gross: 'Core needle biopsy, 3 cores each 1.4 cm in length. Tan-white firm tissue submitted in entirety.',
      microscopic: 'Sections show invasive carcinoma of ductal type arranged in nests and cords with moderate nuclear pleomorphism. Mitotic rate 8/10 HPF. No lymphovascular invasion identified.',
      comment: 'Morphology and IHC profile consistent with invasive ductal carcinoma, Grade II (Nottingham score 6). Recommend correlation with clinical and imaging findings.',
      tags: ['ER+', 'PR+', 'HER2−', 'Grade II', 'Core biopsy'],
      _templateId: 'breast_invasive', _grade: 2, _erPositive: true, _her2Positive: false,
      _snomedMorphology: ['413448000', '254838004'],
    },
    {
      id: 'S23-17340',
      date: 'Oct 3, 2023',
      diagnosis: 'Atypical Ductal Hyperplasia',
      site: 'Left breast, 2 o\'clock position',
      procedure: 'Excisional biopsy',
      physician: 'Dr. T. Nguyen',
      receptors: 'N/A',
      ki67: '< 5%',
      margins: 'Clear (> 2 mm)',
      nodes: 'Not sampled',
      gross: 'Excisional biopsy specimen 2.8 × 1.9 × 1.2 cm. Grey-white fibrous tissue with a small firm nodule centrally.',
      microscopic: 'Sections reveal ductal proliferation with architectural atypia involving fewer than 2 complete duct spaces. Features fall short of DCIS quantitatively. No invasive carcinoma identified.',
      comment: 'Atypical ductal hyperplasia. Excision with clear margins. Recommend 6-month surveillance imaging and high-risk clinical assessment.',
      tags: ['ADH', 'Excision', 'Clear margins', 'Surveillance'],
      _templateId: 'breast_dcis_resection', _grade: 1, _erPositive: true, _her2Positive: false,
    },
    {
      id: 'S22-02190',
      date: 'Feb 9, 2022',
      diagnosis: 'Fibroadenoma, Benign',
      site: 'Right breast, 10 o\'clock position',
      procedure: 'Fine needle aspiration',
      physician: 'Dr. J. Kim',
      receptors: 'N/A',
      ki67: '< 2%',
      margins: 'N/A (FNA)',
      nodes: 'Not sampled',
      gross: 'Fine needle aspirate submitted in CytoLyt fixative. Adequate cellularity on review.',
      microscopic: 'Smears show cohesive sheets of benign ductal epithelial cells with bipolar bare nuclei in a clean background. Features consistent with fibroadenoma.',
      comment: 'Benign fibroepithelial lesion consistent with fibroadenoma. No malignant cells identified. Clinical correlation recommended.',
      tags: ['Benign', 'Fibroadenoma', 'FNA', 'No atypia'],
      _templateId: 'breast_invasive', _grade: 1, _erPositive: false, _her2Positive: false,
    },
    {
      id: 'S20-08855',
      date: 'Jun 22, 2020',
      diagnosis: 'Fibrocystic Changes, No Atypia',
      site: 'Bilateral',
      procedure: 'Core biopsy',
      physician: 'Dr. A. Patel',
      receptors: 'N/A',
      ki67: 'N/A',
      margins: 'N/A',
      nodes: 'Not sampled',
      gross: 'Bilateral core biopsies submitted in formalin. Grey-tan fibrous tissue.',
      microscopic: 'Sections show fibrocystic changes with apocrine metaplasia, adenosis, and mild ductal hyperplasia of usual type. No atypia. No malignancy identified.',
      comment: 'Benign fibrocystic changes bilaterally. Routine screening follow-up recommended.',
      tags: ['Benign', 'Fibrocystic', 'No atypia', 'Bilateral'],
      _templateId: 'breast_invasive', _grade: 1, _erPositive: false, _her2Positive: false,
    },
  ],
};

// ─── AI Similar Case Matching ─────────────────────────────────────────────────
// In production this calls callAi() with the patient's history as context and
// the case corpus as the search space. In mock/dev mode we score deterministically
// by comparing synoptic answers against the patient's most recent malignant case.

export interface AiMatchedCase {
  caseId: string;
  accession: string;
  patientInitials: string;
  date: string;
  diagnosis: string;
  site: string;
  procedure: string;
  receptors: string;
  ki67: string;
  matchPct: number;
  matchReason: string;
  // Full report fields for detail view
  physician: string;
  margins: string;
  nodes: string;
  gross: string;
  microscopic: string;
  ancillaryStudies: string;
  tags: string[];
}

/**
 * Scores a case's synoptic answers against the patient's most recent
 * malignant prior pathology entry. Returns 0–100.
 *
 * Scoring weights (must sum to 100):
 *   templateId match (same organ system)  → 30 pts
 *   grade match                            → 25 pts
 *   ER status match                        → 20 pts
 *   HER2 status match                      → 15 pts
 *   site/laterality overlap                → 10 pts
 */
function scoreCaseAgainstHistory(
  c: Case,
  anchor: PatientHistoryCase,
): number {
  const reports = c.synopticReports ?? [];
  if (reports.length === 0) return 0;

  const report = reports[0];
  const answers = report.answers ?? {};
  const ancillary = (c.diagnostic?.ancillaryStudies ?? '').toLowerCase();
  const micro = (c.diagnostic?.microscopicDescription ?? '').toLowerCase();

  let score = 0;

  // 1. SNOMED morphology match (35 pts) — most clinically specific signal
  const caseSnomedCodes = (c as any).coding?.snomed ?? [];
  if (anchor._snomedMorphology && anchor._snomedMorphology.length > 0 && caseSnomedCodes.length > 0) {
    const overlap = anchor._snomedMorphology.filter((code: string) =>
      caseSnomedCodes.includes(code)
    );
    if (overlap.length > 0) {
      score += 35; // exact morphology match
    } else {
      // Check if same organ system via templateId as fallback
      if (anchor._templateId && report.templateId === anchor._templateId) score += 10;
    }
  } else if (anchor._templateId && report.templateId === anchor._templateId) {
    score += 20; // no SNOMED — fall back to template match
  } else if (
    anchor._templateId?.startsWith('breast') &&
    report.templateId?.startsWith('breast')
  ) {
    score += 12;
  }

  // 2. Template / organ system (25 pts when SNOMED unavailable)
  if (!(anchor._snomedMorphology && anchor._snomedMorphology.length > 0)) {
    if (anchor._templateId && report.templateId === anchor._templateId) score += 25;
    else if (anchor._templateId?.startsWith('breast') && report.templateId?.startsWith('breast')) score += 15;
  }

  // 3. Grade match (20 pts)
  const rawGrade = answers['histologic_grade'] as string | undefined;
  let caseGrade: number | null = null;
  if (rawGrade) {
    if (rawGrade.includes('1') || rawGrade === 'g1') caseGrade = 1;
    else if (rawGrade.includes('2') || rawGrade === 'g2') caseGrade = 2;
    else if (rawGrade.includes('3') || rawGrade === 'g3') caseGrade = 3;
  }
  if (anchor._grade && caseGrade !== null) {
    if (caseGrade === anchor._grade) score += 20;
    else if (Math.abs(caseGrade - anchor._grade) === 1) score += 10;
  }

  // 4. ER status (10 pts)
  const erPositive =
    ancillary.includes('er: positive') || ancillary.includes('er+') ||
    micro.includes('er+') ||
    String(answers['receptor_status'] ?? '').includes('er_positive');
  if (anchor._erPositive !== undefined) {
    if (erPositive === anchor._erPositive) score += 10;
    else score += 2;
  }

  // 5. HER2 status (5 pts)
  const her2Positive =
    ancillary.includes('her2 3+') || ancillary.includes('her2: positive') ||
    ancillary.includes('her2+') || ancillary.includes('ish: amplified');
  if (anchor._her2Positive !== undefined) {
    if (her2Positive === anchor._her2Positive) score += 5;
    else score += 1;
  }

  // 6. Site / laterality (5 pts)
  const laterality = String(answers['specimen_laterality'] ?? '').toLowerCase();
  const anchorSite = anchor.site.toLowerCase();
  if (laterality && anchorSite.includes(laterality)) score += 5;
  else if (laterality === 'left' || laterality === 'right') score += 2;

  return Math.min(score, 100);
}

function buildMatchReason(c: Case, anchor: PatientHistoryCase): string {
  const reasons: string[] = [];
  const reports = c.synopticReports ?? [];
  const answers = reports[0]?.answers ?? {};
  const ancillary = (c.diagnostic?.ancillaryStudies ?? '').toLowerCase();

  // SNOMED morphology match — strongest signal
  const caseSnomedCodes = (c as any).coding?.snomed ?? [];
  if (anchor._snomedMorphology && anchor._snomedMorphology.length > 0) {
    const overlap = anchor._snomedMorphology.filter((code: string) =>
      caseSnomedCodes.includes(code)
    );
    if (overlap.length > 0) reasons.push('Matching SNOMED morphology');
  }

  if (reports[0]?.templateId === anchor._templateId) reasons.push('Same histologic type');
  else if (reports[0]?.templateId?.startsWith('breast') && anchor._templateId?.startsWith('breast')) {
    reasons.push('Same organ system');
  }

  const rawGrade = answers['histologic_grade'] as string | undefined;
  if (rawGrade) {
    const gradeNum = rawGrade.includes('1') ? 1 : rawGrade.includes('2') ? 2 : rawGrade.includes('3') ? 3 : null;
    if (gradeNum === anchor._grade) reasons.push(`Matching Grade ${gradeNum}`);
    else if (gradeNum !== null) reasons.push(`Adjacent grade (${gradeNum} vs ${anchor._grade})`);
  }

  const erPositive = ancillary.includes('er: positive') || ancillary.includes('er+');
  if (erPositive && anchor._erPositive) reasons.push('ER+ profile');
  else if (!erPositive && !anchor._erPositive) reasons.push('ER− profile');

  const her2Positive = ancillary.includes('her2 3+') || ancillary.includes('ish: amplified');
  if (her2Positive && anchor._her2Positive) reasons.push('HER2+ profile');
  else if (!her2Positive && !anchor._her2Positive) reasons.push('HER2− profile');

  return reasons.slice(0, 3).join(' · ') || 'Morphologic similarity';
}

function buildTags(c: Case, matchPct: number): string[] {
  const tags: string[] = [];
  const ancillary = (c.diagnostic?.ancillaryStudies ?? '').toLowerCase();
  const answers = c.synopticReports?.[0]?.answers ?? {};

  const rawGrade = answers['histologic_grade'] as string | undefined;
  if (rawGrade?.includes('1') || rawGrade === 'g1') tags.push('Grade I');
  else if (rawGrade?.includes('2') || rawGrade === 'g2') tags.push('Grade II');
  else if (rawGrade?.includes('3') || rawGrade === 'g3') tags.push('Grade III');

  if (ancillary.includes('er: positive') || ancillary.includes('er+')) tags.push('ER+');
  else if (ancillary.includes('er:') || ancillary.includes('er ')) tags.push('ER−');
  if (ancillary.includes('her2 3+') || ancillary.includes('ish: amplified')) tags.push('HER2+');
  else if (ancillary.includes('her2')) tags.push('HER2−');

  tags.push(`${matchPct}% match`);
  return tags;
}

/**
 * findSimilarCases — the AI matching entry point.
 *
 * In production: calls callAi() with the patient's prior pathology as context
 * and the case corpus as the search space, returns structured matches.
 *
 * In mock/dev: scores MOCK_CASES deterministically against the patient's
 * most recent malignant history entry, excludes the patient's own cases,
 * and returns the top results above a minimum threshold.
 */
export async function findSimilarCases(
  mrn: string,
  topN = 5,
  minScore = 40,
): Promise<AiMatchedCase[]> {
  await delay(600); // simulate AI latency

  const history = MOCK_PRIOR_PATHOLOGY[mrn];
  if (!history || history.length === 0) return [];

  // Use the most recent malignant case as the anchor for matching
  const anchor =
    history.find(h => h._templateId === 'breast_invasive' && (h._grade ?? 0) >= 2) ??
    history[0];

  const results: AiMatchedCase[] = [];

  for (const c of CASES) {
    // Never match the patient's own cases
    if (c.patient.mrn === mrn) continue;
    // Only match finalized or in-progress cases (not blank drafts)
    if (!c.diagnostic?.microscopicDescription || c.diagnostic.microscopicDescription === 'Pending.') continue;

    const score = scoreCaseAgainstHistory(c, anchor);
    if (score < minScore) continue;

    // Add a small deterministic jitter so scores don't cluster identically
    const jitter = (parseInt(c.id.replace(/\D/g, '').slice(-2), 10) % 5) - 2;
    const matchPct = Math.min(99, Math.max(minScore, score + jitter));

    const patientInitials =
      `${c.patient.firstName[0]}${c.patient.lastName[0]}`;

    const primaryReport = c.synopticReports?.[0];
    const answers = primaryReport?.answers ?? {};

    results.push({
      caseId: c.id,
      accession: c.accession?.fullAccession ?? c.accession?.accessionNumber ?? '',
      patientInitials,
      date: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      diagnosis: primaryReport?.templateName?.replace('CAP ', '').replace(' — Resection', '').replace(' — Needle Biopsy', '') ?? 'Unknown',
      site: String(answers['tumor_site'] ?? answers['specimen_laterality'] ?? 'Breast'),
      procedure: String(answers['procedure'] ?? 'Surgical specimen').replace(/_/g, ' '),
      receptors: (() => {
        const a = (c.diagnostic?.ancillaryStudies ?? '').toLowerCase();
        const er  = a.includes('er: positive') || a.includes('er+') ? 'ER+' : 'ER−';
        const pr  = a.includes('pr: positive') || a.includes('pr+') ? 'PR+' : 'PR−';
        const her2 = (a.includes('her2 3+') || a.includes('ish: amplified')) ? 'HER2+' : 'HER2−';
        return `${er}/${pr}, ${her2}`;
      })(),
      ki67: (() => {
        const match = (c.diagnostic?.ancillaryStudies ?? '').match(/ki-?67[:\s]+(\d+%)/i);
        return match ? match[1] : 'N/A';
      })(),
      matchPct,
      matchReason: buildMatchReason(c, anchor),
      physician: PATHOLOGIST_NAMES[c.order?.assignedTo ?? ''] ?? c.order?.assignedTo ?? 'Unknown',
      margins: String(answers['margin_status_invasive'] ?? answers['margin_status_dcis'] ?? 'See report').replace(/_/g, ' '),
      nodes: String(answers['regional_ln_status'] ?? 'See report').replace(/_/g, ' '),
      gross: c.diagnostic?.grossDescription ?? '',
      microscopic: c.diagnostic?.microscopicDescription ?? '',
      ancillaryStudies: c.diagnostic?.ancillaryStudies ?? '',
      tags: buildTags(c, matchPct),
    });
  }

  // Sort descending by matchPct, return topN
  return results
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, topN);
}

// ─── Pathologist ID → Name map ────────────────────────────────────────────────
// Matches the assignedTo IDs used in MOCK_CASES orders.
// ── Pediatric auto-routing helper ─────────────────────────────────────────────
// When a case arrives assigned to a pathologist without canViewPediatric,
// the case is flagged for admin review and moved to the pediatric pool.
export function checkPediatricRouting(
  caseRecord: any,
  clientThresholds: Record<string, number | null>,
  userPermissions: Record<string, boolean>
): { needsReroute: boolean; reason?: string } {
  const assignedTo = caseRecord?.order?.assignedTo;
  if (!assignedTo) return { needsReroute: false };
  const dob = caseRecord?.patient?.dateOfBirth;
  const clientId = caseRecord?.order?.clientId;
  const threshold = clientId ? (clientThresholds[clientId] ?? null) : null;
  if (!dob || threshold === null) return { needsReroute: false };
  const ageYrs = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  if (ageYrs >= threshold) return { needsReroute: false };
  const canView = userPermissions[assignedTo] ?? false;
  if (canView) return { needsReroute: false };
  return {
    needsReroute: true,
    reason: `Case ${caseRecord.id} — patient age ${ageYrs} is below client pediatric threshold ${threshold}. Assigned pathologist ${assignedTo} lacks Pediatric Access. Re-routing to unassigned pool and notifying admin.`
  };
}

export const mockCaseService: ICaseService = {
  async getCase(id: string): Promise<Case | undefined> {
    await delay();
    return CASES.find(c => c.id === id);
  },

  async getAll(params?) {
    const ALL_CLIENTS_MAP: Record<string,string> = {
      'c1':'Metro General','c2':'Riverside','c3':'Westside','c4':'Bayview',
      'c5':'Catherine','c6':'Manchester','c7':'Midwest','c8':'Henry Ford'
    };
    await delay();
    // Safety net: if CASES is empty, attempt re-seed from MOCK_CASES
    if (CASES.length === 0) {
      console.warn('[mockCaseService] CASES empty — re-seeding from MOCK_CASES');
      CASES.push(...MOCK_CASES.map(c => ({ ...c })));
    }
    let results = [...CASES];
    console.log('[mockCaseService.getAll] total cases:', CASES.length, '| params:', JSON.stringify(params).slice(0, 200));

    // ── Worklist-style filters ─────────────────────────────────────────────
    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      results = results.filter(c => statuses.includes((c as any).status));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(c =>
        c.accession?.fullAccession?.toLowerCase().includes(q) ||
        `${c.patient?.firstName} ${c.patient?.lastName}`.toLowerCase().includes(q)
      );
    }
    if (params?.specialty) {
      results = results.filter(c => (c as any).specialty === params.specialty);
    }

    // ── SearchPage CaseFilterParams ────────────────────────────────────────
    if (params?.statusList?.length) {
      const sl = (params.statusList as string[]).map((s: string) => s.toLowerCase());
      results = results.filter(c => sl.includes(((c as any).status ?? '').toLowerCase()));
    }
    if (params?.priorityList?.length) {
      const pl = (params.priorityList as string[]).map((s: string) => s.toLowerCase());
      results = results.filter(c => {
        const priority = ((c as any).priority ?? 'routine').toLowerCase();
        return pl.some((p: string) => priority.includes(p.toLowerCase()));
      });
    }
    if (params?.dateFrom || params?.dateTo) {
      const from = params?.dateFrom ? new Date(params.dateFrom as string).getTime() : 0;
      const to   = params?.dateTo   ? new Date(params.dateTo as string).getTime() + 86400000 : Infinity;
      results = results.filter(c => {
        // Use first specimen receivedAt as the case accession date
        const specimens = (c as any).specimens ?? [];
        const raw = specimens[0]?.receivedAt ?? specimens[0]?.collectedAt ?? (c as any).createdAt ?? '';
        const d = raw ? new Date(raw).getTime() : NaN;
        if (isNaN(d)) return true; // don't exclude cases with no date
        return d >= from && d <= to;
      });
    }
    if (params?.patientName) {
      const q = (params.patientName as string).toLowerCase();
      results = results.filter(c =>
        `${c.patient?.firstName} ${c.patient?.lastName}`.toLowerCase().includes(q)
      );
    }
    if (params?.accessionNo) {
      const q = (params.accessionNo as string).toLowerCase();
      results = results.filter(c =>
        c.accession?.fullAccession?.toLowerCase().includes(q)
      );
    }
    if (params?.genderList?.length) {
      // Normalise both sides so 'M'|'male'|'Male' all resolve to 'male',
      // 'F'|'female'|'Female' to 'female', etc.
      // Case data stores single-letter codes ('M','F'); SearchPage sends full words ('Male','Female').
      const toFull = (s: string): string => {
        const l = s.toLowerCase();
        if (l === 'm' || l === 'male')       return 'male';
        if (l === 'f' || l === 'female')     return 'female';
        if (l === 'x' || l === 'non-binary') return 'non-binary';
        if (l === 'u' || l === 'unknown')    return 'unknown';
        if (l === 'o' || l === 'other')      return 'other';
        return l;
      };
      const gl = (params.genderList as string[]).map(toFull);
      // Use c.patient.sex (the actual field) — NOT c.patient.gender (does not exist)
      results = results.filter(c => gl.includes(toFull(c.patient?.sex ?? '')));
    }

    // Age range — no stored 'age' field; compute from patient.dateOfBirth at query time
    if (params?.ageMin !== undefined || params?.ageMax !== undefined) {
      const minAge = params.ageMin ?? 0;
      const maxAge = params.ageMax ?? 150;
      const now = new Date();
      results = results.filter(c => {
        const dob = c.patient?.dateOfBirth;
        if (!dob) return true; // don't exclude cases with no DOB on record
        const birth = new Date(dob);
        const age =
          now.getFullYear() - birth.getFullYear() -
          (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        return age >= minAge && age <= maxAge;
      });
    }

    // DOB date range (separate from accession dateFrom/dateTo)
    if (params?.dobFrom || params?.dobTo) {
      const from = params.dobFrom ? new Date(params.dobFrom as string).getTime() : 0;
      const to   = params.dobTo   ? new Date(params.dobTo   as string).getTime() + 86_400_000 : Infinity;
      results = results.filter(c => {
        const dob = c.patient?.dateOfBirth;
        if (!dob) return true;
        const d = new Date(dob).getTime();
        return !isNaN(d) && d >= from && d <= to;
      });
    }
    if (params?.specimenList?.length) {
      const sl = params.specimenList as string[];
      results = results.filter(c =>
        (c.specimens ?? []).some((sp: any) =>
          sl.some((s: string) => (sp.description ?? sp.label ?? '').toLowerCase().includes(s.toLowerCase()))
        )
      );
    }
    if (params?.diagnosisList?.length) {
      const dl = params.diagnosisList as string[];
      results = results.filter(c =>
        dl.some((d: string) =>
          ((c as any).diagnosis ?? '').toLowerCase().includes(d.toLowerCase()) ||
          ((c as any).microscopicDescription ?? '').toLowerCase().includes(d.toLowerCase())
        )
      );
    }
    if (params?.pathologistIds?.length) {
      const ids = params.pathologistIds as string[];
      results = results.filter(c => ids.includes(c.order?.assignedTo ?? ''));
    }
    if (params?.synopticProtocolIds?.length) {
      // SearchPage passes resolved templateIds (e.g. 'breast_invasive'), not the UI p01 keys.
      // Match against synopticReports[].templateId — specimens never had a synopticTemplateId field.
      const ids = (params.synopticProtocolIds as string[]).map((s: string) => s.toLowerCase());
      results = results.filter(c =>
        ((c as any).synopticReports ?? []).some((sr: any) => {
          const t = (sr.templateId ?? '').toLowerCase();
          // Exact match OR common-prefix match (lung_adeno ↔ lung_resection, melanoma_resection ↔ skin_melanoma_bx)
          return ids.some((id: string) => t === id || t.startsWith(id.replace(/_[^_]+$/, '_')));
        })
      );
    }
    if (params?.flagIds?.length) {
      // SearchPage sends flag display names (e.g. 'STAT — Rush Processing'), not ID keys.
      // Use case-insensitive name-contains so 'STAT' matches 'STAT — Rush Processing'.
      const search = (params.flagIds as string[]).map((s: string) => s.toLowerCase());
      results = results.filter(c =>
        ((c as any).caseFlags ?? []).some((f: any) =>
          search.some((s: string) =>
            (f.name ?? '').toLowerCase().includes(s) || s.includes((f.name ?? '').toLowerCase())
          )
        )
      );
    }

    if (params?.clientIds?.length) {
      const ids = params.clientIds as string[];
      results = results.filter(c =>
        ids.includes((c as any).order?.clientId ?? '') ||
        ids.some((id: string) => (c as any).order?.clientName?.toLowerCase().includes(
          ALL_CLIENTS_MAP[id]?.toLowerCase() ?? ''
        ))
      );
    }

    // SNOMED CT — SearchPage now passes s.code (e.g. '413448000'); match c.coding.snomed[]
    if ((params as any)?.snomedCodes?.length) {
      const codes: string[] = (params as any).snomedCodes;
      results = results.filter(c => {
        const caseCodes: string[] = (c as any).coding?.snomed ?? [];
        return codes.some((code: string) => caseCodes.includes(code));
      });
    }

    // ICD-10/11 — SearchPage now passes s.code (e.g. 'C50.412'); match c.coding.icd10[]
    if ((params as any)?.icdCodes?.length) {
      const codes: string[] = (params as any).icdCodes;
      results = results.filter(c => {
        const caseCodes: string[] = (c as any).coding?.icd10 ?? [];
        // Trim trailing sub-category so 'C50' matches 'C50.412'
        return codes.some((code: string) =>
          caseCodes.some((cc: string) => cc.startsWith(code) || code.startsWith(cc))
        );
      });
    }

    // Attending / Requesting Provider — SearchPage maps attendingId → full name before passing
    if ((params as any)?.attendingNames?.length) {
      const strip = (s: string) => s.toLowerCase().replace(/^(dr\.|mr\.|ms\.|mrs\.)\s*/i, '').trim();
      const names: string[] = ((params as any).attendingNames as string[]).map(strip);
      results = results.filter(c => {
        const prov = strip(c.order?.requestingProvider ?? '');
        return names.some((n: string) => prov.includes(n) || n.includes(prov));
      });
    }

    return { ok: true, data: results as any[] };
  },

  async listCasesForUser(userId: string): Promise<Case[]> {
    await delay();
    if (!userId || userId === 'all' || userId === 'current') return CASES;

    const USER_HOSPITAL_MAP: Record<string, string> = {
      'PATH-001':    'HOSP-001',
      'PATH-UK-001': 'HOSP-MFT',
      'PATH-UK-002': 'HOSP-MFT',
      'PATH-US-001': 'HOSP-MPA',
      'PATH-US-002': 'HOSP-HFHS',
      'PATH-RB-001': 'HOSP-001',   // Rossana Babakhani
    };

    const userHospital = USER_HOSPITAL_MAP[userId];

    return CASES.filter(c => {
      // Directly assigned to this user (pediatric cases stay assigned — shown redacted in WorklistTable)
      if (c.order?.assignedTo === userId) return true;
      // Pool cases from the same institution
      if ((c as any).status === 'pool' && userHospital && c.originHospitalId === userHospital) return true;
      return false;
    });
  },

  async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
    await delay();
    const index = CASES.findIndex(c => c.id === caseId);
    if (index !== -1) {
      CASES[index] = { ...CASES[index], ...updates, updatedAt: new Date().toISOString() };
      storageSet(STORAGE_KEY, CASES);
    }
  },
};
