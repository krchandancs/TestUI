import { ServiceResult, ID } from '../types';

export interface DelegationType {
  id:                 ID;
  label:              string;
  description:        string;
  transfersOwnership: boolean;
  requiresNote:       boolean;
  /** When true the delegate modal allows selecting multiple recipients */
  multiAssign:        boolean;
  color:              string;
  active:             boolean;
  isSystem:           boolean;   // system types can be toggled but never deleted
  sortOrder:          number;
  cptHint?:           string;
}

export interface IDelegationTypeService {
  getAll():                                                    Promise<ServiceResult<DelegationType[]>>;
  getActive():                                                 Promise<ServiceResult<DelegationType[]>>;
  getById(id: ID):                                             Promise<ServiceResult<DelegationType>>;
  add(dt: Omit<DelegationType, 'id' | 'isSystem'>):           Promise<ServiceResult<DelegationType>>;
  update(id: ID, changes: Partial<Omit<DelegationType, 'id' | 'isSystem'>>): Promise<ServiceResult<DelegationType>>;
  deactivate(id: ID):                                          Promise<ServiceResult<DelegationType>>;
  reactivate(id: ID):                                          Promise<ServiceResult<DelegationType>>;
  /** Permanently removes a custom type. Rejects system types. */
  remove(id: ID):                                              Promise<ServiceResult<void>>;
}
