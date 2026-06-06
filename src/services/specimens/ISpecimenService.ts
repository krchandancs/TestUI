import { ServiceResult, ID } from '../types';

export interface Specimen {
  id: ID;
  name: string;
  code: string;
  description: string;
  defaultStains: string[];
  processingNotes: string;
  subspecialtyId: string;
  status: 'Active' | 'Inactive';
}

export interface ISpecimenService {
  getAll(): Promise<ServiceResult<Specimen[]>>;
  getById(id: ID): Promise<ServiceResult<Specimen>>;
  add(specimen: Omit<Specimen, 'id'>): Promise<ServiceResult<Specimen>>;
  update(id: ID, changes: Partial<Omit<Specimen, 'id'>>): Promise<ServiceResult<Specimen>>;
  deactivate(id: ID): Promise<ServiceResult<Specimen>>;
  reactivate(id: ID): Promise<ServiceResult<Specimen>>;
}
