/**
 * AuditLogger
 *
 * Structured access logging for DSPT (NHS Data Security and Protection
 * Toolkit) and UK GDPR Article 5(f) / Article 25 compliance.
 *
 * Each ICaseService implementation holds its own AuditLogger instance
 * so audit trails are partitioned by data source.  This matters for
 * medico-legal purposes: the system of record for a finalised report
 * must be unambiguous and its access log must be independently auditable.
 *
 * Production:
 *  - Swap console.debug for a write to Azure Monitor / Splunk / NHS Spine
 *  - Add user role, justification code, and data controller reference
 *  - Ensure logs are append-only and tamper-evident (WORM storage)
 */

export type AuditEventType =
  | 'case.read'
  | 'case.list'
  | 'case.write'
  | 'case.delete';

export interface AuditEvent {
  eventType:  AuditEventType;
  serviceId:  string;           // which data source was accessed
  caseId?:    string;           // omitted for list operations
  userId:     string;           // authenticated pathologist ID
  timestamp:  string;           // ISO-8601
  outcome:    'success' | 'failure';
  // Production additions:
  // justificationCode?: string; // RCPath / CAP access justification
  // sessionId?:         string; // tie to authenticated session
  // dataController?:    string; // NHS Trust / lab identifier
}

export class AuditLogger {
  constructor(private readonly serviceId: string) {}

  log(event: Omit<AuditEvent, 'serviceId' | 'timestamp'>): void {
    const entry: AuditEvent = {
      ...event,
      serviceId: this.serviceId,
      timestamp: new Date().toISOString(),
    };

    // Dev: structured console output so audit events are visible in DevTools
    // Production: replace with write to DSPT-compliant audit store
    if (import.meta.env.DEV) {
      console.debug('[AUDIT]', entry);
    }
  }
}
