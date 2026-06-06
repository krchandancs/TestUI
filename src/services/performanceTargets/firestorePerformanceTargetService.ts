// src/services/performanceTargets/firestorePerformanceTargetService.ts
import { IPerformanceTargetService } from './IPerformanceTargetService';
const notImpl = (): never => { throw new Error('firestorePerformanceTargetService: not yet implemented'); };
export const firestorePerformanceTargetService: IPerformanceTargetService = {
  getAll: notImpl, getByKey: notImpl, getById: notImpl,
  add: notImpl, update: notImpl, delete: notImpl,
};
