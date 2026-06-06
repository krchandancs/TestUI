// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS to src/services/index.ts
//
// To swap to Firestore, change one line:
//   import { firestoreAuditService } from './auditlog/firestoreAuditService';
//   export const auditService = firestoreAuditService;
// ─────────────────────────────────────────────────────────────────────────────

import { mockAuditService }     from './auditlog/mockAuditService';
// import { firestoreAuditService } from './auditlog/firestoreAuditService';

export const auditService = mockAuditService;
// export const auditService = firestoreAuditService;
