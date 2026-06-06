import { AuditEvent } from "../types/AuditEvent";

const AUDIT_LOG_KEY = "ps_audit_log_v1";

export function getAuditLog(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEvent[];
  } catch {
    return [];
  }
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

export function logEvent(event: Omit<AuditEvent, "id" | "timestamp">) {
  const existing = getAuditLog();
  const fullEvent: AuditEvent = {
    ...event,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    timestamp: new Date().toISOString()
  };
  const next = [...existing, fullEvent];
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
}
