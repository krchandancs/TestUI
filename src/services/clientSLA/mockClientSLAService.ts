// src/services/clientSLA/mockClientSLAService.ts
import type { ClientSLA, IClientSLAService } from './IClientSLAService';
import type { ServiceResult, ID } from '../types';

const ok  = <T>(d: T): ServiceResult<T>     => ({ ok: true,  data: d });
const err = <T>(m: string): ServiceResult<T> => ({ ok: false, error: m });

let store: ClientSLA[] = [];
let seq = 1;

export const mockClientSLAService: IClientSLAService = {
  async getAll()              { return ok([...store]); },
  async getById(id)           { return ok(store.find(s => s.id === id) ?? null); },
  async getByClientCode(code) { return ok(store.find(s => s.clientCode === code) ?? null); },
  async add(sla)              { const r: ClientSLA = { ...sla, id: `sla-${seq++}` }; store.push(r); return ok(r); },
  async update(id, changes) {
    const i = store.findIndex(s => s.id === id);
    if (i < 0) return err(`SLA ${id} not found`);
    store[i] = { ...store[i], ...changes };
    return ok(store[i]);
  },
  async delete(id) { store = store.filter(s => s.id !== id); return ok(undefined); },
};
