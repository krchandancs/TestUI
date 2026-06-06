// TODO: implement Firestore version
// import { ISavedSearchService } from './ISavedSearchService';
const notImplemented = (): never => { throw new Error('firestoreSavedSearchService.ts: not yet implemented'); };
export const firestoreSavedSearchService = new Proxy({}, { get: () => notImplemented }) as any;
