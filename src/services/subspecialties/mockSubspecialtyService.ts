// src/services/subspecialties/mockSubspecialtyService.ts
import { ISubspecialtyService, Subspecialty } from './ISubspecialtyService';
import { ServiceResult, ID } from '../types';
import { storageGet, storageSet } from '../mockStorage';

const SEED_SUBSPECIALTIES: Subspecialty[] = [
  {
    id: 'gi', name: 'Gastrointestinal',
    description: 'GI tract and hepatobiliary pathology.',
    userIds: ['1', '7'], specimenIds: ['sp1', 'sp2'], clientIds: ['c1'],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'breast', name: 'Breast',
    description: 'Breast pathology including oncology and benign disease.',
    userIds: ['1', '6'], specimenIds: ['sp3'], clientIds: ['c1', 'c2'],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'derm', name: 'Dermatopathology',
    description: 'Skin and soft tissue pathology.',
    userIds: ['6'], specimenIds: ['sp4', 'sp5'], clientIds: [],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'neuro', name: 'Neuropathology',
    description: 'CNS and peripheral nervous system pathology.',
    userIds: ['6'], specimenIds: ['sp6'], clientIds: [],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'heme', name: 'Hematopathology',
    description: 'Blood, bone marrow, and lymph node pathology.',
    userIds: ['9'], specimenIds: ['sp7'], clientIds: ['c3'],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'gyn', name: 'Gynecological',
    description: 'Female reproductive tract pathology.',
    userIds: ['1'], specimenIds: ['sp8'], clientIds: [],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'uro', name: 'Urological',
    description: 'Urinary tract and male reproductive pathology.',
    userIds: ['7'], specimenIds: ['sp9'], clientIds: [],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  {
    id: 'thoracic', name: 'Thoracic',
    description: 'Pulmonary and mediastinal pathology.',
    userIds: [], specimenIds: [], clientIds: [],
    isWorkgroup: false,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
  // ── Workgroup example ─────────────────────────────────────────────────────
  {
    id: 'oncology-pool', name: 'Oncology Pool',
    description: 'Shared queue for general oncology cases — any member can claim.',
    userIds: ['1', '6', '7', '9'], specimenIds: [], clientIds: ['c1', 'c2', 'c4'],
    isWorkgroup: true,
    isWorkgroupEnabled: false, active: true, status: 'Active',
  },
];

// Migrate legacy entries that may not have new fields
const migrate = (s: any): Subspecialty => ({
  ...s,
  description:  s.description  ?? '',
  clientIds:    s.clientIds    ?? [],
  isWorkgroup:  s.isWorkgroup  ?? false,
  active:       s.active       ?? (s.status === 'Active'),
});

const load    = () => storageGet<Subspecialty[]>('pathscribe_subspecialties', SEED_SUBSPECIALTIES).map(migrate);
const persist = (data: Subspecialty[]) => storageSet('pathscribe_subspecialties', data);
let MOCK_SUBSPECIALTIES: Subspecialty[] = load();

const ok    = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const err   = <T>(error: string): ServiceResult<T> => ({ ok: false, error });
const delay = () => new Promise(r => setTimeout(r, 80));

const findAndUpdate = (id: ID, fn: (s: Subspecialty) => Subspecialty): ServiceResult<Subspecialty> => {
  const idx = MOCK_SUBSPECIALTIES.findIndex(s => s.id === id);
  if (idx === -1) return err(`Subspecialty ${id} not found`);
  const updated = fn(MOCK_SUBSPECIALTIES[idx]);
  MOCK_SUBSPECIALTIES = MOCK_SUBSPECIALTIES.map(s => s.id === id ? updated : s);
  persist(MOCK_SUBSPECIALTIES);
  return ok({ ...updated });
};

export const mockSubspecialtyService: ISubspecialtyService = {
  async getAll() { await delay(); return ok([...MOCK_SUBSPECIALTIES]); },

  async getById(id) {
    await delay();
    const s = MOCK_SUBSPECIALTIES.find(s => s.id === id);
    return s ? ok({ ...s }) : err(`Subspecialty ${id} not found`);
  },

  async add(sub) {
    await delay();
    const newSub: Subspecialty = {
      ...sub,
      id:          sub.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      description: sub.description ?? '',
      clientIds:   sub.clientIds   ?? [],
      isWorkgroup: sub.isWorkgroup  ?? false,
      active:      sub.active       ?? true,
    };
    MOCK_SUBSPECIALTIES = [...MOCK_SUBSPECIALTIES, newSub];
    persist(MOCK_SUBSPECIALTIES);
    return ok({ ...newSub });
  },

  async update(id, changes) {
    await delay();
    return findAndUpdate(id, s => ({ ...s, ...changes }));
  },

  async deactivate(id) {
    await delay();
    return findAndUpdate(id, s => ({ ...s, status: 'Inactive', active: false, userIds: [], specimenIds: [] }));
  },

  async reactivate(id) {
    await delay();
    return findAndUpdate(id, s => ({ ...s, status: 'Active', active: true }));
  },

  async assignUser(subspecialtyId, userId) {
    await delay();
    return findAndUpdate(subspecialtyId, s => ({
      ...s, userIds: s.userIds.includes(userId) ? s.userIds : [...s.userIds, userId],
    }));
  },

  async removeUser(subspecialtyId, userId) {
    await delay();
    return findAndUpdate(subspecialtyId, s => ({ ...s, userIds: s.userIds.filter(id => id !== userId) }));
  },

  async assignSpecimen(subspecialtyId, specimenId) {
    await delay();
    return findAndUpdate(subspecialtyId, s => ({
      ...s, specimenIds: s.specimenIds.includes(specimenId) ? s.specimenIds : [...s.specimenIds, specimenId],
    }));
  },

  async removeSpecimen(subspecialtyId, specimenId) {
    await delay();
    return findAndUpdate(subspecialtyId, s => ({ ...s, specimenIds: s.specimenIds.filter(id => id !== specimenId) }));
  },
};
