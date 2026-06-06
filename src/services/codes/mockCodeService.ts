/**
 * mockCodeService.ts — src/services/codes/mockCodeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * In-memory implementation of ICodeService using curated seed data.
 * Used in development and demo environments — no Firestore dependency.
 *
 * Seed data covers a pathology-relevant subset of each system:
 *   SNOMED CT  — 24 concepts (oncology, morphology, pre-malignant)
 *   ICD-10     — 21 codes (oncology-relevant, jurisdiction 'ALL' for mock)
 *   ICD-11     — 12 codes (oncology chapter subset)
 *   ICD-O      — 20 topography + 20 morphology codes
 *
 * In production, firestoreCodeService.ts replaces this entirely.
 * Switch the export in services/index.ts — no component changes needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ServiceResult }                              from '../types';
import type { ClinicalCode, CodeSearchParams, CodeSystem,
              IcdOSubtype, ICodeService }                  from './ICodeService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok    = <T>(data: T): ServiceResult<T>    => ({ ok: true,  data });
const err   = <T>(e: string): ServiceResult<T>  => ({ ok: false, error: e });
const delay = ()                                => new Promise(r => setTimeout(r, 60));

// ─── Seed data ────────────────────────────────────────────────────────────────
// jurisdiction: 'ALL' in mock data — the firestoreCodeService will filter by
// the institution's actual jurisdiction using the SystemConfig value.

// ── SNOMED CT ─────────────────────────────────────────────────────────────────
// Organised by the "Big Four" pathology axes:
//   Morphology    — the pathological change
//   Body Structure — the anatomical origin
//   Procedure     — the diagnostic act
//   Specimen      — the physical entity received
// category field = "Axis | Subgroup" for two-level grouping in the UI

const SNOMED: ClinicalCode[] = [

  // ── Morphology ──────────────────────────────────────────────────────────────
  // Malignant Epithelial
  { code:'413448000', display:'Adenocarcinoma',                        system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'413449008', display:'Squamous Cell Carcinoma',               system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'413450008', display:'Transitional Cell Carcinoma',           system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'254637007', display:'Non-small Cell Lung Carcinoma',         system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'413448001', display:'Small Cell Carcinoma',                  system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'399068003', display:'Prostatic Adenocarcinoma',              system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'254838004', display:'Invasive Ductal Carcinoma of Breast',   system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'413448002', display:'Lobular Carcinoma of Breast',           system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'372087000', display:'Primary Malignant Neoplasm',            system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  { code:'276796000', display:'Metastatic Malignant Neoplasm',         system:'SNOMED', category:'Morphology|Malignant Epithelial',  jurisdiction:'ALL', active:true },
  // Malignant Melanocytic
  { code:'372244006', display:'Malignant Melanoma of Skin',            system:'SNOMED', category:'Morphology|Melanocytic',           jurisdiction:'ALL', active:true },
  { code:'309843006', display:'Melanoma',                              system:'SNOMED', category:'Morphology|Melanocytic',           jurisdiction:'ALL', active:true },
  // Haematological
  { code:'404000003', display:'Lymphoma',                              system:'SNOMED', category:'Morphology|Haematological',        jurisdiction:'ALL', active:true },
  { code:'413448003', display:'Diffuse Large B-Cell Lymphoma',         system:'SNOMED', category:'Morphology|Haematological',        jurisdiction:'ALL', active:true },
  { code:'413448004', display:'Follicular Lymphoma',                   system:'SNOMED', category:'Morphology|Haematological',        jurisdiction:'ALL', active:true },
  { code:'91861009',  display:'Leukaemia',                             system:'SNOMED', category:'Morphology|Haematological',        jurisdiction:'ALL', active:true },
  { code:'413448005', display:'Myeloma',                               system:'SNOMED', category:'Morphology|Haematological',        jurisdiction:'ALL', active:true },
  // CNS
  { code:'302456005', display:'Glioblastoma Multiforme',               system:'SNOMED', category:'Morphology|CNS',                  jurisdiction:'ALL', active:true },
  { code:'413448006', display:'Meningioma',                            system:'SNOMED', category:'Morphology|CNS',                  jurisdiction:'ALL', active:true },
  // Mesenchymal
  { code:'302555009', display:'Sarcoma',                               system:'SNOMED', category:'Morphology|Mesenchymal',          jurisdiction:'ALL', active:true },
  { code:'413448007', display:'Gastrointestinal Stromal Tumour',       system:'SNOMED', category:'Morphology|Mesenchymal',          jurisdiction:'ALL', active:true },
  { code:'413448008', display:'Leiomyosarcoma',                        system:'SNOMED', category:'Morphology|Mesenchymal',          jurisdiction:'ALL', active:true },
  // Pre-Malignant
  { code:'400010006', display:'Carcinoma In Situ',                     system:'SNOMED', category:'Morphology|Pre-Malignant',        jurisdiction:'ALL', active:true },
  { code:'413448009', display:'High Grade Dysplasia',                  system:'SNOMED', category:'Morphology|Pre-Malignant',        jurisdiction:'ALL', active:true },
  { code:'55637ooo1', display:'Low Grade Dysplasia',                   system:'SNOMED', category:'Morphology|Pre-Malignant',        jurisdiction:'ALL', active:true },
  { code:'67101o001', display:'Adenoma',                               system:'SNOMED', category:'Morphology|Pre-Malignant',        jurisdiction:'ALL', active:true },

  // ── Body Structure ──────────────────────────────────────────────────────────
  // Breast
  { code:'80248007',  display:'Breast',                                system:'SNOMED', category:'Body Structure|Breast',           jurisdiction:'ALL', active:true },
  { code:'726672001', display:'Left Breast',                           system:'SNOMED', category:'Body Structure|Breast',           jurisdiction:'ALL', active:true },
  { code:'726673006', display:'Right Breast',                          system:'SNOMED', category:'Body Structure|Breast',           jurisdiction:'ALL', active:true },
  { code:'78067005',  display:'Upper Outer Quadrant of Breast',        system:'SNOMED', category:'Body Structure|Breast',           jurisdiction:'ALL', active:true },
  { code:'77831004',  display:'Upper Inner Quadrant of Breast',        system:'SNOMED', category:'Body Structure|Breast',           jurisdiction:'ALL', active:true },
  // Colorectal
  { code:'71854001',  display:'Colon',                                 system:'SNOMED', category:'Body Structure|Colorectal',       jurisdiction:'ALL', active:true },
  { code:'34402009',  display:'Rectum',                                system:'SNOMED', category:'Body Structure|Colorectal',       jurisdiction:'ALL', active:true },
  { code:'66754008',  display:'Appendix',                              system:'SNOMED', category:'Body Structure|Colorectal',       jurisdiction:'ALL', active:true },
  // Genitourinary
  { code:'41216001',  display:'Prostate',                              system:'SNOMED', category:'Body Structure|Genitourinary',    jurisdiction:'ALL', active:true },
  { code:'64033007',  display:'Kidney',                                system:'SNOMED', category:'Body Structure|Genitourinary',    jurisdiction:'ALL', active:true },
  { code:'89837001',  display:'Urinary Bladder',                       system:'SNOMED', category:'Body Structure|Genitourinary',    jurisdiction:'ALL', active:true },
  { code:'13648007',  display:'Ureter',                                system:'SNOMED', category:'Body Structure|Genitourinary',    jurisdiction:'ALL', active:true },
  // Gynaecological
  { code:'35039007',  display:'Uterus',                                system:'SNOMED', category:'Body Structure|Gynaecological',   jurisdiction:'ALL', active:true },
  { code:'71252005',  display:'Cervix Uteri',                          system:'SNOMED', category:'Body Structure|Gynaecological',   jurisdiction:'ALL', active:true },
  { code:'15497006',  display:'Ovary',                                 system:'SNOMED', category:'Body Structure|Gynaecological',   jurisdiction:'ALL', active:true },
  { code:'63248006',  display:'Vulva',                                 system:'SNOMED', category:'Body Structure|Gynaecological',   jurisdiction:'ALL', active:true },
  // Thoracic
  { code:'39607008',  display:'Lung',                                  system:'SNOMED', category:'Body Structure|Thoracic',         jurisdiction:'ALL', active:true },
  { code:'181216001', display:'Left Lung',                             system:'SNOMED', category:'Body Structure|Thoracic',         jurisdiction:'ALL', active:true },
  { code:'181217005', display:'Right Lung',                            system:'SNOMED', category:'Body Structure|Thoracic',         jurisdiction:'ALL', active:true },
  { code:'361355005', display:'Pleura',                                system:'SNOMED', category:'Body Structure|Thoracic',         jurisdiction:'ALL', active:true },
  // Skin
  { code:'39937001',  display:'Skin',                                  system:'SNOMED', category:'Body Structure|Skin',             jurisdiction:'ALL', active:true },
  { code:'368209003', display:'Right Upper Arm',                       system:'SNOMED', category:'Body Structure|Skin',             jurisdiction:'ALL', active:true },
  { code:'368209004', display:'Left Upper Arm',                        system:'SNOMED', category:'Body Structure|Skin',             jurisdiction:'ALL', active:true },
  // Lymph Node
  { code:'59441001',  display:'Lymph Node',                            system:'SNOMED', category:'Body Structure|Lymph Node',       jurisdiction:'ALL', active:true },
  { code:'245282001', display:'Axillary Lymph Node',                   system:'SNOMED', category:'Body Structure|Lymph Node',       jurisdiction:'ALL', active:true },
  { code:'245284000', display:'Inguinal Lymph Node',                   system:'SNOMED', category:'Body Structure|Lymph Node',       jurisdiction:'ALL', active:true },
  // Bone & Soft Tissue
  { code:'272673000', display:'Bone',                                  system:'SNOMED', category:'Body Structure|Bone & Soft Tissue', jurisdiction:'ALL', active:true },
  { code:'57188001',  display:'Soft Tissue',                           system:'SNOMED', category:'Body Structure|Bone & Soft Tissue', jurisdiction:'ALL', active:true },

  // ── Procedure ───────────────────────────────────────────────────────────────
  // Biopsy
  { code:'86273004',  display:'Biopsy',                                system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'432253001', display:'Core Needle Biopsy',                    system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'274607009', display:'Fine Needle Aspiration Biopsy',         system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'177577009', display:'Punch Biopsy of Skin',                  system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'65801008',  display:'Excision Biopsy',                       system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'274025005', display:'Incisional Biopsy',                     system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  { code:'57757007',  display:'Sentinel Lymph Node Biopsy',            system:'SNOMED', category:'Procedure|Biopsy',                jurisdiction:'ALL', active:true },
  // Resection
  { code:'65801009',  display:'Resection',                             system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'173171007', display:'Total Colectomy',                       system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'26390003',  display:'Total Nephrectomy',                     system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'173208000', display:'Radical Prostatectomy',                 system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'173171008', display:'Hemicolectomy',                         system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'45595009',  display:'Lobectomy of Lung',                     system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  { code:'59750000',  display:'Total Thyroidectomy',                   system:'SNOMED', category:'Procedure|Resection',             jurisdiction:'ALL', active:true },
  // Excision
  { code:'177067007', display:'Wide Local Excision',                   system:'SNOMED', category:'Procedure|Excision',              jurisdiction:'ALL', active:true },
  { code:'392021009', display:'Lumpectomy of Breast',                  system:'SNOMED', category:'Procedure|Excision',              jurisdiction:'ALL', active:true },
  { code:'173422009', display:'Transurethral Resection of Bladder',    system:'SNOMED', category:'Procedure|Excision',              jurisdiction:'ALL', active:true },
  // Cytology
  { code:'167141001', display:'Cytology Examination',                  system:'SNOMED', category:'Procedure|Cytology',              jurisdiction:'ALL', active:true },
  { code:'448566006', display:'Cervical Cytology',                     system:'SNOMED', category:'Procedure|Cytology',              jurisdiction:'ALL', active:true },
  { code:'168471005', display:'Sputum Cytology',                       system:'SNOMED', category:'Procedure|Cytology',              jurisdiction:'ALL', active:true },
  // Intraoperative
  { code:'83581001',  display:'Frozen Section Examination',            system:'SNOMED', category:'Procedure|Intraoperative',        jurisdiction:'ALL', active:true },
  { code:'168475001', display:'Intraoperative Consultation',           system:'SNOMED', category:'Procedure|Intraoperative',        jurisdiction:'ALL', active:true },

  // ── Specimen ─────────────────────────────────────────────────────────────────
  // Surgical
  { code:'122551003', display:'Biopsy Specimen',                       system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'119376003', display:'Tissue Specimen',                       system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'309801001', display:'Excision Specimen',                     system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'432564009', display:'Core Needle Biopsy Specimen',           system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'309795001', display:'Surgical Resection Specimen',           system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'122554006', display:'Tissue Specimen from Breast',           system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'122571007', display:'Tissue Specimen from Prostate',         system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'122575003', display:'Tissue Specimen from Lung',             system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  { code:'122579009', display:'Tissue Specimen from Colon',            system:'SNOMED', category:'Specimen|Surgical',               jurisdiction:'ALL', active:true },
  // Cytology
  { code:'119342007', display:'Saliva Specimen',                       system:'SNOMED', category:'Specimen|Cytology',               jurisdiction:'ALL', active:true },
  { code:'119350003', display:'Calculus Specimen',                     system:'SNOMED', category:'Specimen|Cytology',               jurisdiction:'ALL', active:true },
  { code:'309049001', display:'Cerebrospinal Fluid Specimen',          system:'SNOMED', category:'Specimen|Cytology',               jurisdiction:'ALL', active:true },
  { code:'119295008', display:'Aspirate Specimen',                     system:'SNOMED', category:'Specimen|Cytology',               jurisdiction:'ALL', active:true },
  { code:'119364003', display:'Serum Specimen',                        system:'SNOMED', category:'Specimen|Cytology',               jurisdiction:'ALL', active:true },
  // Smear / Scraping
  { code:'258416002', display:'Fine Needle Aspirate Specimen',         system:'SNOMED', category:'Specimen|Smear',                  jurisdiction:'ALL', active:true },
  { code:'119393003', display:'Cervical Smear Specimen',               system:'SNOMED', category:'Specimen|Smear',                  jurisdiction:'ALL', active:true },
  { code:'119394009', display:'Vaginal Smear Specimen',                system:'SNOMED', category:'Specimen|Smear',                  jurisdiction:'ALL', active:true },
];

// ── ICD-10 ────────────────────────────────────────────────────────────────────
// Mock uses 'ALL' — firestoreCodeService filters by jurisdiction-specific variant

const ICD10: ClinicalCode[] = [
  { code:'C50.9', display:'Malignant neoplasm of breast, unspecified',          system:'ICD-10', category:'Breast',          jurisdiction:'ALL', active:true },
  { code:'C50.1', display:'Malignant neoplasm of central portion of breast',    system:'ICD-10', category:'Breast',          jurisdiction:'ALL', active:true },
  { code:'C18.9', display:'Malignant neoplasm of colon, unspecified',           system:'ICD-10', category:'Colorectal',      jurisdiction:'ALL', active:true },
  { code:'C19',   display:'Malignant neoplasm of rectosigmoid junction',        system:'ICD-10', category:'Colorectal',      jurisdiction:'ALL', active:true },
  { code:'C20',   display:'Malignant neoplasm of rectum',                       system:'ICD-10', category:'Colorectal',      jurisdiction:'ALL', active:true },
  { code:'C61',   display:'Malignant neoplasm of prostate',                     system:'ICD-10', category:'Genitourinary',   jurisdiction:'ALL', active:true },
  { code:'C64',   display:'Malignant neoplasm of kidney',                       system:'ICD-10', category:'Genitourinary',   jurisdiction:'ALL', active:true },
  { code:'C67.9', display:'Malignant neoplasm of bladder, unspecified',         system:'ICD-10', category:'Genitourinary',   jurisdiction:'ALL', active:true },
  { code:'C34.9', display:'Malignant neoplasm of bronchus or lung',             system:'ICD-10', category:'Thoracic',        jurisdiction:'ALL', active:true },
  { code:'C33',   display:'Malignant neoplasm of trachea',                      system:'ICD-10', category:'Thoracic',        jurisdiction:'ALL', active:true },
  { code:'C56',   display:'Malignant neoplasm of ovary',                        system:'ICD-10', category:'Gynaecological',  jurisdiction:'ALL', active:true },
  { code:'C53.9', display:'Malignant neoplasm of cervix uteri, unspecified',    system:'ICD-10', category:'Gynaecological',  jurisdiction:'ALL', active:true },
  { code:'C54.1', display:'Malignant neoplasm of endometrium',                  system:'ICD-10', category:'Gynaecological',  jurisdiction:'ALL', active:true },
  { code:'C73',   display:'Malignant neoplasm of thyroid gland',                system:'ICD-10', category:'Endocrine',       jurisdiction:'ALL', active:true },
  { code:'C74.9', display:'Malignant neoplasm of adrenal gland, unspecified',   system:'ICD-10', category:'Endocrine',       jurisdiction:'ALL', active:true },
  { code:'C43.9', display:'Malignant melanoma of skin, unspecified',            system:'ICD-10', category:'Skin',            jurisdiction:'ALL', active:true },
  { code:'C44.9', display:'Other malignant neoplasm of skin, unspecified',      system:'ICD-10', category:'Skin',            jurisdiction:'ALL', active:true },
  { code:'C85.9', display:'Non-Hodgkin lymphoma, unspecified',                  system:'ICD-10', category:'Haematological',  jurisdiction:'ALL', active:true },
  { code:'C90.0', display:'Multiple myeloma',                                   system:'ICD-10', category:'Haematological',  jurisdiction:'ALL', active:true },
  { code:'C91.0', display:'Acute lymphoblastic leukaemia',                      system:'ICD-10', category:'Haematological',  jurisdiction:'ALL', active:true },
  { code:'C49.9', display:'Malignant neoplasm of connective and soft tissue',   system:'ICD-10', category:'Soft Tissue',     jurisdiction:'ALL', active:true },
];

// ── ICD-11 ────────────────────────────────────────────────────────────────────
// WHO ICD-11 — same codes across all jurisdictions

const ICD11: ClinicalCode[] = [
  { code:'2C10.0', display:'Adenocarcinoma of colon',                           system:'ICD-11', category:'Colorectal',      jurisdiction:'ALL', active:true },
  { code:'2C10.1', display:'Squamous cell carcinoma of colon',                  system:'ICD-11', category:'Colorectal',      jurisdiction:'ALL', active:true },
  { code:'2C61.0', display:'Adenocarcinoma of prostate',                        system:'ICD-11', category:'Genitourinary',   jurisdiction:'ALL', active:true },
  { code:'2C73.0', display:'Infiltrating duct carcinoma of breast',             system:'ICD-11', category:'Breast',          jurisdiction:'ALL', active:true },
  { code:'2C73.1', display:'Lobular carcinoma of breast',                       system:'ICD-11', category:'Breast',          jurisdiction:'ALL', active:true },
  { code:'2C25.0', display:'Adenocarcinoma of lung',                            system:'ICD-11', category:'Thoracic',        jurisdiction:'ALL', active:true },
  { code:'2C25.1', display:'Squamous cell carcinoma of lung',                   system:'ICD-11', category:'Thoracic',        jurisdiction:'ALL', active:true },
  { code:'2C25.2', display:'Small cell carcinoma of lung',                      system:'ICD-11', category:'Thoracic',        jurisdiction:'ALL', active:true },
  { code:'2B5Z',   display:'Malignant melanoma of skin',                        system:'ICD-11', category:'Skin',            jurisdiction:'ALL', active:true },
  { code:'2B33.0', display:'Diffuse large B-cell lymphoma',                     system:'ICD-11', category:'Haematological',  jurisdiction:'ALL', active:true },
  { code:'2A00.0', display:'Glioblastoma',                                      system:'ICD-11', category:'CNS',             jurisdiction:'ALL', active:true },
  { code:'2B5Y',   display:'High grade serous carcinoma of ovary',              system:'ICD-11', category:'Gynaecological',  jurisdiction:'ALL', active:true },
];

// ── ICD-O Topography ──────────────────────────────────────────────────────────
// Anatomical site codes — C codes, same format as ICD-10 site codes

const ICDO_TOPOGRAPHY: ClinicalCode[] = [
  { code:'C50.9', display:'Breast, NOS',                         system:'ICD-O', subtype:'topography', category:'Breast',         jurisdiction:'ALL', active:true },
  { code:'C50.1', display:'Central portion of breast',           system:'ICD-O', subtype:'topography', category:'Breast',         jurisdiction:'ALL', active:true },
  { code:'C50.2', display:'Upper-inner quadrant of breast',      system:'ICD-O', subtype:'topography', category:'Breast',         jurisdiction:'ALL', active:true },
  { code:'C50.4', display:'Upper-outer quadrant of breast',      system:'ICD-O', subtype:'topography', category:'Breast',         jurisdiction:'ALL', active:true },
  { code:'C18.9', display:'Colon, NOS',                          system:'ICD-O', subtype:'topography', category:'Colorectal',     jurisdiction:'ALL', active:true },
  { code:'C19.9', display:'Rectosigmoid junction',               system:'ICD-O', subtype:'topography', category:'Colorectal',     jurisdiction:'ALL', active:true },
  { code:'C20.9', display:'Rectum, NOS',                         system:'ICD-O', subtype:'topography', category:'Colorectal',     jurisdiction:'ALL', active:true },
  { code:'C61.9', display:'Prostate gland',                      system:'ICD-O', subtype:'topography', category:'Genitourinary',  jurisdiction:'ALL', active:true },
  { code:'C64.9', display:'Kidney, NOS',                         system:'ICD-O', subtype:'topography', category:'Genitourinary',  jurisdiction:'ALL', active:true },
  { code:'C67.9', display:'Bladder, NOS',                        system:'ICD-O', subtype:'topography', category:'Genitourinary',  jurisdiction:'ALL', active:true },
  { code:'C34.9', display:'Lung, NOS',                           system:'ICD-O', subtype:'topography', category:'Thoracic',       jurisdiction:'ALL', active:true },
  { code:'C56.9', display:'Ovary',                               system:'ICD-O', subtype:'topography', category:'Gynaecological', jurisdiction:'ALL', active:true },
  { code:'C53.9', display:'Cervix uteri, NOS',                   system:'ICD-O', subtype:'topography', category:'Gynaecological', jurisdiction:'ALL', active:true },
  { code:'C54.1', display:'Endometrium',                         system:'ICD-O', subtype:'topography', category:'Gynaecological', jurisdiction:'ALL', active:true },
  { code:'C73.9', display:'Thyroid gland',                       system:'ICD-O', subtype:'topography', category:'Endocrine',      jurisdiction:'ALL', active:true },
  { code:'C44.9', display:'Skin, NOS',                           system:'ICD-O', subtype:'topography', category:'Skin',           jurisdiction:'ALL', active:true },
  { code:'C77.9', display:'Lymph node, NOS',                     system:'ICD-O', subtype:'topography', category:'Haematological', jurisdiction:'ALL', active:true },
  { code:'C42.1', display:'Bone marrow',                         system:'ICD-O', subtype:'topography', category:'Haematological', jurisdiction:'ALL', active:true },
  { code:'C49.9', display:'Connective and soft tissue, NOS',     system:'ICD-O', subtype:'topography', category:'Soft Tissue',    jurisdiction:'ALL', active:true },
  { code:'C71.9', display:'Brain, NOS',                          system:'ICD-O', subtype:'topography', category:'CNS',            jurisdiction:'ALL', active:true },
];

// ── ICD-O Morphology ──────────────────────────────────────────────────────────
// Tumour histology + behaviour codes
// Format: XXXX/B where B = behaviour digit
//   /0 = benign  /1 = uncertain  /2 = in situ  /3 = malignant  /6 = metastatic

const ICDO_MORPHOLOGY: ClinicalCode[] = [
  { code:'8140/3', display:'Adenocarcinoma, NOS',                        system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8500/3', display:'Infiltrating duct carcinoma, NOS',           system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8520/3', display:'Lobular carcinoma, NOS',                     system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8140/2', display:'Adenocarcinoma in situ, NOS',                system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8070/3', display:'Squamous cell carcinoma, NOS',               system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8120/3', display:'Transitional cell carcinoma, NOS',           system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8041/3', display:'Small cell carcinoma, NOS',                  system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8330/3', display:'Follicular adenocarcinoma, NOS',             system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8310/3', display:'Clear cell adenocarcinoma, NOS',             system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8230/3', display:'Solid carcinoma, NOS',                       system:'ICD-O', subtype:'morphology', category:'Carcinoma',   jurisdiction:'ALL', active:true },
  { code:'8720/3', display:'Malignant melanoma, NOS',                    system:'ICD-O', subtype:'morphology', category:'Melanocytic', jurisdiction:'ALL', active:true },
  { code:'8745/3', display:'Desmoplastic melanoma, malignant',           system:'ICD-O', subtype:'morphology', category:'Melanocytic', jurisdiction:'ALL', active:true },
  { code:'9680/3', display:'Diffuse large B-cell lymphoma, NOS',         system:'ICD-O', subtype:'morphology', category:'Lymphoma',    jurisdiction:'ALL', active:true },
  { code:'9690/3', display:'Follicular lymphoma, NOS',                   system:'ICD-O', subtype:'morphology', category:'Lymphoma',    jurisdiction:'ALL', active:true },
  { code:'9732/3', display:'Plasma cell myeloma',                        system:'ICD-O', subtype:'morphology', category:'Plasma Cell', jurisdiction:'ALL', active:true },
  { code:'8800/3', display:'Sarcoma, NOS',                               system:'ICD-O', subtype:'morphology', category:'Sarcoma',     jurisdiction:'ALL', active:true },
  { code:'8890/3', display:'Leiomyosarcoma, NOS',                        system:'ICD-O', subtype:'morphology', category:'Sarcoma',     jurisdiction:'ALL', active:true },
  { code:'8900/3', display:'Rhabdomyosarcoma, NOS',                      system:'ICD-O', subtype:'morphology', category:'Sarcoma',     jurisdiction:'ALL', active:true },
  { code:'9440/3', display:'Glioblastoma, NOS',                          system:'ICD-O', subtype:'morphology', category:'CNS Tumours', jurisdiction:'ALL', active:true },
  { code:'9530/0', display:'Meningioma, NOS',                            system:'ICD-O', subtype:'morphology', category:'CNS Tumours', jurisdiction:'ALL', active:true },
];

// ─── Combined lookup ──────────────────────────────────────────────────────────

const ALL_CODES: ClinicalCode[] = [
  ...SNOMED,
  ...ICD10,
  ...ICD11,
  ...ICDO_TOPOGRAPHY,
  ...ICDO_MORPHOLOGY,
];

// ─── Mock service implementation ──────────────────────────────────────────────

export const mockCodeService: ICodeService = {

  async search(params: CodeSearchParams): Promise<ServiceResult<ClinicalCode[]>> {
    await delay();

    let results = ALL_CODES.filter(c =>
      c.system === params.system &&
      (params.includeRetired ? true : c.active)
    );

    if (params.subtype) {
      results = results.filter(c => c.subtype === params.subtype);
    }

    // For SNOMED, category param can be an axis prefix e.g. 'Morphology'
    // which matches 'Morphology|Malignant Epithelial' etc.
    // For other systems it's an exact match.
    if (params.category) {
      if (params.system === 'SNOMED') {
        results = results.filter(c => c.category?.startsWith(params.category + '|') || c.category === params.category);
      } else {
        results = results.filter(c => c.category === params.category);
      }
    }

    if (params.query?.trim()) {
      const q = params.query.trim().toLowerCase();
      results = results.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.display.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }

    return ok(results);
  },

  async getByCode(system: CodeSystem, code: string): Promise<ServiceResult<ClinicalCode>> {
    await delay();
    const found = ALL_CODES.find(c => c.system === system && c.code === code);
    return found
      ? ok({ ...found })
      : err(`Code ${system}:${code} not found`);
  },

  async getCategories(system: CodeSystem, subtype?: IcdOSubtype): Promise<ServiceResult<string[]>> {
    await delay();
    const categories = Array.from(
      new Set(
        ALL_CODES
          .filter(c =>
            c.system === system &&
            c.active &&
            (subtype ? c.subtype === subtype : true)
          )
          .map(c => c.category ?? 'Other')
      )
    );
    return ok(categories);
  },
};
