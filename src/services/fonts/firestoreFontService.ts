// TODO: implement Firestore version
// import { IFontService } from './IFontService';
const notImplemented = (): never => { throw new Error('firestoreFontService.ts: not yet implemented'); };
export const firestoreFontService = new Proxy({}, { get: () => notImplemented }) as any;
