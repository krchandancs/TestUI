import { IRoleService } from './IRoleService';

const notImplemented = (): never => { throw new Error('firestoreRoleService: not yet implemented'); };

export const firestoreRoleService: IRoleService = {
  getAll:  notImplemented,
  getById: notImplemented,
  add:     notImplemented,
  update:  notImplemented,
  delete:  notImplemented,
};
