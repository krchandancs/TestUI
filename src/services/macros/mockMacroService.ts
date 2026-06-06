import { IMacroService, Macro } from './IMacroService';
import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

const SEED_MACROS: Macro[] = [
  {
    id: 'm1', name: 'Normal Colon Mucosa', shortcut: '.normcolon', category: 'Diagnosis',
    content: 'Sections show colonic mucosa with normal crypt architecture. No dysplasia, active inflammation, or granulomas identified. The lamina propria shows no increase in chronic inflammatory cells.',
    subspecialtyIds: ['gi'], snomedCodes: ['17072006'], icdCodes: ['K63.9'],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm2', name: 'Normal Skin', shortcut: '.normskin', category: 'Diagnosis',
    content: 'Sections show skin with unremarkable epidermis, dermis, and adnexal structures. No malignancy identified.',
    subspecialtyIds: ['derm'], snomedCodes: ['17636008'], icdCodes: ['L98.9'],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm3', name: 'Adequate Specimen Comment', shortcut: '.adequate', category: 'Comment',
    content: 'The specimen is adequate for histological evaluation.',
    subspecialtyIds: [], snomedCodes: [], icdCodes: [],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm4', name: 'Insufficient Specimen', shortcut: '.insuf', category: 'Comment',
    content: 'The specimen is insufficient for definitive histological diagnosis. Clinical correlation is recommended. Additional sampling may be necessary.',
    subspecialtyIds: [], snomedCodes: [], icdCodes: [],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm5', name: 'Clinical Correlation Recommended', shortcut: '.ccr', category: 'Comment',
    content: 'Clinical and radiological correlation is recommended for definitive interpretation.',
    subspecialtyIds: [], snomedCodes: [], icdCodes: [],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm6', name: 'Benign Prostatic Tissue', shortcut: '.normprostate', category: 'Diagnosis',
    content: 'Sections show benign prostatic glandular and stromal tissue. No evidence of malignancy. Gleason score: not applicable.',
    subspecialtyIds: ['uro'], snomedCodes: ['1442003'], icdCodes: ['N40.0'],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm7', name: 'Amended Report Header', shortcut: '.amended', category: 'Addendum',
    content: 'AMENDMENT\nThis report has been amended. The original report dated [DATE] is superseded by this amendment.\nReason for amendment: [REASON]',
    subspecialtyIds: [], snomedCodes: [], icdCodes: [],
    createdBy: '3', status: 'Active',
  },
  {
    id: 'm8', name: 'Normal Endometrium', shortcut: '.normendo', category: 'Gross Description',
    content: 'The endometrial curettings consist of multiple tan-pink tissue fragments measuring [X] cm in aggregate. Representative sections are submitted.',
    subspecialtyIds: ['gyn'], snomedCodes: ['2739003'], icdCodes: ['N85.0'],
    createdBy: '1', status: 'Active',
  },
  {
    id: 'm9', name: 'Legacy Normal Colon (old format)', shortcut: '.oldcolon', category: 'Diagnosis',
    content: 'Normal colonic mucosa.',
    subspecialtyIds: ['gi'], snomedCodes: [], icdCodes: [],
    createdBy: '3', status: 'Inactive',
  },
];

const load = () => storageGet<Macro[]>('pathscribe_macros', SEED_MACROS);
const persist = (data: Macro[]) => storageSet('pathscribe_macros', data);
let MOCK_MACROS: Macro[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockMacroService: IMacroService = {
  async getAll() { await delay(); return ok([...MOCK_MACROS]); },

  async getById(id: ID) {
    await delay();
    const m = MOCK_MACROS.find(m => m.id === id);
    return m ? ok({ ...m }) : err(`Macro ${id} not found`);
  },

  async getByShortcut(shortcut: string) {
    await delay();
    const m = MOCK_MACROS.find(m => m.shortcut === shortcut && m.status === 'Active');
    return ok(m ? { ...m } : null);
  },

  async getForSubspecialty(subspecialtyId: string) {
    await delay();
    const macros = MOCK_MACROS.filter(m =>
      m.status === 'Active' &&
      (m.subspecialtyIds.length === 0 || m.subspecialtyIds.includes(subspecialtyId))
    );
    return ok([...macros]);
  },

  async add(macro) {
    await delay();
    const newM: Macro = { ...macro, id: 'm' + Date.now() };
    MOCK_MACROS = [...MOCK_MACROS, newM];
    persist(MOCK_MACROS);
    return ok({ ...newM });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_MACROS.findIndex(m => m.id === id);
    if (idx === -1) return err(`Macro ${id} not found`);
    MOCK_MACROS = MOCK_MACROS.map(m => m.id === id ? { ...m, ...changes } : m);
    persist(MOCK_MACROS);
    return ok({ ...MOCK_MACROS[idx], ...changes });
  },

  async deactivate(id) { return mockMacroService.update(id, { status: 'Inactive' }); },
  async reactivate(id) { return mockMacroService.update(id, { status: 'Active' }); },
};
