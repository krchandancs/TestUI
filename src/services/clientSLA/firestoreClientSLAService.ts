// src/services/clientSLA/firestoreClientSLAService.ts
import { IClientSLAService } from './IClientSLAService';
const notImpl = (): never => { throw new Error('firestoreClientSLAService: not yet implemented'); };
export const firestoreClientSLAService: IClientSLAService = {
  getAll: notImpl, getById: notImpl, getByClientCode: notImpl,
  add: notImpl, update: notImpl, delete: notImpl,
};
