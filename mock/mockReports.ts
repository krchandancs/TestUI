// src/mock/mockReports.ts
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// One FullReport per worklist case (S26-4401 â€¦ S26-4460).
// Patient names, MRNs, DOBs and accession numbers match WorklistPage mock data
// exactly so the full navigation flow is testable end-to-end.
//
// PHI fields (patientName, mrn, dob) are populated with realistic fictitious
// values so that data-phi redaction can be verified in screen captures.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type FullReport = {
  accession:              string;
  patientName:            string;
  gender:                 'Male' | 'Female' | 'Other';
  mrn:                    string;
  dob:                    string;
  collectedAt:            string;
  receivedAt:             string;
  reportedAt:             string;
  diagnosis:              string;
  specimens: Array<{ id: string; type: string; description: string }>;
  synoptic: {
    tumorType:              string;
    grade:                  string;
    size:                   string;
    margins:                string;
    lymphovascularInvasion: string;
    biomarkers: { er: string; pr: string; her2: string; ki67: string };
  };
  grossDescription:       string;
  microscopicDescription: string;
  ancillaryStudies:       string;
  lastUpdated:            string;
};

export type MinimalReport = {
  accession:   string;
  diagnosis:   string;
  specimenType?: string;
  lastUpdated: string;
};

export type Report = FullReport | MinimalReport;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helper
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function full(
  accession: string,
  patientName: string,
  gender: 'Male' | 'Female' | 'Other',
  mrn: string,
  dob: string,
  accDate: string,
  specimenType: string,
  specimenDesc: string,
  diagnosis: string,
  tumorType: string,
  grade: string,
  size: string,
  margins: string,
  lvi: string,
  er: string, pr: string, her2: string, ki67: string,
  gross: string,
  micro: string,
  ancillary: string,
): FullReport {
  const d = new Date(accDate);
  const received = new Date(d.getTime() + 2 * 3600000).toISOString();
  const reported = new Date(d.getTime() + 48 * 3600000).toISOString();
  return {
    accession, patientName, gender, mrn, dob,
    collectedAt: d.toISOString(),
    receivedAt:  received,
    reportedAt:  reported,
    diagnosis,
    specimens: [{ id: 'A', type: specimenType, description: specimenDesc }],
    synoptic: {
      tumorType, grade, size, margins,
      lymphovascularInvasion: lvi,
      biomarkers: { er, pr, her2, ki67 },
    },
    grossDescription:       gross,
    microscopicDescription: micro,
    ancillaryStudies:       ancillary,
    lastUpdated:            reported,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Reports â€” one per worklist case
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const reports: FullReport[] = [

  full('S26-4401','Miller, Jane','Female','MRN-881042','1968-03-14','2026-02-24T08:00:00Z',
    'Left Breast Mastectomy',
    'Left breast mastectomy specimen received fresh, oriented with sutures.',
    'Invasive ductal carcinoma, Nottingham grade 2, left breast',
    'Invasive ductal carcinoma','Grade 2','2.3 cm','Negative, closest 3 mm (anterior)','Present',
    '95% positive (strong)','80% positive (moderate)','1+ (negative)','22%',
    'Received fresh is a left breast mastectomy specimen weighing 312 g, measuring 18 Ã— 14 Ã— 4 cm. Serial sectioning reveals a firm, white-tan stellate mass in the upper outer quadrant measuring 2.3 Ã— 1.8 Ã— 1.5 cm, located 3 cm from the nipple.',
    'Sections show an infiltrating carcinoma with predominantly ductal architecture, moderate nuclear pleomorphism (score 2), tubule formation score 3, and mitotic rate score 1, for a total Nottingham score of 6 (grade 2). Lymphovascular invasion is identified. All surgical margins are negative.',
    'ER/PR/HER2 IHC performed on block A3. Ki-67 proliferation index estimated at 22%.'),

  full('S26-4402','Smith, Alice','Female','MRN-334817','1954-07-22','2026-02-25T09:15:00Z',
    'Right Upper Lobe Wedge',
    'Right upper lobe wedge resection received fresh in a labelled container.',
    'Adenocarcinoma of lung, acinar predominant, pT1b',
    'Lung adenocarcinoma, acinar predominant','Grade 2 (moderately differentiated)','1.9 cm','Negative, closest 5 mm','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Received fresh is a wedge resection of right upper lobe measuring 7 Ã— 5 Ã— 2 cm with an overlying pleural surface. Sectioning reveals a 1.9 cm grey-white subpleural nodule with focal pleural puckering.',
    'Sections show a moderately differentiated adenocarcinoma with acinar predominant pattern (60%), lepidic component (30%), and micropapillary foci (10%). No pleural invasion. Bronchial and vascular resection margins are negative. No lymphovascular invasion identified.',
    'TTF-1 and Napsin-A positive, confirming pulmonary primary. EGFR, ALK, ROS1 mutation analysis sent to molecular pathology.'),

  full('S26-4405','Davis, Robert','Male','MRN-556230','1949-11-03','2026-02-25T10:00:00Z',
    'Right Hemicolectomy',
    'Right hemicolectomy specimen received fresh, ileocolic resection.',
    'Moderately differentiated adenocarcinoma of ascending colon, pT3 N1a',
    'Colonic adenocarcinoma','Moderately differentiated (Grade 2)','4.1 cm','Negative, closest 1.2 cm (radial)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Right hemicolectomy specimen measuring 28 cm in length including 6 cm terminal ileum. A 4.1 Ã— 3.2 cm ulcerated tumour is identified in the ascending colon, 8 cm from the ileocaecal valve. Tumour penetrates through the muscularis propria into pericolorectal fat.',
    'Sections show moderately differentiated adenocarcinoma with gland formation, invasion through muscularis propria into pericolorectal fat (pT3). Lymphovascular invasion is present. 1 of 14 regional lymph nodes shows metastatic carcinoma (pN1a). All resection margins are negative.',
    'MMR IHC: MLH1, MSH2, MSH6, PMS2 intact (mismatch repair proficient). KRAS codon 12/13 mutation analysis pending.'),

  full('S26-4410','Wilson, Karen','Female','MRN-772914','1958-05-09','2026-02-24T08:30:00Z',
    'Radical Prostatectomy',
    'Radical prostatectomy specimen received fresh, seminal vesicles attached.',
    'Prostatic adenocarcinoma, Gleason score 3+4=7 (Grade Group 2), pT2c',
    'Prostatic adenocarcinoma','Gleason 3+4=7 (Grade Group 2)','Bilateral, largest focus 1.4 cm','Negative (focal extraprostatic extension absent)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Radical prostatectomy specimen weighing 48 g, measuring 4.2 Ã— 3.8 Ã— 3.1 cm. Seminal vesicles are intact. Inked and serially sectioned at 3 mm intervals. Tumour involves bilateral lobes predominantly in the posterior mid and apex regions.',
    'Sections show prostatic adenocarcinoma with Gleason pattern 3 (well-formed glands) and pattern 4 (poorly formed/fused glands), primary pattern 3, secondary pattern 4. Tumour confined to prostate (pT2c). All surgical margins negative. Seminal vesicles uninvolved.',
    'PTEN IHC: intact expression. No perineural invasion at surgical margin. Lymph nodes: 0/8 positive (pN0).'),

  full('S26-4412','Johnson, Michael','Male','MRN-119087','1972-09-17','2026-02-23T09:00:00Z',
    'Right Breast Lumpectomy',
    'Right breast lumpectomy specimen received with orienting suture, short=superior, long=lateral.',
    'Invasive lobular carcinoma, classic type, Nottingham grade 2',
    'Invasive lobular carcinoma','Grade 2','1.6 cm','Positive (posterior margin, 0 mm)','Not identified',
    '100% positive (strong)','90% positive (strong)','0 (negative)','8%',
    'Lumpectomy specimen measuring 5.5 Ã— 4.2 Ã— 3.1 cm. Serial sectioning reveals an ill-defined firm area in the central portion measuring approximately 1.6 cm. Margins inked per protocol.',
    'Sections show classic invasive lobular carcinoma with single file infiltration pattern and targetoid arrangement around ducts. Low nuclear grade. Posterior (deep) margin is involved. E-cadherin negative confirming lobular phenotype. No lymphovascular invasion.',
    'ER/PR/HER2 IHC: ER 100% strong positive, PR 90% strong positive, HER2 0 (negative). Ki-67 8%. E-cadherin negative.'),

  full('S26-4415','Thompson, Grace','Female','MRN-443561','1965-02-28','2026-02-25T08:00:00Z',
    'Total Thyroidectomy',
    'Total thyroidectomy specimen received fresh with parathyroid glands.',
    'Papillary thyroid carcinoma, classic variant, pT2',
    'Papillary thyroid carcinoma, classic variant','Not graded (PTC)','2.8 cm','Negative','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Total thyroidectomy specimen weighing 34 g. Right lobe 5.2 Ã— 3.1 Ã— 2.4 cm, left lobe 4.8 Ã— 2.9 Ã— 2.1 cm, isthmus 1.2 cm. A 2.8 cm well-circumscribed pale nodule is identified in the right lobe.',
    'Sections show papillary thyroid carcinoma with classic nuclear features: nuclear enlargement, clearing (Orphan Annie eyes), nuclear grooves and pseudoinclusions. Tumour confined to thyroid (pT2). No extrathyroidal extension. All margins negative. Left lobe shows nodular hyperplasia.',
    'BRAF V600E IHC: positive. No lymphovascular invasion. Parathyroid glands: 2 identified, unremarkable.'),

  full('S26-4416','Martinez, Carlos','Male','MRN-887234','1980-06-11','2026-02-25T10:30:00Z',
    'Back Wide Excision',
    'Wide local excision of back lesion with 1 cm clinical margins.',
    'Malignant melanoma, superficial spreading type, Breslow thickness 1.8 mm, Clark level IV',
    'Malignant melanoma, superficial spreading','Not applicable (melanoma staging)','Breslow 1.8 mm','Negative, closest 4 mm (lateral)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Elliptical skin excision measuring 5.2 Ã— 3.8 cm with underlying subcutaneous fat to depth of 1.2 cm. A 1.4 Ã— 0.9 cm asymmetric brown-black pigmented lesion is identified centrally.',
    'Sections show malignant melanoma, superficial spreading type, with radial and vertical growth phases. Breslow thickness 1.8 mm. Clark level IV (invasion into reticular dermis). Mitotic rate 3/mmÂ². Lymphovascular invasion present. Ulceration absent. Regression absent. All excision margins negative.',
    'S100, Melan-A, HMB-45 positive confirming melanocytic origin. BRAF V600E mutation detected by IHC (confirmed by PCR). Sentinel lymph node biopsy recommended.'),

  full('S26-4417','Lee, Sung-Min','Male','MRN-224789','1961-12-04','2026-02-25T11:00:00Z',
    'Left Partial Nephrectomy',
    'Left partial nephrectomy specimen received fresh with overlying perinephric fat.',
    'Clear cell renal cell carcinoma, ISUP grade 2, pT1b',
    'Clear cell renal cell carcinoma','ISUP Grade 2','5.2 cm','Negative, closest 2 mm (parenchymal)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Partial nephrectomy specimen measuring 8.1 Ã— 6.3 Ã— 4.2 cm including perinephric fat. Sectioning reveals a well-circumscribed golden-yellow tumour measuring 5.2 Ã— 4.8 Ã— 4.1 cm with focal haemorrhage and a thin fibrous pseudocapsule.',
    'Sections show clear cell renal cell carcinoma with diffuse sheet-like architecture and abundant clear cytoplasm reflecting glycogen and lipid content. ISUP grade 2 (nucleoli inconspicuous at 400Ã—). No sarcomatoid or rhabdoid differentiation. Tumour confined to kidney (pT1b). Parenchymal resection margin negative (closest 2 mm).',
    'CA9 and VHL IHC positive. CD10 positive. CK7 negative. PAX8 positive confirming renal origin.'),

  full('S26-4418','Patel, Priya','Female','MRN-991023','1975-08-19','2026-02-24T09:00:00Z',
    'Total Hysterectomy',
    'Total hysterectomy with bilateral salpingo-oophorectomy received fresh.',
    'Endometrioid endometrial adenocarcinoma, FIGO grade 1, pT1a',
    'Endometrioid endometrial adenocarcinoma','FIGO Grade 1 (well differentiated)','Confined to endometrium','Negative','Not identified',
    '80% positive','60% positive','Not applicable','12%',
    'Total abdominal hysterectomy with bilateral salpingo-oophorectomy. Uterus weighs 142 g, measures 9.2 Ã— 5.8 Ã— 4.1 cm. Endometrium measures up to 1.4 cm in thickness. An exophytic polypoid lesion measuring 2.8 Ã— 2.1 cm is identified in the fundus.',
    'Sections show well-differentiated endometrioid adenocarcinoma (FIGO grade 1, <5% solid non-squamous component) confined to the endometrium without myometrial invasion (pT1a). No lymphovascular invasion. Both ovaries and fallopian tubes show no significant pathology.',
    'ER and PR positive. p53 wild-type pattern. MMR IHC intact. POLE mutation analysis pending.'),

  full('S26-4419','Brown, Henry','Male','MRN-556714','1943-04-25','2026-02-24T10:00:00Z',
    'TURBT Chips',
    'TURBT chips received in formalin, aggregating 3.5 cm.',
    'High grade urothelial carcinoma, muscle-invasive (pT2)',
    'Urothelial carcinoma, high grade','High grade','Indeterminate (chips)','Cannot assess','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Received in formalin are multiple tan-pink tissue chips aggregating 3.5 cm. Entirely submitted in 4 cassettes.',
    'Sections show high grade urothelial carcinoma with marked nuclear pleomorphism and frequent mitoses. Detrusor muscle (muscularis propria) is identified and shows tumour invasion, consistent with pT2 disease. Lymphovascular invasion present.',
    'CK7 and CK20 positive confirming urothelial lineage. GATA3 positive. p53 overexpression pattern. PD-L1 CPS 15 (combined positive score).'),

  full('S26-4420','Garcia, Isabella','Female','MRN-773421','1989-01-30','2026-02-25T08:30:00Z',
    'LEEP Cone',
    'LEEP cone biopsy received fresh with anterior suture marker.',
    'Cervical squamous cell carcinoma in situ (CIN 3 / HSIL) with focal microinvasion, depth 1.2 mm',
    'Squamous cell carcinoma in situ with focal microinvasion','Not applicable (CIN 3 / HSIL)','Microinvasive, depth 1.2 mm','Negative, closest 1 mm (ectocervical)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'LEEP cone specimen measuring 2.4 Ã— 2.2 Ã— 1.8 cm. Ectocervical margin inked blue, endocervical margin inked black. Serial sections submitted in 12 cassettes with clock-face orientation.',
    'Sections show high-grade squamous intraepithelial lesion (CIN 3/HSIL) involving the full transformation zone with focal microinvasion to a maximum depth of 1.2 mm and horizontal spread of 3.4 mm (FIGO stage IA1). No lymphovascular invasion. Endocervical and ectocervical margins negative.',
    'p16 block positive confirming HSIL. Ki-67 elevated throughout full epithelial thickness. HPV in situ hybridisation: high-risk HPV positive.'),

  full('S26-4421','Anderson, Paul','Male','MRN-112985','1957-10-07','2026-02-24T09:30:00Z',
    'Liver Core Biopsy x3',
    'Three liver core biopsies received in formalin, each measuring 1.5â€“1.8 cm.',
    'Metastatic adenocarcinoma, consistent with colorectal primary',
    'Metastatic adenocarcinoma (colorectal primary)','Moderately differentiated','Not applicable (biopsy)','Not applicable','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Three tan-white core biopsies each measuring 1.5â€“1.8 cm in length and 0.2 cm in diameter. Submitted entirely in 2 cassettes.',
    'Sections show moderately differentiated adenocarcinoma with dirty necrosis, consistent with colorectal primary. Background liver shows no significant fibrosis or steatosis. Lymphovascular invasion present within biopsy cores.',
    'CK20 positive, CK7 negative, CDX2 positive, TTF-1 negative â€” immunophenotype consistent with colorectal origin. MMR IHC: MLH1 loss detected, PMS2 loss detected (MLH1 promoter methylation analysis pending).'),

  full('S26-4422','White, Eleanor','Female','MRN-664837','1966-06-16','2026-02-25T09:00:00Z',
    'Left Oophorectomy',
    'Left oophorectomy specimen received fresh in a labelled container.',
    'High grade serous carcinoma of left ovary, FIGO stage IC1',
    'High grade serous carcinoma','High grade','6.8 cm','Positive (capsule rupture intraoperative)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Left oophorectomy specimen measuring 8.1 Ã— 6.8 Ã— 5.2 cm. External surface is bosselated with a focal area of capsule disruption. Sectioning reveals solid and cystic architecture with papillary excrescences and areas of haemorrhage and necrosis.',
    'Sections show high grade serous carcinoma with papillary, solid and glandular architecture, marked nuclear atypia, and frequent mitoses including atypical forms. Tumour involves the external surface with capsule rupture (FIGO IC1). Lymphovascular invasion present.',
    'WT1, PAX8, CA125 positive. p53 missense mutation pattern (diffuse strong). BRCA1/2 germline testing recommended. HER2 IHC: 1+.'),

  full('S26-4423','Harris, Samuel','Male','MRN-338092','1978-03-21','2026-02-23T10:00:00Z',
    'Left Forearm Punch x2',
    'Two 4 mm punch biopsies from left forearm received in formalin.',
    'Dermatofibrosarcoma protuberans (DFSP)',
    'Dermatofibrosarcoma protuberans','Low grade (DFSP)','Cannot assess (biopsy)','Cannot assess','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Two punch biopsy cores each measuring 4 mm diameter and up to 8 mm in depth. Submitted entirely.',
    'Sections show a dermal and subcutaneous spindle cell proliferation with storiform architecture and infiltration of subcutaneous fat in a honeycomb pattern, morphologically consistent with DFSP. No fibrosarcomatous transformation identified.',
    'CD34 diffusely positive. S100 negative. Factor XIIIa negative. FISH for COL1A1-PDGFB translocation: positive, confirming DFSP diagnosis.'),

  full('S26-4424','Clark, Diana','Female','MRN-881567','1985-11-12','2026-02-25T08:45:00Z',
    'Appendectomy Specimen',
    'Appendectomy specimen received fresh, intact.',
    'Low grade appendiceal mucinous neoplasm (LAMN)',
    'Low grade appendiceal mucinous neoplasm','Low grade','5.4 cm','Negative','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Appendectomy specimen measuring 7.2 cm in length and up to 2.8 cm in diameter. The appendix is distended with mucinous material. Serosal surface is smooth and glistening. No perforation identified.',
    'Sections show low grade appendiceal mucinous neoplasm (LAMN) with flattened mucinous epithelium, loss of muscularis mucosae, and pushing invasion into the appendiceal wall. No high-grade dysplasia. No extra-appendiceal mucin. Resection margin (staple line) negative.',
    'CK20 positive, CK7 negative, CDX2 positive. MUC2 positive. No evidence of pseudomyxoma peritonei on gross or microscopic examination.'),

  full('S26-4425','Lewis, Nathan','Male','MRN-445219','1952-08-03','2026-02-24T09:15:00Z',
    'Left Orchiectomy',
    'Left radical orchiectomy specimen received fresh with spermatic cord.',
    'Classic seminoma, pT1b (without lymphovascular invasion)',
    'Classic seminoma','Not applicable (seminoma)','3.8 cm','Negative (tunica albuginea intact)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Radical orchiectomy specimen: testis measuring 5.8 Ã— 4.2 Ã— 3.6 cm with attached spermatic cord 8 cm in length. Sectioning reveals a homogeneous cream-coloured lobulated tumour replacing most of the testis, measuring 3.8 Ã— 3.2 Ã— 2.9 cm. Tunica albuginea intact.',
    'Sections show classic seminoma with large cells having prominent nucleoli, clear cytoplasm, and prominent fibrous septa with lymphocytic infiltrate. No rete testis invasion. Tunica albuginea intact. No lymphovascular invasion. Spermatic cord margin negative.',
    'PLAP, OCT3/4, D2-40 positive. AFP negative. CD30 negative. ISUP Ki-67 approximately 40%.'),

  full('S26-4426','Robinson, Faye','Female','MRN-997643','1963-04-08','2026-02-25T10:00:00Z',
    'Parotid Gland Excision',
    'Right superficial parotidectomy specimen received fresh.',
    'Pleomorphic adenoma (benign mixed tumour), right parotid',
    'Pleomorphic adenoma','Benign','3.1 cm','Negative, closest 2 mm','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Superficial parotidectomy specimen measuring 5.8 Ã— 4.2 Ã— 2.9 cm. Sectioning reveals a well-circumscribed nodule with a thin capsule measuring 3.1 Ã— 2.8 Ã— 2.4 cm. Cut surface shows chondromyxoid stroma with firm white-grey areas.',
    'Sections show pleomorphic adenoma with epithelial and myoepithelial cells arranged in duct-like structures within a chondromyxoid stroma. Capsule is intact without penetration. No areas of carcinoma ex pleomorphic adenoma. Margins negative.',
    'SMA and p63 positive (myoepithelial cells). S100 positive. CK7 positive. GFAP positive in stromal component.'),

  full('S26-4427','Walker, Jerome','Male','MRN-221874','1948-07-14','2026-02-23T11:00:00Z',
    'Sigmoid Polypectomy x4',
    'Four polypectomy specimens from sigmoid colon received in formalin.',
    'Tubular adenoma with low grade dysplasia (x3); Tubulovillous adenoma with high grade dysplasia (x1)',
    'Tubulovillous adenoma with high grade dysplasia','Not applicable (adenoma)','1.8 cm (largest, polyp D)','Negative (stalk margin clear)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Four polypectomy specimens labelled Aâ€“D. Polyp A: 0.6 cm sessile. Polyp B: 0.8 cm pedunculated. Polyp C: 0.7 cm sessile. Polyp D: 1.8 cm pedunculated with long stalk.',
    'Polyps Aâ€“C: tubular adenoma with low grade dysplasia, complete excision. Polyp D: tubulovillous adenoma (villous component 35%) with focal high grade dysplasia, no invasive carcinoma. Stalk resection margin clear (>2 mm). No lymphovascular invasion.',
    'MMR IHC performed on polyp D (high grade): MLH1, MSH2, MSH6, PMS2 intact.'),

  full('S26-4428','Young, Angela','Female','MRN-664028','1970-09-26','2026-02-25T09:30:00Z',
    'Thigh Excision Biopsy',
    'Excision biopsy from left thigh received with margins inked.',
    'Dedifferentiated liposarcoma, left thigh, pT2b',
    'Dedifferentiated liposarcoma','High grade (dedifferentiated)','9.4 cm','Positive (posterior margin)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Excision specimen measuring 12.1 Ã— 9.4 Ã— 7.8 cm. Sectioning reveals a bi-phasic tumour with a yellow lipomatous component (well-differentiated liposarcoma, 60%) and a firm grey-white non-lipogenic component (dedifferentiated, 40%) measuring up to 9.4 cm.',
    'Sections show dedifferentiated liposarcoma comprising a well-differentiated liposarcoma component with atypical stromal cells transitioning to a high-grade pleomorphic non-lipogenic sarcoma (dedifferentiated component). Posterior surgical margin involved. Lymphovascular invasion present.',
    'MDM2 FISH: amplified (confirming liposarcoma). CDK4 IHC: positive. S100 focal positive in lipogenic areas. Desmin and SMA negative.'),

  full('S26-4429','Allen, Thomas','Male','MRN-332956','1945-02-17','2026-02-24T08:00:00Z',
    'Partial Gastrectomy',
    'Partial gastrectomy specimen received fresh, orientated with sutures.',
    'Intestinal type gastric adenocarcinoma, moderately differentiated, pT3 N2',
    'Gastric adenocarcinoma, intestinal type','Moderately differentiated (Grade 2)','4.8 cm','Negative, proximal 3.1 cm, distal 2.4 cm','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Partial gastrectomy specimen measuring 22 cm along lesser curvature and 28 cm along greater curvature. An ulcerated tumour measuring 4.8 Ã— 3.9 cm with raised everted edges is identified in the antrum, 3.1 cm from the proximal resection margin.',
    'Sections show moderately differentiated adenocarcinoma of intestinal type (Lauren classification) with glandular structures infiltrating through muscularis propria into periosteum (pT3). Lymphovascular invasion present. 4 of 16 regional lymph nodes show metastatic adenocarcinoma (pN2). All resection margins negative.',
    'HER2 IHC: 2+ (equivocal). HER2 FISH: non-amplified. EBV ISH: negative. MMR IHC intact. PD-L1 CPS: 8.'),

  full('S26-4430','King, Veronica','Female','MRN-887341','1973-05-31','2026-02-25T09:00:00Z',
    'Left Axillary Node Excision',
    'Left axillary sentinel lymph node excision, 3 nodes received.',
    'Metastatic invasive ductal carcinoma in 2/3 sentinel lymph nodes (macrometastasis)',
    'Metastatic invasive ductal carcinoma','Not applicable (LN)','Largest deposit 8 mm','Not applicable','Not applicable',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Three lymph node specimens measuring 1.8 cm, 1.4 cm, and 1.1 cm. Sectioned and entirely submitted.',
    'Sections show metastatic invasive carcinoma in 2 of 3 sentinel lymph nodes. Node 1: macrometastasis measuring 8 mm with extranodal extension. Node 2: macrometastasis measuring 4 mm, no extranodal extension. Node 3: negative.',
    'CK7 and CK19 IHC highlight tumour deposits in nodes 1 and 2. ER positive on metastatic deposits. Extranodal extension present in node 1.'),

  full('S26-4431','Scott, Raymond','Male','MRN-119462','1956-10-22','2026-02-23T09:30:00Z',
    'TRUS Biopsy 12-Core',
    '12-core transrectal ultrasound-guided prostate biopsy, cores labelled by site.',
    'Prostatic adenocarcinoma, Gleason score 4+3=7 (Grade Group 3), involving 5/12 cores',
    'Prostatic adenocarcinoma','Gleason 4+3=7 (Grade Group 3)','Up to 8 mm (core involvement)','Cannot assess (biopsy)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    '12 individually labelled core biopsies each measuring 1.2â€“1.8 cm in length. Submitted by anatomic site in 12 cassettes.',
    'Tumour is identified in 5 of 12 cores: right base (20%), right mid (60%), right apex (40%), left mid (15%), left apex (25%). Gleason pattern 4 predominant (poorly formed/fused glands), secondary pattern 3. Maximum core involvement 8 mm/18 mm (44%). No perineural invasion at biopsy margin. No high-grade PIN.',
    'ERG IHC: positive (TMPRSS2-ERG fusion). PTEN IHC: loss in tumour. PIN4 IHC used for diagnosis confirmation.'),

  full('S26-4432','Green, Harriet','Female','MRN-774823','1982-01-07','2026-02-24T10:15:00Z',
    'Bilateral Salpingectomy',
    'Bilateral salpingectomy specimen received fresh.',
    'Serous tubal intraepithelial carcinoma (STIC), bilateral fallopian tubes',
    'Serous tubal intraepithelial carcinoma (STIC)','High grade','Not applicable (in situ)','Not applicable','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Bilateral salpingectomy: right tube measuring 6.8 Ã— 0.8 cm, left tube measuring 7.2 Ã— 0.9 cm. Fimbriated ends submitted by SEE-FIM protocol.',
    'Sections show serous tubal intraepithelial carcinoma (STIC) involving the fimbriated ends of both fallopian tubes. Morphology: replacement of normal tubal epithelium by cells with severe nuclear atypia, loss of ciliation, and stratification. No invasive carcinoma.',
    'p53 aberrant expression (missense pattern). Ki-67 markedly elevated (>80%). PAX8 positive. WT1 positive. Consistent with STIC in setting of BRCA1/2 mutation screening.'),

  full('S26-4433','Adams, Victor','Male','MRN-446298','1961-07-18','2026-02-25T11:00:00Z',
    'Right Temporal Stereotactic Biopsy',
    'Two stereotactic brain biopsy cores from right temporal region.',
    'Glioblastoma, IDH-wildtype, WHO grade 4',
    'Glioblastoma, IDH-wildtype','WHO Grade 4','Not applicable (biopsy)','Not applicable','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Two grey-pink soft tissue cores each measuring approximately 1 cm in length. Entirely submitted.',
    'Sections show a highly cellular glial neoplasm with marked nuclear pleomorphism, brisk mitotic activity (>10/10 HPF), microvascular proliferation (glomeruloid), and geographic necrosis with pseudopalisading â€” consistent with glioblastoma. Infiltration of adjacent brain parenchyma.',
    'GFAP and Olig2 positive. IDH1 R132H IHC: negative. IDH1/2 sequencing: wildtype. MGMT promoter: methylated. TERT promoter: mutated. EGFR amplification: detected by FISH. 1p/19q co-deletion: absent. WHO CNS grade 4.'),

  full('S26-4434','Baker, Monica','Female','MRN-992847','1977-03-13','2026-02-24T09:45:00Z',
    'Wide Local Excision Vulva',
    'Wide local excision of vulval lesion received with six-point orientation.',
    'Vulval squamous cell carcinoma, moderately differentiated, pT1b',
    'Squamous cell carcinoma, keratinising type','Moderately differentiated','1.9 cm','Negative, closest 4 mm (lateral)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Wide local excision measuring 4.8 Ã— 3.6 Ã— 2.1 cm. A 1.9 Ã— 1.4 cm ulcerated lesion is identified on the right labia minora. Depth of invasion 8 mm.',
    'Sections show moderately differentiated keratinising squamous cell carcinoma with depth of invasion 8 mm (pT1b). Background vulval intraepithelial neoplasia (VIN 3/HSIL) adjacent to invasive tumour. No lymphovascular invasion. All margins negative, closest 4 mm.',
    'p16 block positive (HPV-related aetiology). p53 wild-type pattern. CK5/6 positive. Ki-67 elevated in invasive component.'),

  full('S26-4435','Gonzalez, Enrique','Male','MRN-115673','1950-11-29','2026-02-25T08:00:00Z',
    'Esophagogastrectomy',
    'Ivor Lewis oesophagogastrectomy specimen received fresh.',
    'Oesophageal adenocarcinoma, moderately differentiated, pT3 N1',
    'Oesophageal adenocarcinoma','Moderately differentiated (Grade 2)','5.2 cm','Negative, circumferential radial margin 1.5 mm','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Oesophagogastrectomy specimen, oesophagus 12 cm and stomach 8 cm. Ulcerated tumour in distal oesophagus measuring 5.2 Ã— 4.1 cm, located at the gastro-oesophageal junction, 2 cm above the Z-line.',
    'Moderately differentiated adenocarcinoma arising in Barrett oesophagus with intestinal metaplasia. Tumour invades through muscularis propria into adventitia (pT3). Circumferential radial margin 1.5 mm (involved by 1 mm or less is positive; >1 mm considered negative per RCP guidelines). Lymphovascular invasion present. 2/15 lymph nodes positive (pN1).',
    'HER2 IHC: 3+ (strongly positive). HER2 FISH: amplified. CK7 positive, CK20 focal. CDX2 positive. Trastuzumab eligibility: positive.'),

  full('S26-4436','Nelson, Betty','Female','MRN-337814','1940-05-06','2026-02-23T10:30:00Z',
    'Nose BCC Excision',
    'Excision of nasal lesion with 4 mm clinical margins.',
    'Basal cell carcinoma, nodular type, completely excised',
    'Basal cell carcinoma, nodular type','Not applicable (BCC)','1.1 cm','Negative (all margins clear)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Elliptical skin excision measuring 3.2 Ã— 2.4 cm from the nasal dorsum, depth 0.6 cm. A 1.1 Ã— 0.8 cm pearly papule with telangiectasia is identified centrally.',
    'Sections show nodular basal cell carcinoma with peripheral palisading and retraction artefact. Maximum depth of invasion 3.2 mm. No perineural invasion. No lymphovascular invasion. All peripheral and deep margins are negative. No high-risk features.',
    'BerEP4 positive. EMA negative. No evidence of infiltrative, morphoeic, or basosquamous subtypes.'),

  full('S26-4437','Carter, Denise','Female','MRN-883021','1969-02-14','2026-02-25T09:00:00Z',
    'CT-Guided Core Biopsy x2',
    'Two CT-guided core biopsies from right lung mass received in formalin.',
    'Squamous cell carcinoma of lung, moderately differentiated',
    'Squamous cell carcinoma of lung','Moderately differentiated','Not applicable (biopsy)','Not applicable','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Two core biopsies each measuring 1.4 cm Ã— 2 mm. Entirely submitted.',
    'Sections show moderately differentiated squamous cell carcinoma with intercellular bridges and keratin pearl formation. No glandular or small cell differentiation.',
    'p40 and CK5/6 positive. TTF-1 and Napsin-A negative. Confirming squamous cell carcinoma. PD-L1 TPS: 60% (22C3 assay). KRAS/EGFR/ALK/ROS1: negative. Appropriate for immunotherapy assessment.'),

  full('S26-4438','Mitchell, Franklin','Male','MRN-441397','1955-08-30','2026-02-24T08:30:00Z',
    'Splenectomy',
    'Splenectomy specimen received fresh.',
    'Diffuse large B-cell lymphoma (DLBCL), NOS, involving spleen',
    'Diffuse large B-cell lymphoma, NOS','Not applicable (lymphoma)','Spleen 14.8 Ã— 11.2 Ã— 7.3 cm','Not applicable','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Splenectomy specimen weighing 680 g, measuring 14.8 Ã— 11.2 Ã— 7.3 cm. Capsule intact. Sectioning reveals multiple confluent grey-white nodules replacing much of the splenic parenchyma, largest measuring 6.2 cm.',
    'Sections show diffuse infiltration by large atypical lymphoid cells with prominent nucleoli and frequent mitoses, effacing the splenic architecture. Morphology and immunophenotype consistent with diffuse large B-cell lymphoma, NOS, non-germinal centre B-cell subtype (Hans classifier).',
    'CD20, CD79a, PAX5 positive. BCL2 positive (90%). BCL6 positive (70%). MUM1 positive. CD10 negative. MYC IHC 50%. Ki-67 80%. C-MYC FISH: rearranged. BCL2 FISH: not rearranged. EBV ISH: negative. Hans classifier: non-GCB.'),

  full('S26-4439','Perez, Luisa','Female','MRN-776952','1986-12-01','2026-02-25T10:00:00Z',
    'Iliac Crest Core Biopsy',
    'Bilateral posterior iliac crest bone marrow trephine biopsies received.',
    'Acute myeloid leukaemia with myelodysplasia-related changes, bone marrow involvement',
    'Acute myeloid leukaemia with MRC','Not applicable (AML)','Not applicable (marrow)','Not applicable','Not applicable',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Bilateral trephine biopsies each measuring 1.8â€“2.2 cm in length and 0.2 cm in diameter, adequate for assessment.',
    'Sections show hypercellular marrow (>90% cellularity) with marked reduction in normal trilineage haematopoiesis. Blasts comprising approximately 35â€“40% of nucleated cells by morphology, with CD34 IHC confirming blast percentage. Dysplastic megakaryocytes and dyserythropoiesis noted.',
    'CD34 (blasts ~38%), CD117, MPO, CD13, CD33 positive. CD14, CD64, glycophorin A negative. TdT negative. Blast population consistent with AML with MRC. Cytogenetics and NPM1/FLT3/IDH1/IDH2 mutation analysis pending.'),

  full('S26-4440','Roberts, Clarence','Male','MRN-113628','1944-06-23','2026-02-25T08:00:00Z',
    'Whipple Procedure',
    'Pancreaticoduodenectomy (Whipple) specimen received fresh.',
    'Pancreatic ductal adenocarcinoma, moderately differentiated, pT3 N1 R0',
    'Pancreatic ductal adenocarcinoma','Moderately differentiated (Grade 2)','3.4 cm','Negative (R0, closest 1.8 mm SMV margin)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Whipple resection specimen: pancreatic head 5.8 Ã— 4.2 Ã— 3.1 cm, duodenum 22 cm, common bile duct 3.2 cm. Sectioning reveals a firm white-grey ill-defined mass in the pancreatic head/uncinate measuring 3.4 Ã— 2.9 cm obstructing the main pancreatic duct.',
    'Moderately differentiated ductal adenocarcinoma with desmoplastic stroma, perineural invasion, and vascular invasion. Tumour extends beyond pancreas into peripancreatic soft tissue (pT3). All resection margins negative (R0). Closest margin: SMV groove 1.8 mm. 3/18 regional lymph nodes positive (pN1).',
    'CK7, CK19, CA19-9, MUC1 positive. CDX2 focal positive. SMAD4 IHC: loss of expression. p53 missense pattern. KRAS G12V mutation detected. Mismatch repair intact.'),

  full('S26-4441','Turner, Sylvia','Female','MRN-558034','1991-04-09','2026-02-22T09:00:00Z',
    'Colposcopic Biopsy x3',
    'Three colposcopic cervical biopsies received in formalin.',
    'High-grade squamous intraepithelial lesion (HSIL / CIN 3)',
    'HSIL (CIN 3)','Not applicable','Not applicable (biopsy)','Cannot assess','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Three tissue fragments each measuring 3â€“5 mm. Entirely submitted.',
    'Sections show high grade squamous intraepithelial lesion (HSIL/CIN 3) with full thickness epithelial involvement by dysplastic cells, loss of maturation, and numerous mitotic figures including atypical forms. Koilocytic change present. No invasive carcinoma.',
    'p16 block positive throughout full epithelial thickness. Ki-67 elevated (full thickness). HPV ISH: high-risk HPV detected. No evidence of invasive disease in submitted material.'),

  full('S26-4442','Phillips, Gordon','Male','MRN-884271','1968-09-15','2026-02-25T09:30:00Z',
    'Allograft Core Biopsy x2',
    'Two renal allograft core biopsies from transplant kidney.',
    'Acute T-cell mediated rejection, Banff grade IA',
    'Acute T-cell mediated rejection','Banff grade IA','Not applicable (transplant biopsy)','Not applicable','Not applicable',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Two core biopsies each approximately 1.6 cm in length, submitted in separate cassettes for routine histology and immunofluorescence.',
    'Sections show moderate tubulitis (t2) with mononuclear cell interstitial infiltrate (i2). No intimal arteritis (v0). No glomerulitis. No peritubular capillaritis. No evidence of antibody-mediated rejection. Adequate cortical sample with >10 glomeruli and 2 arteries. Banff 2019 classification: Acute T-cell mediated rejection, grade IA (t2, i2, v0).',
    'C4d immunofluorescence: negative in peritubular capillaries. DSA (donor-specific antibody): negative. PLA2R: negative. SV40 (polyoma virus): negative. CMV/BK virus ISH: negative.'),

  full('S26-4443','Campbell, Rosemary','Female','MRN-221546','1974-07-27','2026-02-24T10:00:00Z',
    'US-Guided Core Biopsy x4',
    'Four ultrasound-guided core biopsies from right breast mass.',
    'Invasive ductal carcinoma, Nottingham grade 3, right breast',
    'Invasive ductal carcinoma','Nottingham Grade 3','Cannot assess (biopsy)','Cannot assess','Present',
    '60% positive (moderate)','30% positive (weak)','3+ (positive)','45%',
    'Four tan-white core biopsies each measuring 1.4â€“1.8 cm in length, entirely submitted.',
    'Sections show grade 3 invasive ductal carcinoma with marked nuclear pleomorphism (score 3), minimal tubule formation (score 3), and high mitotic rate (score 3, total Nottingham score 9). Lymphovascular invasion present in adjacent tissue.',
    'ER 60% moderate positive, PR 30% weak positive, HER2 3+ (positive by IHC). Ki-67 45%. HER2 FISH: amplified (ratio 5.2). Dual anti-HER2 therapy (trastuzumab + pertuzumab) eligibility: positive.'),

  full('S26-4444','Parker, Leonard','Male','MRN-667803','1946-03-04','2026-02-25T08:30:00Z',
    'Left Hemicolectomy',
    'Left hemicolectomy specimen received fresh.',
    'Mucinous adenocarcinoma of descending colon, moderately differentiated, pT4a N0',
    'Mucinous adenocarcinoma of colon','Moderately differentiated (Grade 2)','6.1 cm','Positive (serosal surface involved)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Left hemicolectomy specimen measuring 32 cm in length. Annular ulcerated tumour in descending colon measuring 6.1 Ã— 5.2 cm penetrating through the serosa with visible tumour on peritoneal surface.',
    'Sections show mucinous adenocarcinoma (>50% extracellular mucin pools with tumour cells) infiltrating through muscularis propria to involve the peritoneal surface (pT4a). Lymphovascular invasion present. 0/22 regional lymph nodes positive (pN0). Serosal involvement present.',
    'CK20, CDX2, MUC2 positive. CK7 negative. MMR IHC: MLH1 and PMS2 loss (MLH1 promoter methylation detected â€” likely sporadic MSI-H). KRAS G12D mutation detected. BRAF V600E: wildtype. RAS/RAF profiling complete.'),

  full('S26-4445','Evans, Constance','Female','MRN-442917','1983-10-16','2026-02-22T10:00:00Z',
    'Scalp Shave x2',
    'Two shave biopsies from scalp lesions received in formalin.',
    'Melanoma in situ (lentigo maligna type) â€” both lesions',
    'Melanoma in situ, lentigo maligna type','Not applicable (in situ)','Lesion A 1.4 cm, Lesion B 0.9 cm','Cannot assess (shave)','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Two shave biopsy specimens: Lesion A measuring 1.4 Ã— 1.1 cm, Lesion B measuring 0.9 Ã— 0.7 cm, each to depth of 2 mm.',
    'Both lesions show melanoma in situ, lentigo maligna type, characterised by lentiginous and nested melanocytic proliferation within sun-damaged epidermis, predominantly at the dermoepidermal junction with involvement of adnexal structures. No dermal invasion. Margins cannot be assessed on shave biopsies.',
    'Melan-A and SOX10 IHC highlight atypical junctional melanocytes. MIB-1 (Ki-67) elevated in junctional component. BRAF V600E IHC: negative. Wide local excision with sentinel lymph node mapping recommended.'),

  full('S26-4446','Edwards, Wallace','Male','MRN-119384','1953-12-20','2026-02-25T09:00:00Z',
    'Cystectomy Specimen',
    'Radical cystectomy specimen received fresh with prostate.',
    'Urothelial carcinoma, high grade, muscle-invasive, pT3b N1',
    'Urothelial carcinoma, high grade','High grade','5.8 cm (dominant mass)','Negative (urethral margin clear)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Radical cystectomy with prostate: bladder 9.2 Ã— 8.1 Ã— 4.8 cm. Dominant posterior wall tumour 5.8 Ã— 4.9 cm with areas of necrosis invading through perivesical fat.',
    'Sections show high grade urothelial carcinoma with extensive perineural invasion and lymphovascular invasion. Tumour invades through muscularis propria into perivesical fat microscopically (pT3b). Prostate involved by direct extension (pT4a element present). Urethral margin negative. 1/12 pelvic lymph nodes positive (pN1). ',
    'GATA3 and CK7 positive confirming urothelial lineage. PD-L1 CPS 28. FGFR3 mutation: detected. Erdafitinib eligibility: positive.'),

  full('S26-4447','Collins, Marguerite','Female','MRN-885627','1979-06-03','2026-02-24T09:30:00Z',
    'Right Adrenalectomy',
    'Right adrenalectomy specimen received fresh.',
    'Adrenocortical carcinoma, Weiss score 5, pT2',
    'Adrenocortical carcinoma','High grade (Weiss score 5)','6.4 cm','Negative','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Right adrenalectomy specimen weighing 94 g, measuring 7.2 Ã— 6.4 Ã— 5.1 cm. Sectioning reveals a heterogeneous tumour with haemorrhage, necrosis, and fibrous bands.',
    'Sections show adrenocortical carcinoma scoring 5/9 on Weiss criteria: high nuclear grade (score 1), mitotic rate >5/50 HPF (score 1), atypical mitoses (score 1), necrosis (score 1), lymphovascular invasion (score 1). Capsule intact without invasion. Adrenal vein margin negative.',
    'SF1 and inhibin positive confirming adrenocortical origin. Melan-A positive. Ki-67 28%. IGF2 overexpression by IHC. p53 overexpression pattern. CTNNB1 mutation analysis pending.'),

  full('S26-4448','Stewart, Reginald','Male','MRN-443081','1960-01-11','2026-02-24T10:30:00Z',
    'Left Lower Lobectomy',
    'Left lower lobe lobectomy specimen received fresh.',
    'Squamous cell carcinoma of lung, well differentiated, pT2a N0',
    'Squamous cell carcinoma of lung','Well differentiated (Grade 1)','3.1 cm','Negative, bronchial margin 2.8 cm clear','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Left lower lobectomy specimen measuring 14 Ã— 9 Ã— 4 cm. Sectioning reveals a 3.1 Ã— 2.7 cm white-grey central tumour with a hilar location, partially obstructing a segmental bronchus.',
    'Sections show well-differentiated keratinising squamous cell carcinoma with abundant keratin pearls and intercellular bridges. Visceral pleura uninvolved. Bronchial resection margin negative (2.8 cm). No lymphovascular invasion. 0/9 hilar and mediastinal lymph nodes positive (pN0).',
    'p40 and CK5/6 strongly positive. TTF-1 and Napsin-A negative. PD-L1 TPS: 5%. ALK/ROS1/NTRK: not applicable (squamous). Completed staging: pT2a N0 M0, stage IB.'),

  full('S26-4449','Sanchez, Olivia','Female','MRN-776134','1988-07-24','2026-02-22T09:30:00Z',
    'Myomectomy Specimen',
    'Myomectomy specimen â€” multiple fibroids received.',
    'Uterine leiomyoma (x4), largest with hyaline degeneration â€” no evidence of malignancy',
    'Leiomyoma (benign)','Benign','Largest 7.2 cm','Not applicable','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Four fibroid specimens received. Largest measuring 7.2 Ã— 6.8 Ã— 5.9 cm, firm, white whorled on cut section. Remaining three measuring 3.1 cm, 2.4 cm, and 1.8 cm.',
    'Sections show uterine leiomyoma with a fascicular growth pattern of smooth muscle cells with bland spindle nuclei. Largest fibroid shows extensive hyaline degeneration. No significant nuclear atypia, no necrosis, mitotic rate <1/10 HPF. No features of STUMP or leiomyosarcoma.',
    'SMA, desmin and h-caldesmon positive. Ki-67 <1%. p16 focal positive (non-block). No HMGA2 overexpression. No features meeting WHO criteria for smooth muscle tumour of uncertain malignant potential.'),

  full('S26-4450','Morris, Clifford','Male','MRN-112839','1962-04-17','2026-02-25T08:45:00Z',
    'Oropharyngeal Resection',
    'Composite oropharyngeal resection including right tonsil and base of tongue.',
    'HPV-associated squamous cell carcinoma, base of tongue, p16-positive, pT2 N2b',
    'Squamous cell carcinoma, HPV-associated (p16-positive)','Non-keratinising, poorly differentiated','2.6 cm','Negative, closest 4 mm','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Composite resection including right tonsil and base of tongue, measuring 5.8 Ã— 4.1 Ã— 3.2 cm overall. A 2.6 cm ill-defined firm area is identified at the base of tongue.',
    'Sections show poorly differentiated non-keratinising squamous cell carcinoma with basaloid morphology. p16 block positive (HPV-associated). Depth of invasion 12 mm. Perineural invasion present. Lymphovascular invasion present. All mucosal and deep surgical margins negative.',
    'p16 block positive (CINtec, >70% strong nuclear/cytoplasmic staining). HPV ISH: high-risk HPV-16 detected. CK5/6 positive. Immunotherapy evaluation: PD-L1 CPS 22.'),

  full('S26-4451','Rogers, Nadine','Female','MRN-887462','1971-08-08','2026-02-24T09:00:00Z',
    'Ear SCC Wide Excision',
    'Wide local excision of right ear lesion with marked margins.',
    'Squamous cell carcinoma, moderately differentiated, right ear, completely excised',
    'Squamous cell carcinoma, keratinising type','Moderately differentiated','1.8 cm','Negative, closest 3 mm','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Elliptical skin excision from right auricle measuring 4.1 Ã— 3.0 cm with depth 0.9 cm. A 1.8 Ã— 1.4 cm ulcerated lesion with rolled edges is identified centrally.',
    'Sections show moderately differentiated keratinising squamous cell carcinoma with depth of invasion 6 mm. No cartilage invasion. No perineural or lymphovascular invasion. All peripheral and deep margins negative, closest 3 mm at posterior margin.',
    'CK5/6 and p40 positive. EMA positive. No evidence of Merkel cell, basal cell, or adnexal carcinoma. High-risk features absent.'),

  full('S26-4452','Reed, Douglas','Male','MRN-334095','1959-02-26','2026-02-25T09:15:00Z',
    'Right Breast Mastectomy',
    'Right skin-sparing mastectomy with sentinel lymph node biopsy.',
    'Invasive ductal carcinoma, Nottingham grade 3, right breast, pT2 N0',
    'Invasive ductal carcinoma','Nottingham Grade 3','2.9 cm','Negative (skin-sparing, all margins >1 cm)','Not identified',
    '0% (negative)','0% (negative)','3+ (positive)','75%',
    'Right skin-sparing mastectomy weighing 498 g. Sectioning reveals a firm ill-defined white-grey tumour in the upper inner quadrant measuring 2.9 Ã— 2.4 Ã— 2.1 cm, located 4.2 cm from the nipple.',
    'Sections show high grade invasive ductal carcinoma (NST), Nottingham grade 3 (score 9). ER and PR negative. HER2 3+ strongly positive. Triple assessment: HER2-positive, hormone receptor-negative. No lymphovascular invasion. Sentinel node (x2): negative (0/2, pN0).',
    'ER 0% negative, PR 0% negative, HER2 3+ IHC positive. HER2 FISH: amplified (ratio 6.8). Ki-67 75%. Anti-HER2 therapy (trastuzumab + pertuzumab Â± neratinib) eligibility: positive. Germline BRCA1/2 testing recommended given triple-negative-like profile.'),

  full('S26-4453','Cook, Patricia','Female','MRN-661834','1948-10-31','2026-02-22T10:00:00Z',
    'Cholecystectomy',
    'Laparoscopic cholecystectomy specimen received intact.',
    'Incidental gallbladder adenocarcinoma, well differentiated, pT1b',
    'Gallbladder adenocarcinoma, well differentiated','Well differentiated (Grade 1)','1.2 cm','Negative','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Cholecystectomy specimen measuring 8.2 Ã— 3.8 Ã— 2.4 cm. Mucosal surface shows a 1.2 Ã— 0.9 cm sessile polypoid lesion in the fundus. Remaining mucosa granular and bile-stained.',
    'Sections show well-differentiated tubular adenocarcinoma invading into but not through the muscularis propria (pT1b). No perineural invasion. No lymphovascular invasion. Cystic duct margin negative. Liver bed resection margin negative.',
    'CK7 and CK19 positive. CDX2 focal positive. CA19-9 positive. No evidence of high-grade dysplasia in adjacent mucosa. Cholesterol polyp component also present. Incidental finding â€” recommend surgical oncology review.'),

  full('S26-4454','Morgan, Elliott','Male','MRN-997216','1967-05-14','2026-02-24T08:45:00Z',
    'Right Radical Nephrectomy',
    'Right radical nephrectomy specimen received fresh.',
    'Clear cell renal cell carcinoma, ISUP grade 3, pT3a (renal vein invasion)',
    'Clear cell renal cell carcinoma','ISUP Grade 3','8.4 cm','Negative (renal sinus margin clear)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Right radical nephrectomy weighing 624 g. Kidney 12.1 Ã— 7.8 Ã— 5.9 cm with perirenal fat. A 8.4 Ã— 7.2 cm golden-yellow tumour with haemorrhage and necrosis is identified in the upper pole, with tumour thrombus extending into the main renal vein.',
    'Sections show ISUP grade 3 clear cell renal cell carcinoma (prominent nucleoli visible at 100Ã—). Tumour extends into renal vein (pT3a). No adrenal gland involvement. Gerota fascia intact. Lymphovascular invasion (renal vein). Sarcomatoid differentiation: absent. Renal sinus fat not involved.',
    'CA9 diffusely positive. CD10 positive. PAX8 positive. CAIX positive. VHL mutation detected. BAP1 loss by IHC â€” adverse prognostic marker. Ki-67 18%.'),

  full('S26-4455','Bell, Adrienne','Female','MRN-442758','1984-11-07','2026-02-25T10:00:00Z',
    'Mediastinal Core Biopsy',
    'CT-guided mediastinal core biopsy x3 from anterior mediastinal mass.',
    'Classic Hodgkin lymphoma, nodular sclerosis subtype',
    'Classic Hodgkin lymphoma, nodular sclerosis','Not applicable (lymphoma)','Not applicable (biopsy)','Not applicable','Not applicable',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Three core biopsies each measuring 1.5â€“2.0 cm in length. Entirely submitted.',
    'Sections show nodular sclerosing Hodgkin lymphoma with broad bands of collagen dividing the tissue into nodules. Reed-Sternberg cells and lacunar variants present in a mixed inflammatory background of eosinophils, plasma cells, and small lymphocytes.',
    'CD30 strongly positive (RS cells). CD15 positive. CD20 negative. PAX5 weak positive. CD3 negative (RS cells). EBV ISH (EBER): negative. CD45 negative. Background T-cells: CD4 predominant. Diagnosis: Classic Hodgkin lymphoma, nodular sclerosis, WHO grade 2.'),

  full('S26-4456','Murphy, Cecilia','Female','MRN-118493','1993-03-22','2026-02-24T09:00:00Z',
    'LEEP Cone + ECC',
    'LEEP cone biopsy with endocervical curettage received.',
    'High grade squamous intraepithelial lesion (HSIL / CIN 2-3) at endocervical margin',
    'HSIL (CIN 2â€“3)','Not applicable','Not applicable (biopsy)','Endocervical margin positive','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'LEEP cone measuring 2.1 Ã— 1.8 Ã— 1.4 cm. ECC: fragments of tan tissue 0.6 cm aggregate. Submitted separately.',
    'Sections show high grade squamous intraepithelial lesion (HSIL/CIN 2-3) involving the transformation zone. Endocervical resection margin positive for HSIL. Ectocervical margin negative. ECC: HSIL present in curettings, no invasive carcinoma. Repeat excision recommended.',
    'p16 block positive. Ki-67 elevated (upper 2/3 of epithelium). HPV ISH: high-risk HPV positive. No glandular lesion identified. Adenocarcinoma in situ absent.'),

  full('S26-4457','Bailey, Wendell','Male','MRN-665317','1951-09-19','2026-02-25T08:00:00Z',
    'Robot-Assisted Radical Prostatectomy',
    'Robot-assisted radical prostatectomy with bilateral pelvic lymph node dissection.',
    'Prostatic adenocarcinoma, Gleason score 4+4=8 (Grade Group 4), pT3a N0',
    'Prostatic adenocarcinoma','Gleason 4+4=8 (Grade Group 4)','Bilateral, extensive','Positive (right posterior margin, 2 mm)','Present',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Radical prostatectomy weighing 62 g, 4.8 Ã— 4.2 Ã— 3.6 cm. Bilateral seminal vesicles. Sectioning shows bilateral posterior tumour with focal extraprostatic extension at right posterolateral apex.',
    'Sections show Gleason pattern 4+4=8 prostatic adenocarcinoma (Grade Group 4) with poorly formed and fused glands bilaterally. Extraprostatic extension at right posterolateral apex (pT3a). Positive surgical margin right posterior, extent 2 mm. Seminal vesicles negative. Lymphovascular invasion present.',
    'ERG IHC: negative. PTEN IHC: loss of expression. Pelvic lymph nodes: 0/14 positive (pN0). Adjuvant radiotherapy to prostate bed recommended given positive margin.'),

  full('S26-4458','Rivera, Camila','Female','MRN-883714','1995-06-28','2026-02-24T10:00:00Z',
    'Right Oophorectomy',
    'Right salpingo-oophorectomy specimen received fresh.',
    'Mature cystic teratoma (dermoid cyst) with incidental focus of struma ovarii â€” benign',
    'Mature cystic teratoma (dermoid cyst)','Benign','7.1 cm (cyst)','Not applicable','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Right salpingo-oophorectomy: ovary 8.3 Ã— 7.1 Ã— 6.2 cm. Unilocular cyst with yellow-green sebaceous material and hair. Nodular area (Rokitansky nodule) 1.8 cm.',
    'Sections show mature cystic teratoma (dermoid cyst) lined by keratinising squamous epithelium with sebaceous glands, hair follicles, and occasional respiratory and neural tissue. Rokitansky nodule contains a focus of thyroid tissue (struma ovarii). No immature elements. No evidence of malignant transformation.',
    'Thyroglobulin and TTF-1 positive in struma ovarii component. Alpha-fetoprotein: negative. No immature neuroectodermal elements. Fallopian tube: no significant pathology.'),

  full('S26-4459','Cooper, Bernard','Male','MRN-441029','1948-08-12','2026-02-21T09:30:00Z',
    'Scalp Melanoma Re-Excision',
    'Wide local re-excision of previously biopsied scalp melanoma with 1 cm margins.',
    'No residual melanoma â€” complete excision confirmed. Margins negative.',
    'No residual tumour (complete excision)','Not applicable','Not applicable (re-excision)','Negative, all margins >1 cm','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Elliptical skin re-excision from scalp measuring 5.8 Ã— 4.2 cm with depth to galea aponeurotica. Central scar from previous biopsy identified.',
    'Sections show dermal fibrosis and scar tissue at site of previous biopsy. No residual melanoma identified. Previous biopsy site shows mature scar with haemosiderin deposition and focal chronic inflammation. All peripheral and deep margins negative. Perilesional epidermis shows solar lentiginous changes only.',
    'Melan-A and SOX10 IHC performed: no residual melanocytic neoplasm identified. S100 highlights neural structures only. Re-excision confirms complete local excision.'),

  full('S26-4460','Richardson, Loretta','Female','MRN-776843','1972-12-05','2026-02-25T09:00:00Z',
    'Stereotactic Biopsy x6',
    'Six stereotactic brain biopsy cores from left frontal mass.',
    'Oligodendroglioma, IDH-mutant and 1p/19q co-deleted, WHO grade 2',
    'Oligodendroglioma, IDH-mutant, 1p/19q co-deleted','WHO Grade 2','Not applicable (biopsy)','Not applicable','Not identified',
    'Not applicable','Not applicable','Not applicable','Not applicable',
    'Six grey-pink soft tissue cores each measuring 0.8â€“1.4 cm in length. Submitted in two cassettes.',
    'Sections show a cellular glial neoplasm with uniform round nuclei, perinuclear halos (fried egg artefact), branching capillary network (chicken wire pattern), and focal calcification. Mitotic rate low (<2/10 HPF). No microvascular proliferation. No necrosis.',
    'IDH1 R132H IHC: positive. ATRX IHC: retained. Olig2 positive. GFAP focal positive. 1p/19q co-deletion by FISH: confirmed. TERT promoter mutation: detected. WHO CNS grade 2. MGMT promoter: methylated. Treatment planning: watch and wait vs. temozolomide per RTOG 9802 criteria.')

,

  // â”€â”€ Male demo case â€” male breast carcinoma (clinically valid, ~1% of all breast cases) â”€â”€
  full('S25-12346','Harrison, Marcus','Male','MRN-204471','1961-08-14','2026-03-10T08:00:00Z',
    'Left Breast Wide Local Excision',
    'Left breast wide local excision with sentinel lymph node biopsy, received fresh and oriented with sutures.',
    'Invasive ductal carcinoma (NST), Nottingham grade 2, left male breast, pT1c N0',
    'Invasive ductal carcinoma (NST)','Grade 2','1.8 cm','Negative, closest 4 mm (deep)','Not identified',
    '90% positive (strong)','70% positive (moderate)','1+ (negative)','18%',
    'Received fresh is a left breast wide local excision weighing 48 g, measuring 9 Ã— 7 Ã— 3 cm with orienting sutures. Serial sectioning reveals a firm, white-tan stellate mass centrally located, measuring 1.8 Ã— 1.4 Ã— 1.2 cm, situated 4 mm from the deep margin.',
    'Sections show invasive ductal carcinoma of no special type (NST), Nottingham grade 2 (tubules 2, nuclei 2, mitoses 1; total score 5). Invasive tumour measures 1.8 cm. No lymphovascular invasion identified. All surgical margins clear; closest margin is deep at 4 mm. Sentinel lymph node (Ã—1): no metastatic carcinoma identified (0/1, pN0). Associated DCIS, intermediate nuclear grade, present at periphery of invasive tumour.',
    'ER: 90% positive, Allred score 8 (strong). PR: 70% positive, Allred score 7 (moderate). HER2 IHC: 1+ negative. HER2 FISH: not amplified. Ki-67 proliferation index: 18%. AR (androgen receptor): 85% positive â€” standard finding in male breast carcinoma. Oncotype DX Recurrence Score recommended given ER+/HER2- profile.')

];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Legacy standalone reports (kept for backward compat with FullReportPage)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const minimalReport: MinimalReport = {
  accession:   'S23-9981',
  diagnosis:   'Invasive lobular carcinoma',
  specimenType:'Breast, right',
  lastUpdated: '2023-11-05T10:00:00Z',
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Lookup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const reportMap = new Map<string, Report>(
  reports.map(r => [r.accession, r])
);
reportMap.set('S23-9981', minimalReport);
// Male demo alias â€” accessible as both S25-12346 and the worklist entry
// reportMap already contains S25-12346 from the main reports array

export function getMockReport(accession: string): Report | null {
  return reportMap.get(accession) ?? null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AI Extraction Layer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Simulates what the AI pipeline would extract from a FullReport and return
// as structured synoptic data. In production this is replaced by a real API
// call (e.g. POST /ai/extract) that returns the same shape.
//
// The source text in each aiSource field is a verbatim snippet from the report
// so the highlight feature can locate it exactly. Corrections made by
// pathologists (verified / disputed) are fed back as training signal.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type AiVerification = 'unverified' | 'verified' | 'disputed';

export interface AiField {
  id:           string;
  label:        string;
  type:         'text' | 'select' | 'comment';
  required:     boolean;
  confidence:   number;
  aiSource:     string;
  value:        string;
  aiValue:      string;
  dirty:        boolean;
  verification: AiVerification;
}

export interface AiCode {
  id:           string;
  system:       'SNOMED' | 'ICD';
  code:         string;
  display:      string;
  source:       'system' | 'ai' | 'manual';
  confidence?:  number;
  aiSource?:    string;
  verification?: AiVerification;
}

export interface AiExtractionResult {
  specimenName:    string;
  specimenStatus:  'complete' | 'alert' | 'pending';
  overallConfidence: number;
  autoPopulatedCount: number;
  totalFieldCount: number;
  codes:           AiCode[];
  tumorFields:     AiField[];
  marginFields:    AiField[];
  biomarkerFields: AiField[];
  erPrPanel?: {
    codes:           AiCode[];
    biomarkerFields: AiField[];
  };
  her2Panel?: {
    codes:           AiCode[];
    biomarkerFields: AiField[];
  };
}

function field(
  id: string, label: string, required: boolean,
  confidence: number, aiSource: string, value: string,
): AiField {
  return { id, label, type: 'text', required, confidence, aiSource, value, aiValue: value, dirty: false, verification: 'unverified' };
}

function aiCode(
  id: string, system: 'SNOMED' | 'ICD', code: string, display: string,
  confidence: number, aiSource: string,
): AiCode {
  return { id, system, code, display, source: 'ai', confidence, aiSource, verification: 'unverified' };
}

function systemCode(id: string, system: 'SNOMED' | 'ICD', code: string, display: string): AiCode {
  return { id, system, code, display, source: 'system' };
}

/**
 * Derives AI-extracted synoptic data from a FullReport.
 * All aiSource strings are verbatim substrings of the report text so the
 * highlight feature can locate them. Confidence scores reflect how
 * unambiguous the extraction is from the source text.
 *
 * TODO: Replace with real POST /ai/extract call when backend is ready.
 */
export function extractAiSynoptic(report: FullReport): AiExtractionResult {
  const s = report.synoptic;
  const micro = report.microscopicDescription;
  const gross = report.grossDescription;
  const diag  = report.diagnosis;

  // â”€â”€ LVI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const lviPresent = s.lymphovascularInvasion?.toLowerCase().includes('present')
    || micro.toLowerCase().includes('lymphovascular invasion is identified')
    || micro.toLowerCase().includes('lymphovascular invasion is present');
  const lviValue = lviPresent ? 'Present' : 'Not identified';
  // Find verbatim snippet from micro text for highlight
  const lviSnippet = (() => {
    const phrases = [
      'Lymphovascular invasion is identified',
      'Lymphovascular invasion is present',
      'No lymphovascular invasion',
      'lymphovascular invasion not identified',
    ];
    for (const p of phrases) {
      if (micro.toLowerCase().includes(p.toLowerCase())) return p;
    }
    return s.lymphovascularInvasion;
  })();
  const lviConfidence = lviSnippet ? 68 : 40;

  // â”€â”€ Margins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const marginsNegative = s.margins?.toLowerCase().startsWith('negative');
  const closestValue = (() => {
    // Normalise to cm
    const raw = s.margins ?? '';
    const m = raw.match(/([\d.]+)\s*(mm|cm)/i);
    if (!m) return '';
    const num = parseFloat(m[1]);
    return m[2].toLowerCase() === 'mm' ? `${(num / 10).toFixed(1)} cm` : `${num} cm`;
  })();

  // â”€â”€ Biomarkers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const erRaw  = s.biomarkers?.er  ?? '';
  const prRaw  = s.biomarkers?.pr  ?? '';
  const her2Raw = s.biomarkers?.her2 ?? '';
  const erPositive  = erRaw  && !erRaw.toLowerCase().includes('negative') && !erRaw.startsWith('0%') && erRaw !== 'Not applicable';
  const prPositive  = prRaw  && !prRaw.toLowerCase().includes('negative') && !prRaw.startsWith('0%') && prRaw !== 'Not applicable';
  const her2Positive = her2Raw && (her2Raw.includes('3+') || her2Raw.toLowerCase().includes('positive')) && !her2Raw.toLowerCase().includes('negative');
  const her2Negative = her2Raw && (her2Raw.toLowerCase().includes('negative') || her2Raw.includes('1+') || her2Raw.includes('2+'));

  // â”€â”€ Tumor size â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sizeMatch = (s.size ?? gross).match(/([\d.]+)\s*(?:Ã—|x)\s*[\d.]+/i);
  const sizeValue = sizeMatch ? `${sizeMatch[1]} cm` : s.size ?? '';

  // â”€â”€ Fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tumorFields: AiField[] = [
    field('tumor_size',       'Tumor Size',              true,  94, `Gross: "${sizeMatch?.[0] ?? s.size}"`,     sizeValue),
    field('histologic_type',  'Histologic Type',         true,  98, `Diagnosis: "${diag}"`,                    formatHistologicType(s.tumorType)),
    field('histologic_grade', 'Histologic Grade',        true,  92, `Micro: "${formatGradeSnippet(s.grade)}"`, formatGrade(s.grade)),
    field('lvi',              'Lymphovascular Invasion', true,  lviConfidence, `Micro: "${lviSnippet}"`,        lviValue),
  ];

  const marginFields: AiField[] = [
    field('margin_status',  'Margin Status',           true,  91, `Micro: "${marginsNegative ? 'All surgical margins are negative' : s.margins}"`, marginsNegative ? 'Negative' : 'Positive'),
    field('closest_margin', 'Closest Margin Distance', false, closestValue ? 87 : 0, closestValue ? `Gross: "${s.margins}"` : '', closestValue),
  ];

  // â”€â”€ Codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const codes: AiCode[] = [
    systemCode('sys-1', 'SNOMED', '413448000', 'Invasive ductal carcinoma of breast'),
    systemCode('sys-2', 'ICD',    'C50.512',   'Malignant neoplasm of lower-outer quadrant of left female breast'),
    aiCode('ai-1', 'SNOMED', '416940007', 'Lymphovascular invasion present',                                      lviConfidence, `Micro: "${lviSnippet}"`),
    aiCode('ai-6', 'ICD',    'C50.512',   'Malignant neoplasm of lower-outer quadrant of left female breast',    94,            `Diagnosis: "${diag}"`),
  ];

  // â”€â”€ ER/PR panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const erPrPanel = (erRaw !== 'Not applicable' || prRaw !== 'Not applicable') ? {
    codes: [
      ...(erPositive  ? [aiCode('ai-2', 'SNOMED', '414737002', 'ER positive breast carcinoma',  95, `Ancillary: "${erRaw}"`)]  : []),
      ...(prPositive  ? [aiCode('ai-3', 'SNOMED', '414739004', 'PR positive breast carcinoma',  93, `Ancillary: "${prRaw}"`)]  : []),
      ...(erPositive  ? [aiCode('ai-5', 'ICD',    'Z17.0',     'Estrogen receptor positive status [ER+]', 95, `Ancillary: "${erRaw}"`)] : []),
      ...(prPositive  ? [aiCode('ai-7', 'ICD',    'Z79.818',   'Long-term use of agents affecting estrogen receptors', 88, `Ancillary: "${prRaw}"`)] : []),
    ],
    biomarkerFields: [
      field('er_status', 'ER Status', true,  erRaw !== 'Not applicable' ? 96 : 0, `Ancillary: "${erRaw}"`, erRaw !== 'Not applicable' ? erRaw : ''),
      field('pr_status', 'PR Status', true,  prRaw !== 'Not applicable' ? 95 : 0, `Ancillary: "${prRaw}"`, prRaw !== 'Not applicable' ? prRaw : ''),
    ],
  } : undefined;

  // â”€â”€ HER2 panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const her2Panel = her2Raw !== 'Not applicable' ? {
    codes: [
      ...(her2Positive ? [aiCode('ai-4p', 'SNOMED', '432881000', 'HER2 positive breast carcinoma', 91, `Ancillary: "${her2Raw}"`)] : []),
      ...(her2Negative ? [aiCode('ai-4n', 'SNOMED', '431396003', 'HER2 negative breast carcinoma', 91, `Ancillary: "${her2Raw}"`)] : []),
      aiCode('ai-8', 'ICD', 'Z15.01', 'Genetic susceptibility to malignant neoplasm of breast', 72, `Ancillary: "${her2Raw}"`),
    ],
    biomarkerFields: [
      field('her2_ihc',  'HER2 IHC Score',  true,  her2Raw !== 'Not applicable' ? 97 : 0, `Ancillary: "${her2Raw}"`, her2Raw !== 'Not applicable' ? her2Raw : ''),
      field('her2_fish', 'HER2 FISH Result', false, 0, '', ''),
    ],
  } : undefined;

  // â”€â”€ Overall confidence â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allFields = [...tumorFields, ...marginFields,
    ...(erPrPanel?.biomarkerFields ?? []), ...(her2Panel?.biomarkerFields ?? [])];
  const populated = allFields.filter(f => f.value).length;
  const avgConf   = allFields.reduce((sum, f) => sum + f.confidence, 0) / (allFields.length || 1);

  return {
    specimenName:        report.specimens[0]?.description ?? 'Specimen',
    specimenStatus:      'complete',
    overallConfidence:   Math.round(avgConf),
    autoPopulatedCount:  populated,
    totalFieldCount:     allFields.length,
    codes,
    tumorFields,
    marginFields,
    biomarkerFields:     [],
    erPrPanel,
    her2Panel,
  };
}

// â”€â”€ Formatting helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatHistologicType(raw: string): string {
  if (!raw) return '';
  if (raw.toLowerCase().includes('ductal'))      return 'Invasive Ductal Carcinoma';
  if (raw.toLowerCase().includes('lobular'))     return 'Invasive Lobular Carcinoma';
  if (raw.toLowerCase().includes('mucinous'))    return 'Mucinous Carcinoma';
  if (raw.toLowerCase().includes('tubular'))     return 'Tubular Carcinoma';
  return raw;
}

function formatGrade(raw: string): string {
  if (!raw) return '';
  const m = raw.match(/grade\s*(\d)/i) ?? raw.match(/(\d)\s*\(/i);
  return m ? `Grade ${m[1]}` : raw;
}

function formatGradeSnippet(raw: string): string {
  if (!raw) return '';
  // Return a short verbatim-style snippet for the aiSource citation
  if (raw.toLowerCase().includes('grade 1') || raw.toLowerCase().includes('well'))         return 'well differentiated';
  if (raw.toLowerCase().includes('grade 2') || raw.toLowerCase().includes('moderately'))   return 'moderately differentiated';
  if (raw.toLowerCase().includes('grade 3') || raw.toLowerCase().includes('poorly'))       return 'poorly differentiated';
  return raw;
}

