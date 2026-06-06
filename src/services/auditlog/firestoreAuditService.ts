// firestoreAuditService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firestore implementation stub — Phase 2.
//
// TODO: Implement using Firestore collections:
//   - 'audit_logs'  (read-only from client; written by Cloud Functions / server)
//   - 'error_logs'  (read-only from client; written by Cloud Functions / server)
//
// Note: In production, audit and error log writes should go through a
// server-side function (Cloud Function / API route) to ensure tamper-resistance.
// The logEvent() and logError() methods here may simply POST to that endpoint
// rather than writing to Firestore directly from the client.
// ─────────────────────────────────────────────────────────────────────────────

import type { ServiceResult, ID } from '../types';
import type {
  AuditLog, ErrorLog,
  NewAuditLog, NewErrorLog,
  AuditFilterParams, ErrorFilterParams,
  IAuditService,
} from './IAuditService';

export const firestoreAuditService: IAuditService = {
  async getAuditLogs(_filters?: AuditFilterParams): Promise<ServiceResult<AuditLog[]>> {
    throw new Error('firestoreAuditService.getAuditLogs — not yet implemented');
  },

  async logEvent(_entry: NewAuditLog): Promise<ServiceResult<AuditLog>> {
    throw new Error('firestoreAuditService.logEvent — not yet implemented');
  },

  async getErrorLogs(_filters?: ErrorFilterParams): Promise<ServiceResult<ErrorLog[]>> {
    throw new Error('firestoreAuditService.getErrorLogs — not yet implemented');
  },

  async logError(_entry: NewErrorLog): Promise<ServiceResult<ErrorLog>> {
    throw new Error('firestoreAuditService.logError — not yet implemented');
  },

  async resolveError(_id: ID): Promise<ServiceResult<ErrorLog>> {
    throw new Error('firestoreAuditService.resolveError — not yet implemented');
  },
};
