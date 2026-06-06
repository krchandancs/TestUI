// src/services/performanceTargets/IPerformanceTargetService.ts
import type { ServiceResult, ID } from '../types';

export type TargetUnit   = 'cases' | 'RVUs' | '%' | 'hours';
export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface PerformanceTarget {
  id:          string;
  key:         string;
  label:       string;
  description: string;
  value:       number;
  unit:        TargetUnit;
  period:      TargetPeriod;
  system:      boolean;
}

export interface IPerformanceTargetService {
  getAll():                                                  Promise<ServiceResult<PerformanceTarget[]>>;
  getById(id: ID):                                           Promise<ServiceResult<PerformanceTarget | null>>;
  getByKey(key: string):                                     Promise<ServiceResult<PerformanceTarget | null>>;
  add(t: Omit<PerformanceTarget, 'id'>):                    Promise<ServiceResult<PerformanceTarget>>;
  update(id: ID, changes: Partial<PerformanceTarget>):       Promise<ServiceResult<PerformanceTarget>>;
  delete(id: ID):                                            Promise<ServiceResult<void>>;
}
