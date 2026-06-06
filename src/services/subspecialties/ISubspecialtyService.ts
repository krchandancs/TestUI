// src/services/subspecialties/ISubspecialtyService.ts
import { ServiceResult, ID } from '../types';

export interface Subspecialty {
  id: ID;
  name: string;
  description?: string;        // Administrative notes
  userIds: string[];           // Members / assigned physicians
  specimenIds: string[];
  clientIds: string[];         // Linked institutions/clients
  isWorkgroup: boolean;        // false = Standard, true = Pool/Workgroup
  isWorkgroupEnabled: boolean;
  active: boolean;             // replaces status for consistency with UI
  status: 'Active' | 'Inactive';
}

export interface ISubspecialtyService {
  getAll(): Promise<ServiceResult<Subspecialty[]>>;
  getById(id: ID): Promise<ServiceResult<Subspecialty>>;
  add(subspecialty: Omit<Subspecialty, 'id'>): Promise<ServiceResult<Subspecialty>>;
  update(id: ID, changes: Partial<Omit<Subspecialty, 'id'>>): Promise<ServiceResult<Subspecialty>>;
  deactivate(id: ID): Promise<ServiceResult<Subspecialty>>;
  reactivate(id: ID): Promise<ServiceResult<Subspecialty>>;
  assignUser(subspecialtyId: ID, userId: ID): Promise<ServiceResult<Subspecialty>>;
  removeUser(subspecialtyId: ID, userId: ID): Promise<ServiceResult<Subspecialty>>;
  assignSpecimen(subspecialtyId: ID, specimenId: ID): Promise<ServiceResult<Subspecialty>>;
  removeSpecimen(subspecialtyId: ID, specimenId: ID): Promise<ServiceResult<Subspecialty>>;
}
