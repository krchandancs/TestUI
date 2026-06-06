import { ServiceResult, ID } from '../types';

export interface Physician {
  id: ID;
  firstName: string;
  lastName: string;
  npi: string;
  specialty: string;
  phone: string;
  fax: string;
  email: string;
  preferredContact: 'Email' | 'Fax' | 'Phone';
  clientIds: string[];
  status: 'Active' | 'Inactive' | 'Unverified';
  /** Snapshot fields auto-populated from transaction data */
  autoCreated?: boolean;
  autoCreatedAt?: string;
}

export interface IPhysicianService {
  getAll(): Promise<ServiceResult<Physician[]>>;
  getById(id: ID): Promise<ServiceResult<Physician>>;
  getByNpi(npi: string): Promise<ServiceResult<Physician | null>>;
  add(physician: Omit<Physician, 'id'>): Promise<ServiceResult<Physician>>;
  update(id: ID, changes: Partial<Omit<Physician, 'id'>>): Promise<ServiceResult<Physician>>;
  verify(id: ID): Promise<ServiceResult<Physician>>;
  deactivate(id: ID): Promise<ServiceResult<Physician>>;
  /** Called by transaction ingestion — creates unverified record if NPI not found */
  findOrCreateByNpi(npi: string, name: { first: string; last: string }): Promise<ServiceResult<Physician>>;
}
