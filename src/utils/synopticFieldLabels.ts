// src/utils/synopticFieldLabels.ts
// ─────────────────────────────────────────────────────────────────────────────
// Human-readable labels for synoptic answer field IDs across reporting
// standards (CAP, RCPath, RCPA, WHO).
//
// AUTO-GENERATED + MAINTAINED via: node scripts/generate-field-labels.cjs
// Manual overrides per standard can be added to STANDARD_OVERRIDES below.
// ─────────────────────────────────────────────────────────────────────────────

export type ReportingStandard = 'CAP' | 'RCPath' | 'RCPA' | 'WHO' | 'generic';

// ── Universal field labels (standard-neutral) ─────────────────────────────────
const UNIVERSAL_LABELS: Record<string, string> = {

  // Procedure / specimen
  procedure:                    'Procedure',
  specimen_site:                'Specimen Site',
  laterality:                   'Laterality',
  specimen_integrity:           'Specimen Integrity',
  specimen_type:                'Specimen Type',
  specimen_weight:              'Specimen Weight (g)',
  specimen_dimensions:          'Specimen Dimensions (cm)',

  // Tumour
  tumour_site:                  'Tumour Site',
  tumour_size:                  'Tumour Size (mm)',
  tumour_focality:              'Tumour Focality',
  histologic_type:              'Histologic Type',
  histological_type:            'Histological Type',
  histologic_grade:             'Histologic Grade',
  nottingham_grade:             'Nottingham Grade',
  nuclear_grade:                'Nuclear Grade',
  tubule_formation:             'Tubule Formation Score',
  nuclear_pleomorphism:         'Nuclear Pleomorphism Score',
  mitotic_count:                'Mitotic Count Score',
  mitotic_rate:                 'Mitotic Rate (per 10 HPF)',

  // Margins
  margin_status:                'Margin Status',
  deep_margin:                  'Deep Margin',
  superficial_margin:           'Superficial Margin',
  radial_margin:                'Radial Margin',
  proximal_margin:              'Proximal Margin',
  distal_margin:                'Distal Margin',
  margin_distance:              'Distance to Closest Margin (mm)',

  // Lymphovascular
  lymphovascular_invasion:      'Lymphovascular Invasion',
  lvi:                          'Lymphovascular Invasion',
  perineural_invasion:          'Perineural Invasion',
  lymphatic_invasion:           'Lymphatic Invasion',
  venous_invasion:              'Venous Invasion',

  // Lymph nodes
  lymph_nodes_examined:         'Lymph Nodes Examined',
  lymph_nodes_positive:         'Lymph Nodes with Metastasis',
  sentinel_nodes_examined:      'Sentinel Nodes Examined',
  sentinel_nodes_positive:      'Sentinel Nodes Positive',
  largest_metastasis:           'Largest Metastasis (mm)',
  extranodal_extension:         'Extranodal Extension',

  // TNM staging
  pt:                           'pT',
  pn:                           'pN',
  pm:                           'pM',
  pathologic_stage:             'Pathologic Stage',
  tnm_edition:                  'TNM Edition',

  // Breast
  clock_position:               'Clock Position',
  distance_nipple:              'Distance from Nipple',
  distance_nipple_cm:           'Distance from Nipple (cm)',
  er_status:                    'ER Status',
  er_allred:                    'ER Allred Score',
  pr_status:                    'PR Status',
  pr_allred:                    'PR Allred Score',
  her2_status:                  'HER2 Status',
  her2_fish:                    'HER2 ISH Result',
  ki67:                         'Ki-67 (%)',
  dcis_grade:                   'DCIS Nuclear Grade',
  dcis_architecture:            'DCIS Architecture',
  dcis_necrosis:                'DCIS Necrosis',
  extensive_intraductal:        'Extensive Intraductal Component',
  skin_involvement:             'Skin Involvement',
  nipple_involvement:           'Nipple Involvement',
  chest_wall_involvement:       'Chest Wall Involvement',
  birads:                       'BIRADS Category',
  microcalcification:           'Microcalcification',

  // Colorectal / polyp
  anatomic_site:                'Anatomic Site',
  anatomic_location:            'Anatomic Location',
  polyp_size:                   'Polyp Size (mm)',
  polyp_type:                   'Polyp Configuration',
  polyp_configuration:          'Polyp Configuration',
  dysplasia_grade:              'Grade of Dysplasia',
  villous_component:            'Villous Component (%)',
  high_grade_dysplasia:         'High-Grade Dysplasia',
  carcinoma:                    'Invasive Carcinoma',
  stalk_involvement:            'Stalk Involvement',
  haggitt_level:                'Haggitt Level',
  depth_of_invasion:            'Depth of Invasion (mm)',
  mismatch_repair:              'Mismatch Repair Status',
  mmr_status:                   'MMR Status',
  microsatellite:               'Microsatellite Instability',
  kras_mutation:                'KRAS Mutation',
  braf_mutation:                'BRAF Mutation',
  treatment_response:           'Treatment Response',
  tumour_regression:            'Tumour Regression Grade',

  // Prostate
  gleason_primary:              'Gleason Grade — Primary Pattern',
  gleason_secondary:            'Gleason Grade — Secondary Pattern',
  gleason_score:                'Gleason Score',
  grade_group:                  'Grade Group (ISUP)',
  percentage_involvement:       'Core Involvement (%)',
  seminal_vesicle:              'Seminal Vesicle Invasion',
  extraprostatic_extension:     'Extraprostatic Extension',
  psa:                          'Pre-operative PSA (ng/mL)',

  // Skin / melanoma
  breslow_thickness:            'Breslow Thickness (mm)',
  clark_level:                  'Clark Level',
  ulceration:                   'Ulceration',
  mitotic_index:                'Mitotic Index (per mm²)',
  regression:                   'Regression',
  satellites:                   'Satellite Lesions',
  in_situ_component:            'In Situ Component',

  // Thyroid
  capsule_invasion:             'Capsular Invasion',
  vascular_invasion:            'Vascular Invasion',
  extrathyroidal_extension:     'Extrathyroidal Extension',
  number_of_foci:               'Number of Tumour Foci',

  // Lung
  pleural_invasion:             'Pleural Invasion',
  bronchial_margin:             'Bronchial Margin',
  spread_through_airspaces:     'Spread Through Air Spaces (STAS)',
  egfr_status:                  'EGFR Mutation',
  alk_status:                   'ALK Rearrangement',
  pdl1:                         'PD-L1 Expression (%)',

  // Gynaecological
  myometrial_invasion:          'Myometrial Invasion',
  myometrial_depth:             'Myometrial Invasion Depth (mm)',
  cervical_involvement:         'Cervical Stromal Involvement',
  adnexal_involvement:          'Adnexal Involvement',
  peritoneal_cytology:          'Peritoneal Cytology',
  figo_stage:                   'FIGO Stage',

  // Ancillary
  ihc_panel:                    'IHC Panel',
  molecular_testing:            'Molecular Testing',
  fish_result:                  'ISH/FISH Result',
  msi_status:                   'MSI Status',
  tmb:                          'Tumour Mutational Burden',

  // Administrative
  fixative:                     'Fixative',
  fixation_time:                'Fixation Time (hours)',
  clinical_history:             'Clinical History',
  intraoperative_consultation:  'Intraoperative Consultation',
  comment:                      'Comment',
  additional_findings:          'Additional Pathological Findings',
};

// ── Standard-specific overrides ───────────────────────────────────────────────
// Only entries that DIFFER from the universal label need to be listed here.
const STANDARD_OVERRIDES: Partial<Record<ReportingStandard, Record<string, string>>> = {

  RCPath: {
    histologic_type:             'Histological Type',
    histologic_grade:            'Histological Grade',
    nottingham_grade:            'Nottingham Histological Grade',
    mitotic_rate:                'Mitotic Count (per 10 HPF)',
    lymphovascular_invasion:     'Lymphovascular Invasion',
    her2_fish:                   'HER2 ISH Result',
    ki67:                        'Ki-67 Labelling Index (%)',
    dcis_grade:                  'DCIS Nuclear Grade',
    depth_of_invasion:           'Depth of Invasion',
    grade_group:                 'Gleason Grade Group',
    spread_through_airspaces:    'Aerogenous Spread (STAS)',
    pt:                          'pT — Pathological Tumour Stage',
    pn:                          'pN — Pathological Nodal Stage',
  },

  RCPA: {
    histologic_type:             'Histological Type',
    histologic_grade:            'Histological Grade',
    nottingham_grade:            'Nottingham Histological Grade',
    ki67:                        'Ki-67 Index (%)',
  },

  WHO: {
    histologic_type:             'Histological Classification',
    histologic_grade:            'WHO Grade',
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the human-readable label for a synoptic field ID.
 * Applies standard-specific terminology where it differs from the universal label.
 * Falls back to title-casing the field ID if not found in any dictionary.
 *
 * @param fieldId   - The synoptic answer key (e.g. 'histologic_type')
 * @param standard  - Reporting standard (CAP | RCPath | RCPA | WHO | generic)
 */
export function getFieldLabel(fieldId: string, standard: ReportingStandard = 'generic'): string {
  return STANDARD_OVERRIDES[standard]?.[fieldId]
    ?? UNIVERSAL_LABELS[fieldId]
    ?? fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/** Convenience export — full merged dictionary for a given standard */
export function getFieldLabels(standard: ReportingStandard = 'generic'): Record<string, string> {
  return { ...UNIVERSAL_LABELS, ...(STANDARD_OVERRIDES[standard] ?? {}) };
}

// Legacy named export — kept for backwards compatibility
export const CAP_FIELD_LABELS = UNIVERSAL_LABELS;
