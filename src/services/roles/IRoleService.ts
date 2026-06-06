import { ServiceResult, ID } from '../types';
export type PermissionSet = Partial<Record<string, boolean>>;
export interface Role {
  id: ID;
  name: string;
  description: string;
  color: string;
  caseAccess: boolean;
  configAccess: boolean;
  /** When true, pathologists with this role may open cases where the patient
   *  age is below the submitting client's pediatricAgeThreshold.
   *  Defaults to false — must be explicitly granted by an administrator. */
  canViewPediatric: boolean;
  permissions: PermissionSet;
  builtIn: boolean;
  clientIds?: string[];               // undefined / empty = all clients
  participationTypeIds?: string[];    // IDs from ParticipationTypesSection master list
}
export interface IRoleService {
  getAll(): Promise<ServiceResult<Role[]>>;
  getById(id: ID): Promise<ServiceResult<Role>>;
  add(role: Omit<Role, 'id'>): Promise<ServiceResult<Role>>;
  update(id: ID, changes: Partial<Omit<Role, 'id'>>): Promise<ServiceResult<Role>>;
  delete(id: ID): Promise<ServiceResult<void>>;
}
