// src/services/performanceTargets/mockPerformanceTargetService.ts
import type { PerformanceTarget, IPerformanceTargetService } from './IPerformanceTargetService';
import type { ServiceResult, ID } from '../types';

const ok  = <T>(d: T): ServiceResult<T>     => ({ ok: true,  data: d });
const err = <T>(m: string): ServiceResult<T> => ({ ok: false, error: m });

let store: PerformanceTarget[] = [
  { id:'pt-1', key:'cases_monthly', label:'Cases per Month',    description:'Total cases signed out per pathologist per month', value:120, unit:'cases', period:'monthly',   system:true  },
  { id:'pt-2', key:'tat_routine',   label:'Routine TAT',        description:'Average turnaround for routine cases',             value:48,  unit:'hours', period:'monthly',   system:true  },
  { id:'pt-3', key:'tat_stat',      label:'STAT TAT',           description:'Average turnaround for STAT cases',               value:4,   unit:'hours', period:'monthly',   system:true  },
  { id:'pt-4', key:'qc_signout',    label:'QC Sign-out Rate',   description:'Cases passing QC before finalisation',            value:98,  unit:'%',     period:'quarterly', system:true  },
  { id:'pt-5', key:'rvu_monthly',   label:'Monthly RVUs',       description:'Relative value units per pathologist per month',  value:350, unit:'RVUs',  period:'monthly',   system:false },
];
let seq = 10;

export const mockPerformanceTargetService: IPerformanceTargetService = {
  async getAll()       { return ok([...store]); },
  async getById(id)    { return ok(store.find(x => x.id === id) ?? null); },
  async getByKey(key)  { return ok(store.find(x => x.key === key) ?? null); },
  async add(t)         { const r: PerformanceTarget = { ...t, id:`pt-${seq++}` }; store.push(r); return ok(r); },
  async update(id, changes) {
    const i = store.findIndex(x => x.id === id);
    if (i < 0) return err(`Target ${id} not found`);
    store[i] = { ...store[i], ...changes };
    return ok(store[i]);
  },
  async delete(id) { store = store.filter(x => x.id !== id); return ok(undefined); },
};
