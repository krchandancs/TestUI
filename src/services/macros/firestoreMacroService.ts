// TODO: implement Firestore version
// import { IMacroService } from './IMacroService';
const notImplemented = (): never => { throw new Error('firestoreMacroService.ts: not yet implemented'); };
export const firestoreMacroService = new Proxy({}, { get: () => notImplemented }) as any;
