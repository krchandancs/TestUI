/**
 * useAuditLog
 * ============================================================
 * Centralised audit logging hook for pathscribe AI.
 *
 * Usage (in any component):
 *   const { log } = useAuditLog();
 *   log("save_protocol", { name: protocol.name, changes: ["Title changed"] });
 *   log("create_macro",  { name: macro.name });
 *   log("delete_template", { name: template.name });
 *
 * All events are automatically stamped with:
 *   - The current user's email (via useAuth)
 *   - A UUID + ISO timestamp (via logEvent)
 *   - A consistently formatted detail string (built here)
 * ============================================================
 */
/**
 * useAuditLog
 * Centralised audit logging hook for pathscribe AI.
 *
 * Drop this file into src/components/Audit/useAuditLog.ts (replace existing).
 * It is typed to match src/types/AuditEvent.ts (uses `category` not `type`/`actor`).
 */

import { useAuth } from "@contexts/AuthContext";
import { logEvent } from "../../audit/auditLogger";
import type { AuditEvent, AuditEventCategory } from "../../types/AuditEvent";

// ── Action catalogue ──────────────────────────────────────────────────────────

export type AuditAction =
  | "save_protocol"
  | "clone_protocol"
  | "create_protocol"
  | "delete_protocol"
  | "open_clone_modal"
  | "cancel_clone"
  | "create_macro"
  | "update_macro"
  | "delete_macro"
  | "create_template"
  | "update_template"
  | "delete_template"
  | "update_ai_behavior"
  | "update_system_settings"
  | "create_user"
  | "update_user"
  | "delete_user"
  | "update_models"
  | "navigate_tab"
  | "clear_audit_log"
  // ── Computational Sidecar — utilization ──
  | "comp_sidecar_opened"
  | "comp_sidecar_closed"
  | "comp_result_viewed"
  | "comp_result_read_aloud"
  | "comp_tab_opened"
  | "comp_order_modal_opened"
  | "comp_orders_placed"
  | "comp_order_cancelled"
  | "comp_concordance_viewed"
  // ── Computational Sidecar — configuration ──
  | "comp_config_flag_created"
  | "comp_config_flag_updated"
  | "comp_config_flag_deactivated"
  | "comp_config_protocol_linked"
  | "comp_config_protocol_unlinked";

// ── Event type mapping ────────────────────────────────────────────────────────
// Maps each AuditAction to the high-level AuditEventCategory used by your
// project's AuditEvent type (ai | user | system).

const actionTypeMap: Record<AuditAction, AuditEventCategory> = {
  save_protocol:          "user",
  clone_protocol:         "user",
  create_protocol:        "user",
  delete_protocol:        "user",
  open_clone_modal:       "system",
  cancel_clone:           "user",
  create_macro:           "user",
  update_macro:           "user",
  delete_macro:           "user",
  create_template:        "user",
  update_template:        "user",
  delete_template:        "user",
  update_ai_behavior:     "ai",
  update_system_settings: "system",
  create_user:            "user",
  update_user:            "user",
  delete_user:            "user",
  update_models:          "user",
  navigate_tab:           "user", // <-- ensure this exists to satisfy Record<AuditAction,...>
  clear_audit_log:        "system",
  // Computational Sidecar
  comp_sidecar_opened:        "user",
  comp_sidecar_closed:        "user",
  comp_result_viewed:         "user",
  comp_result_read_aloud:     "user",
  comp_tab_opened:            "user",
  comp_order_modal_opened:    "user",
  comp_orders_placed:         "user",
  comp_order_cancelled:       "user",
  comp_concordance_viewed:    "user",
  comp_config_flag_created:   "system",
  comp_config_flag_updated:   "system",
  comp_config_flag_deactivated: "system",
  comp_config_protocol_linked:  "system",
  comp_config_protocol_unlinked: "system",
};

// ── Payload types per action ──────────────────────────────────────────────────

export type AuditPayload = {
  save_protocol:          { name: string; changes: string[] };
  clone_protocol:         { sourceId: string; sourceName: string; newId: string };
  create_protocol:        { name: string };
  delete_protocol:        { name: string; id: string };
  open_clone_modal:       { id: string; name: string };
  cancel_clone:           { id: string; name: string };
  create_macro:           { name: string };
  update_macro:           { name: string; changes: string[] };
  delete_macro:           { name: string };
  create_template:        { name: string; organ?: string };
  update_template:        { name: string; changes: string[] };
  delete_template:        { name: string };
  update_ai_behavior:     { setting: string; from: string | boolean; to: string | boolean };
  update_system_settings: { setting: string; from?: string | boolean; to: string | boolean };
  create_user:            { name: string; email: string; role: string };
  update_user:            { name: string; changes: string[] };
  delete_user:            { name: string; email: string };
  update_models:          { protocol: string; model: string };
  navigate_tab:           { tabId: string; tabName?: string };
  clear_audit_log:        Record<string, never>;
  // Computational Sidecar — utilization
  comp_sidecar_opened:        { caseId?: string; flagId?: string; source?: "click" | "voice" };
  comp_sidecar_closed:        { caseId?: string };
  comp_result_viewed:         { caseId?: string; flagId?: string; flagName?: string; status?: string };
  comp_result_read_aloud:     { caseId?: string; flagId?: string };
  comp_tab_opened:            { caseId?: string; source?: "click" | "voice" };
  comp_order_modal_opened:    { caseId?: string };
  comp_orders_placed:         { caseId?: string; count?: number; flags?: Array<{ flagId: string; lisCode?: string; specimenId?: string | null }> };
  comp_order_cancelled:       { caseId?: string; flagId?: string; flagName?: string; orderedVia?: string };
  comp_concordance_viewed:    { caseId?: string; flagId?: string; agreement?: "agrees" | "differs" };
  // Computational Sidecar — configuration
  comp_config_flag_created:   { flagId?: string; flagName?: string; dataSourceType?: string; lisCode?: string };
  comp_config_flag_updated:   { flagId?: string; changes?: string[] };
  comp_config_flag_deactivated: { flagId?: string; flagName?: string };
  comp_config_protocol_linked:  { flagId?: string; protocolId?: string };
  comp_config_protocol_unlinked: { flagId?: string; protocolId?: string };
};

// ── Detail string builders ────────────────────────────────────────────────────

function buildDetail<A extends keyof AuditPayload>(action: A, payload: AuditPayload[A]): string {
  switch (action) {
    case "save_protocol": {
      const p = payload as AuditPayload["save_protocol"];
      return p.changes.length > 0
        ? p.changes.join(" | ")
        : `Saved "${p.name}" — no changes detected`;
    }
    case "clone_protocol": {
      const p = payload as AuditPayload["clone_protocol"];
      return `Cloned "${p.sourceName}" (${p.sourceId}) → new copy (${p.newId})`;
    }
    case "create_protocol": {
      const p = payload as AuditPayload["create_protocol"];
      return `Created new protocol "${p.name}"`;
    }
    case "delete_protocol": {
      const p = payload as AuditPayload["delete_protocol"];
      return `Deleted protocol "${p.name}" (${p.id})`;
    }
    case "open_clone_modal": {
      const p = payload as AuditPayload["open_clone_modal"];
      return `Opened clone modal for "${p.name}" (${p.id})`;
    }
    case "cancel_clone": {
      const p = payload as AuditPayload["cancel_clone"];
      return `Canceled clone of "${p.name}" (${p.id})`;
    }
    case "create_macro": {
      const p = payload as AuditPayload["create_macro"];
      return `Created macro "${p.name}"`;
    }
    case "update_macro": {
      const p = payload as AuditPayload["update_macro"];
      return p.changes.length > 0
        ? `Updated macro "${p.name}": ${p.changes.join(" | ")}`
        : `Saved macro "${p.name}" — no changes detected`;
    }
    case "delete_macro": {
      const p = payload as AuditPayload["delete_macro"];
      return `Deleted macro "${p.name}"`;
    }
    case "create_template": {
      const p = payload as AuditPayload["create_template"];
      return `Created template "${p.name}"${p.organ ? ` (${p.organ})` : ""}`;
    }
    case "update_template": {
      const p = payload as AuditPayload["update_template"];
      return p.changes.length > 0
        ? `Updated template "${p.name}": ${p.changes.join(" | ")}`
        : `Saved template "${p.name}" — no changes detected`;
    }
    case "delete_template": {
      const p = payload as AuditPayload["delete_template"];
      return `Deleted template "${p.name}"`;
    }
    case "update_ai_behavior": {
      const p = payload as AuditPayload["update_ai_behavior"];
      return `${p.setting}: ${JSON.stringify(p.from)} → ${JSON.stringify(p.to)}`;
    }
    case "update_system_settings": {
      const p = payload as AuditPayload["update_system_settings"];
      return p.from !== undefined
        ? `${p.setting}: ${JSON.stringify(p.from)} → ${JSON.stringify(p.to)}`
        : `${p.setting} set to ${JSON.stringify(p.to)}`;
    }
    case "create_user": {
      const p = payload as AuditPayload["create_user"];
      return `Created user "${p.name}" (${p.email}) with role ${p.role}`;
    }
    case "update_user": {
      const p = payload as AuditPayload["update_user"];
      return p.changes.length > 0
        ? `Updated user "${p.name}": ${p.changes.join(" | ")}`
        : `Saved user "${p.name}" — no changes detected`;
    }
    case "delete_user": {
      const p = payload as AuditPayload["delete_user"];
      return `Deleted user "${p.name}" (${p.email})`;
    }
    case "update_models": {
      const p = payload as AuditPayload["update_models"];
      return `Set model for "${p.protocol}" to ${p.model}`;
    }
    case "clear_audit_log":
      return "Audit log cleared";

    // ── Computational Sidecar ──────────────────────────────────────
    case "comp_sidecar_opened": {
      const p = payload as AuditPayload["comp_sidecar_opened"];
      return `Computational sidecar opened for case ${p.caseId ?? "unknown"}${p.flagId ? ` — flag ${p.flagId}` : ""} (${p.source ?? "click"})`;
    }
    case "comp_sidecar_closed": {
      const p = payload as AuditPayload["comp_sidecar_closed"];
      return `Computational sidecar closed — case ${p.caseId ?? "unknown"}`;
    }
    case "comp_result_viewed": {
      const p = payload as AuditPayload["comp_result_viewed"];
      return `Result viewed: ${p.flagName ?? p.flagId ?? "unknown"} (${p.status ?? "PENDING"}) — case ${p.caseId ?? "unknown"}`;
    }
    case "comp_result_read_aloud": {
      const p = payload as AuditPayload["comp_result_read_aloud"];
      return `Result read aloud: flag ${p.flagId ?? "unknown"} — case ${p.caseId ?? "unknown"}`;
    }
    case "comp_tab_opened": {
      const p = payload as AuditPayload["comp_tab_opened"];
      return `Computational tab opened — case ${p.caseId ?? "unknown"} (${p.source ?? "click"})`;
    }
    case "comp_order_modal_opened": {
      const p = payload as AuditPayload["comp_order_modal_opened"];
      return `Order modal opened — case ${p.caseId ?? "unknown"}`;
    }
    case "comp_orders_placed": {
      const p = payload as AuditPayload["comp_orders_placed"];
      const names = (p.flags ?? []).map(f => f.lisCode ?? f.flagId).join(", ");
      return `${p.count ?? 0} order(s) placed — case ${p.caseId ?? "unknown"}: ${names}`;
    }
    case "comp_order_cancelled": {
      const p = payload as AuditPayload["comp_order_cancelled"];
      return `Order cancelled: ${p.flagName ?? p.flagId ?? "unknown"} (via ${p.orderedVia ?? "lis"}) — case ${p.caseId ?? "unknown"}`;
    }
    case "comp_concordance_viewed": {
      const p = payload as AuditPayload["comp_concordance_viewed"];
      return `Concordance viewed: ${p.agreement ?? "unknown"} — flag ${p.flagId ?? "unknown"}, case ${p.caseId ?? "unknown"}`;
    }
    case "comp_config_flag_created": {
      const p = payload as AuditPayload["comp_config_flag_created"];
      return `Computational flag created: "${p.flagName ?? p.flagId}" (${p.dataSourceType ?? "unknown"}, LIS code: ${p.lisCode ?? "none"})`;
    }
    case "comp_config_flag_updated": {
      const p = payload as AuditPayload["comp_config_flag_updated"];
      return `Computational flag updated: ${p.flagId} — changed: ${(p.changes ?? []).join(", ")}`;
    }
    case "comp_config_flag_deactivated": {
      const p = payload as AuditPayload["comp_config_flag_deactivated"];
      return `Computational flag deactivated: "${p.flagName ?? p.flagId}"`;
    }
    case "comp_config_protocol_linked": {
      const p = payload as AuditPayload["comp_config_protocol_linked"];
      return `Protocol linked to flag ${p.flagId}: protocol ${p.protocolId}`;
    }
    case "comp_config_protocol_unlinked": {
      const p = payload as AuditPayload["comp_config_protocol_unlinked"];
      return `Protocol unlinked from flag ${p.flagId}: protocol ${p.protocolId}`;
    }

    default:
      return JSON.stringify(payload);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditLog() {
  const { user } = useAuth();

  function log<A extends keyof AuditPayload>(action: A, payload: AuditPayload[A]) {
    // Build an object that exactly matches Omit<AuditEvent, 'id' | 'timestamp'>
    const eventPayload: Omit<AuditEvent, "id" | "timestamp"> = {
      // `user` in AuditEvent is the actor name/email; here we use the authenticated email.
      user: user?.email || "unknown",
      // `category` is required by your AuditEvent type and must be one of AuditEventCategory.
      category: actionTypeMap[action],
      // machine-readable action identifier
      action,
      // human-readable detail string
      detail: buildDetail(action, payload),
      // optional fields can be added here if relevant (templateId, stateFrom, etc.)
    };

    logEvent(eventPayload);
  }

  return { log };
}
