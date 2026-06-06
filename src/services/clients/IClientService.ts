import { ServiceResult, ID } from '../types';

export interface Client {
  id: ID;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  email: string;
  contactName: string;
  contactTitle: string;
  notes: string;
  status: 'Active' | 'Inactive';
}

export interface IClientService {
  getAll(): Promise<ServiceResult<Client[]>>;
  getById(id: ID): Promise<ServiceResult<Client>>;
  add(client: Omit<Client, 'id'>): Promise<ServiceResult<Client>>;
  update(id: ID, changes: Partial<Omit<Client, 'id'>>): Promise<ServiceResult<Client>>;
  deactivate(id: ID): Promise<ServiceResult<Client>>;
  reactivate(id: ID): Promise<ServiceResult<Client>>;
}
