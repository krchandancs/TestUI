import { IModelService, AIModel } from './IModelService';
import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

const SEED_MODELS: AIModel[] = [
  {
    id: 'psv32', name: 'pathscribe', version: 'v3.2',
    type: 'Gross + Micro', accuracy: 94.2, casesProcessed: 12487,
    releaseDate: '2025-06-01', status: 'Active', isDefault: true,
    subspecialtyIds: [], notes: 'Current production model.',
  },
  {
    id: 'psv33', name: 'pathscribe', version: 'v3.3',
    type: 'Gross + Micro', accuracy: 96.1, casesProcessed: 842,
    releaseDate: '2026-01-15', status: 'Beta', isDefault: false,
    subspecialtyIds: [], notes: 'Beta — enhanced microscopic suggestion accuracy. Enrolling pilot labs.',
  },
  {
    id: 'psv31', name: 'pathscribe', version: 'v3.1',
    type: 'Gross Only', accuracy: 91.8, casesProcessed: 45210,
    releaseDate: '2024-11-01', retiredDate: '2025-06-01', status: 'Retired', isDefault: false,
    subspecialtyIds: [], notes: 'Retired on v3.2 release. Gross-only model.',
  },
  {
    id: 'psv30', name: 'pathscribe', version: 'v3.0',
    type: 'Gross Only', accuracy: 88.4, casesProcessed: 98341,
    releaseDate: '2024-04-01', retiredDate: '2024-11-01', status: 'Retired', isDefault: false,
    subspecialtyIds: [], notes: 'First production release.',
  },
];

const load = () => storageGet<AIModel[]>('pathscribe_models', SEED_MODELS);
const persist = (data: AIModel[]) => storageSet('pathscribe_models', data);
let MOCK_MODELS: AIModel[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

export const mockModelService: IModelService = {
  async getAll() {
    await delay();
    return ok([...MOCK_MODELS]);
  },

  async getById(id: ID) {
    await delay();
    const m = MOCK_MODELS.find(m => m.id === id);
    return m ? ok({ ...m }) : err(`Model ${id} not found`);
  },

  async getActive() {
    await delay();
    return ok(MOCK_MODELS.filter(m => m.status === 'Active' || m.status === 'Beta').map(m => ({ ...m })));
  },

  async getDefault() {
    await delay();
    const m = MOCK_MODELS.find(m => m.isDefault);
    return ok(m ? { ...m } : null);
  },

  async setDefault(id: ID) {
    await delay();
    const target = MOCK_MODELS.find(m => m.id === id);
    if (!target) return err(`Model ${id} not found`);
    if (target.status === 'Retired') return err(`Cannot set a retired model as default`);
    MOCK_MODELS = MOCK_MODELS.map(m => ({ ...m, isDefault: m.id === id }));
    persist(MOCK_MODELS);
    return ok({ ...target, isDefault: true });
  },

  async update(id, changes) {
    await delay();
    const idx = MOCK_MODELS.findIndex(m => m.id === id);
    if (idx === -1) return err(`Model ${id} not found`);
    MOCK_MODELS = MOCK_MODELS.map(m => m.id === id ? { ...m, ...changes } : m);
    persist(MOCK_MODELS);
    return ok({ ...MOCK_MODELS[idx], ...changes });
  },

  async retire(id) {
    await delay();
    const target = MOCK_MODELS.find(m => m.id === id);
    if (!target) return err(`Model ${id} not found`);
    if (target.isDefault) return err(`Cannot retire the default model. Set another model as default first.`);
    return mockModelService.update(id, { status: 'Retired', retiredDate: new Date().toISOString().split('T')[0] });
  },
};
