// src/services/clientSLA/IClientSLAService.ts
import type { ServiceResult, ID } from '../types';

export interface ClientSLA {
  id:                       string;
  clientCode:               string;
  clientName:               string;
  firstTouchTargetHrs:      number;
  totalTatTargetHrs:        number;
  statFirstTouchTargetHrs?: number;
  statTotalTatTargetHrs?:   number;
  active:                   boolean;
  notes?:                   string;
}

export interface IClientSLAService {
  getAll():                                         Promise<ServiceResult<ClientSLA[]>>;
  getById(id: ID):                                  Promise<ServiceResult<ClientSLA | null>>;
  getByClientCode(code: string):                    Promise<ServiceResult<ClientSLA | null>>;
  add(sla: Omit<ClientSLA, 'id'>):                 Promise<ServiceResult<ClientSLA>>;
  update(id: ID, changes: Partial<ClientSLA>):      Promise<ServiceResult<ClientSLA>>;
  delete(id: ID):                                   Promise<ServiceResult<void>>;
}
