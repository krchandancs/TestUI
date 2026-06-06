import { ISpecimenService, Specimen } from './ISpecimenService';
import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

const SEED_SPECIMENS: Specimen[] = [
  { id: 'sp1', name: 'Colon Biopsy',           code: 'COL-BX',  description: 'Colonoscopic biopsy specimen',        defaultStains: ['H&E'],             processingNotes: 'Submit entirely',          subspecialtyId: 'gi',       status: 'Active'   },
  { id: 'sp2', name: 'Gastric Biopsy',          code: 'GAS-BX',  description: 'Endoscopic gastric biopsy',           defaultStains: ['H&E'],             processingNotes: 'Submit entirely',          subspecialtyId: 'gi',       status: 'Active'   },
  { id: 'sp3', name: 'Breast Core Biopsy',      code: 'BRE-CB',  description: 'Core needle biopsy of breast',        defaultStains: ['H&E', 'ER', 'PR'], processingNotes: 'Submit all cores',         subspecialtyId: 'breast',   status: 'Active'   },
  { id: 'sp4', name: 'Skin Punch Biopsy',       code: 'SKN-PX',  description: 'Punch biopsy of skin',                defaultStains: ['H&E'],             processingNotes: 'Bisect, submit all',       subspecialtyId: 'derm',     status: 'Active'   },
  { id: 'sp5', name: 'Shave Biopsy',            code: 'SKN-SH',  description: 'Shave biopsy of skin lesion',         defaultStains: ['H&E'],             processingNotes: 'Submit entirely',          subspecialtyId: 'derm',     status: 'Active'   },
  { id: 'sp6', name: 'Brain Biopsy',            code: 'BRN-BX',  description: 'Stereotactic or open brain biopsy',   defaultStains: ['H&E', 'GFAP'],     processingNotes: 'Intraop smear if fresh',   subspecialtyId: 'neuro',    status: 'Active'   },
  { id: 'sp7', name: 'Bone Marrow Biopsy',      code: 'BM-BX',   description: 'Trephine bone marrow biopsy',         defaultStains: ['H&E', 'Reticulin'],processingNotes: 'Decal per protocol',       subspecialtyId: 'heme',     status: 'Active'   },
  { id: 'sp8', name: 'Endometrial Biopsy',      code: 'END-BX',  description: 'Endometrial curettage or biopsy',     defaultStains: ['H&E'],             processingNotes: 'Submit all tissue',        subspecialtyId: 'gyn',      status: 'Active'   },
  { id: 'sp9', name: 'Prostate Biopsy',         code: 'PRO-BX',  description: 'Transrectal ultrasound guided biopsy',defaultStains: ['H&E'],             processingNotes: 'Each core separately',     subspecialtyId: 'uro',      status: 'Active'   },
  { id: 'sp10',name: 'Lymph Node Excision',     code: 'LN-EX',   description: 'Excisional lymph node biopsy',        defaultStains: ['H&E'],             processingNotes: 'Representative sections',  subspecialtyId: 'heme',     status: 'Active'   },
  { id: 'sp11',name: 'Thyroid FNA',             code: 'THY-FNA', description: 'Fine needle aspirate of thyroid',     defaultStains: ['Pap', 'DQ'],       processingNotes: 'Air dry and wet fixed',    subspecialtyId: '',         status: 'Active'   },
  { id: 'sp12',name: 'Appendix',                code: 'APP',     description: 'Appendectomy specimen',               defaultStains: ['H&E'],             processingNotes: 'Longitudinal section tip',  subspecialtyId: 'gi',       status: 'Inactive' },
];

const load = () => storageGet<Specimen[]>('pathscribe_specimens', SEED_SPECIMENS);
const persist = (data: Specimen[]) => storageSet('pathscribe_specimens', data);
let MOCK_SPECIMENS: Specimen[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockSpecimenService: ISpecimenService = {
  async getAll() { await delay(); return ok([...MOCK_SPECIMENS]); },

  async getById(id: ID) {
    await delay();
    const s = MOCK_SPECIMENS.find(s => s.id === id);
    return s ? ok({ ...s }) : err(`Specimen ${id} not found`);
  },

  async add(specimen) {
    await delay();
    const newS: Specimen = { ...specimen, id: 'sp' + Date.now() };
    MOCK_SPECIMENS = [...MOCK_SPECIMENS, newS];
    persist(MOCK_SPECIMENS);
    return ok({ ...newS });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_SPECIMENS.findIndex(s => s.id === id);
    if (idx === -1) return err(`Specimen ${id} not found`);
    MOCK_SPECIMENS = MOCK_SPECIMENS.map(s => s.id === id ? { ...s, ...changes } : s);
    persist(MOCK_SPECIMENS);
    return ok({ ...MOCK_SPECIMENS[idx], ...changes });
  },

  async deactivate(id) { return mockSpecimenService.update(id, { status: 'Inactive' }); },
  async reactivate(id) { return mockSpecimenService.update(id, { status: 'Active' }); },
};
