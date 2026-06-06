// src/components/Config/Models/mockSpecimens.ts

import { Specimen } from "./specimenTypes";

const now = () => new Date().toISOString();

export const mockSpecimens: Specimen[] = [
  {
    id: "sp-1",
    name: "Colon Biopsy",
    description: "Multiple fragments of colonic mucosa",
    subspecialtyId: "ss-gi",
    subspecialtyName: "GI",
    specimenCode: "GI-COL-BX",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-2",
    name: "Terminal Ileum Biopsy",
    description: "Evaluation for IBD or infection",
    subspecialtyId: "ss-gi",
    subspecialtyName: "GI",
    specimenCode: "GI-ILEUM-BX",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-3",
    name: "Breast Core Biopsy",
    description: "Ultrasound-guided breast core biopsy",
    subspecialtyId: "ss-breast",
    subspecialtyName: "Breast",
    specimenCode: "BR-CORE",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-4",
    name: "Breast Lumpectomy",
    description: "Partial mastectomy specimen",
    subspecialtyId: "ss-breast",
    subspecialtyName: "Breast",
    specimenCode: "BR-LUMP",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-5",
    name: "Skin Punch Biopsy",
    description: "Punch biopsy of skin lesion",
    subspecialtyId: "ss-derm",
    subspecialtyName: "Derm",
    specimenCode: "DERM-PUNCH",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-6",
    name: "Skin Shave Biopsy",
    description: "Shave biopsy of epidermal lesion",
    subspecialtyId: "ss-derm",
    subspecialtyName: "Derm",
    specimenCode: "DERM-SHAVE",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-7",
    name: "Lymph Node Excision",
    description: "Excisional biopsy for lymphoma workup",
    subspecialtyId: "ss-heme",
    subspecialtyName: "Heme",
    specimenCode: "HEME-LN-EXC",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-8",
    name: "Bone Marrow Biopsy",
    description: "Core biopsy for hematologic evaluation",
    subspecialtyId: "ss-heme",
    subspecialtyName: "Heme",
    specimenCode: "HEME-BM-BX",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-9",
    name: "Endometrial Biopsy",
    description: "Evaluation for hyperplasia or carcinoma",
    subspecialtyId: "ss-gyn",
    subspecialtyName: "GYN",
    specimenCode: "GYN-ENDO-BX",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-10",
    name: "Cervical LEEP",
    description: "Loop electrosurgical excision procedure",
    subspecialtyId: "ss-gyn",
    subspecialtyName: "GYN",
    specimenCode: "GYN-LEEP",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-11",
    name: "Appendix",
    description: "Appendectomy specimen",
    subspecialtyId: "ss-general",
    subspecialtyName: "General",
    specimenCode: "GEN-APP",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-12",
    name: "Gallbladder",
    description: "Cholecystectomy specimen",
    subspecialtyId: "ss-general",
    subspecialtyName: "General",
    specimenCode: "GEN-GB",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-13",
    name: "Thyroid Lobectomy",
    description: "Right or left thyroid lobe",
    subspecialtyId: "ss-general",
    subspecialtyName: "General",
    specimenCode: "GEN-THY-LB",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-14",
    name: "Soft Tissue Mass",
    description: "Excision of subcutaneous or deep mass",
    subspecialtyId: "ss-general",
    subspecialtyName: "General",
    specimenCode: "GEN-STM",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  },
  {
    id: "sp-15",
    name: "Prostate Core Biopsy",
    description: "Transrectal ultrasound-guided biopsy",
    subspecialtyId: "ss-general",
    subspecialtyName: "General",
    specimenCode: "GEN-PROST-BX",
    active: true,
    version: 1,
    updatedBy: "system",
    updatedAt: now()
  }
];
