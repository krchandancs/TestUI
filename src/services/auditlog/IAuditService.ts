import { ServiceResult, ID } from '../types';

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditLogType = 'ai' | 'user' | 'system';

export interface AuditLog {
  id:         ID;
  timestamp:  string;            // ISO-like 'YYYY-MM-DD HH:mm:ss'
  type:       AuditLogType;
  event:      string;
  detail:     string;            // PHI-safe: no patient names, DOB, MRN, or clinical values
  user:       string;            // display name of acting user or system actor
  caseId:     string | null;     // accession number — not a direct patient identifier
  confidence: number | null;     // AI confidence % where applicable
}

export type NewAuditLog = Omit<AuditLog, 'id' | 'timestamp'>;

// ─── Error Log ────────────────────────────────────────────────────────────────

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorLog {
  id:        ID;
  timestamp: string;
  severity:  ErrorSeverity;
  code:      string;
  message:   string;
  source:    string;
  caseId:    string | null;
  resolved:  boolean;
}

export type NewErrorLog = Omit<ErrorLog, 'id' | 'timestamp' | 'resolved'>;

// ─── Filter Params ────────────────────────────────────────────────────────────

export interface AuditFilterParams {
  type?:      AuditLogType | 'all';
  user?:      string;            // display name or 'all'
  dateFrom?:  string;            // 'YYYY-MM-DD'
  dateTo?:    string;            // 'YYYY-MM-DD'
  search?:    string;
}

export interface ErrorFilterParams {
  severity?:  ErrorSeverity | 'all';
  resolved?:  boolean | 'all';
  search?:    string;
}

// ─── Service Interface ────────────────────────────────────────────────────────

export interface IAuditService {
  // Audit log
  getAuditLogs(filters?: AuditFilterParams): Promise<ServiceResult<AuditLog[]>>;
  logEvent(entry: NewAuditLog):              Promise<ServiceResult<AuditLog>>;

  // Error log
  getErrorLogs(filters?: ErrorFilterParams): Promise<ServiceResult<ErrorLog[]>>;
  logError(entry: NewErrorLog):              Promise<ServiceResult<ErrorLog>>;
  resolveError(id: ID):                      Promise<ServiceResult<ErrorLog>>;
}
