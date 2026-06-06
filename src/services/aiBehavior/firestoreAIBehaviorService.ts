// TODO: implement Firestore version
// import { IAIBehaviorService } from './IAIBehaviorService';
const notImplemented = (): never => { throw new Error('firestoreAIBehaviorService.ts: not yet implemented'); };
export const firestoreAIBehaviorService = new Proxy({}, { get: () => notImplemented }) as any;
