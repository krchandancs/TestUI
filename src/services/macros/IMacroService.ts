import { ServiceResult, ID } from '../types';

export type MacroCategory = 'Diagnosis' | 'Gross Description' | 'Microscopic' | 'Comment' | 'Addendum' | 'Custom';

export interface Macro {
  id: ID;
  name: string;
  shortcut: string;          // e.g. ".norm" — typed in editor to expand
  category: MacroCategory;
  content: string;           // Rich text / plain text body
  subspecialtyIds: string[]; // Empty = available to all
  snomedCodes: string[];     // Associated SNOMED codes
  icdCodes: string[];        // Associated ICD-10 codes
  createdBy: string;         // userId
  status: 'Active' | 'Inactive';
}

export interface IMacroService {
  getAll(): Promise<ServiceResult<Macro[]>>;
  getById(id: ID): Promise<ServiceResult<Macro>>;
  getByShortcut(shortcut: string): Promise<ServiceResult<Macro | null>>;
  getForSubspecialty(subspecialtyId: string): Promise<ServiceResult<Macro[]>>;
  add(macro: Omit<Macro, 'id'>): Promise<ServiceResult<Macro>>;
  update(id: ID, changes: Partial<Omit<Macro, 'id'>>): Promise<ServiceResult<Macro>>;
  deactivate(id: ID): Promise<ServiceResult<Macro>>;
  reactivate(id: ID): Promise<ServiceResult<Macro>>;
}
