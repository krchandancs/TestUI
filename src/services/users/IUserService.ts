// src/services/users/IUserService.ts
import { VoiceProfileId } from '../../constants/voiceProfiles';
import { ServiceResult, ID } from '../types';

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  npi: string;
  license: string;
  phone: string;
  department: string;
  signatureUrl?: string;
  status: 'Active' | 'Inactive';
  /** The personal linguistic override.
   * If undefined/null, the system falls back to the Global Facility Profile.
   */
  voiceProfile?: VoiceProfileId | null;
  /** Professional credentials suffix (e.g. MD, FCAP, MBChB, FRCPath) */
  credentials?: string;
  /** Option C — user-level pediatric qualification flag.
   * Must also be on the client's authorizedPediatricPathologistIds list. */
  canViewPediatric?: boolean;
  /** GMC number for UK users */
  gmcNumber?: string;
  /** Middle name or initial */
  middleName?: string;
}

export interface IUserService {
  getAll(): Promise<ServiceResult<StaffUser[]>>;
  getById(id: ID): Promise<ServiceResult<StaffUser>>;
  add(user: Omit<StaffUser, 'id'>): Promise<ServiceResult<StaffUser>>;
  update(id: ID, changes: Partial<Omit<StaffUser, 'id'>>): Promise<ServiceResult<StaffUser>>;
  deactivate(id: ID): Promise<ServiceResult<StaffUser>>;
  reactivate(id: ID): Promise<ServiceResult<StaffUser>>;
}
