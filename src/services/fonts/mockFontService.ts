import { IFontService, EditorFont, EditorFontConfig } from './IFontService';
import { ServiceResult } from '../types';
import { storageGet, storageSet } from '../mockStorage';

const SEED_FONTS: EditorFont[] = [
  { id: 'arial',        name: 'Arial',           family: 'Arial, sans-serif',             source: 'system', status: 'Active' },
  { id: 'times',        name: 'Times New Roman', family: '"Times New Roman", serif',       source: 'system', status: 'Active' },
  { id: 'calibri',      name: 'Calibri',         family: 'Calibri, sans-serif',           source: 'system', status: 'Active' },
  { id: 'helvetica',    name: 'Helvetica',       family: 'Helvetica, Arial, sans-serif',  source: 'system', status: 'Active' },
  { id: 'georgia',      name: 'Georgia',         family: 'Georgia, serif',                source: 'system', status: 'Active' },
  { id: 'verdana',      name: 'Verdana',         family: 'Verdana, sans-serif',           source: 'system', status: 'Active' },
  { id: 'courier',      name: 'Courier New',     family: '"Courier New", monospace',      source: 'system', status: 'Active' },
  { id: 'roboto',       name: 'Roboto',          family: '"Roboto", sans-serif',          source: 'google', status: 'Active' },
  { id: 'open-sans',    name: 'Open Sans',       family: '"Open Sans", sans-serif',       source: 'google', status: 'Active' },
  { id: 'source-serif', name: 'Source Serif',    family: '"Source Serif 4", serif',       source: 'google', status: 'Inactive' },
];

const load = () => storageGet<EditorFont[]>('pathscribe_fonts', SEED_FONTS);
const persist = (data: EditorFont[]) => storageSet('pathscribe_fonts', data);
let MOCK_FONTS: EditorFont[] = load();

let MOCK_CONFIG: EditorFontConfig = {
  defaultFont: 'arial',
  defaultSize: 12,
  availableFonts: ['arial', 'times', 'calibri', 'helvetica', 'georgia', 'verdana', 'roboto', 'open-sans'],
};

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockFontService: IFontService = {
  async getAll() { await delay(); return ok([...MOCK_FONTS]); },

  async getConfig() { await delay(); return ok({ ...MOCK_CONFIG, availableFonts: [...MOCK_CONFIG.availableFonts] }); },

  async updateConfig(changes) {
    await delay();
    MOCK_CONFIG = { ...MOCK_CONFIG, ...changes };
    return mockFontService.getConfig();
  },

  async add(font) {
    await delay();
    const newF: EditorFont = { ...font, id: font.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
    MOCK_FONTS = [...MOCK_FONTS, newF];
    persist(MOCK_FONTS);
    return ok({ ...newF });
  },

  async deactivate(id) {
    await delay();
    const idx = MOCK_FONTS.findIndex(f => f.id === id);
    if (idx === -1) return err(`Font ${id} not found`);
    MOCK_FONTS = MOCK_FONTS.map(f => f.id === id ? { ...f, status: 'Inactive' } : f);
    persist(MOCK_FONTS);
    return ok({ ...MOCK_FONTS[idx], status: 'Inactive' });
  },

  async reactivate(id) {
    await delay();
    const idx = MOCK_FONTS.findIndex(f => f.id === id);
    if (idx === -1) return err(`Font ${id} not found`);
    MOCK_FONTS = MOCK_FONTS.map(f => f.id === id ? { ...f, status: 'Active' } : f);
    persist(MOCK_FONTS);
    return ok({ ...MOCK_FONTS[idx], status: 'Active' });
  },
};
