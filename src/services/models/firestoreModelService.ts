// TODO: implement Firestore version
// import { IModelService } from './IModelService';
const notImplemented = (): never => { throw new Error('firestoreModelService.ts: not yet implemented'); };
export const firestoreModelService = new Proxy({}, { get: () => notImplemented }) as any;
