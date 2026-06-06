/**
 * ClientTable.tsx
 * Located at: src/pages/system/ClientTable.tsx
 *
 * Displays the list of clients in the Client Dictionary config page.
 * Includes inline search + status filter so ClientDictionaryPage stays lean.
 *
 * Props:
 *   clients   — Client[]
 *   onEdit    — (clientId: string) => void
  *   onToggleActive — (id: string, active: boolean) => void
 */

import { useState, useMemo } from "react";
import '../../../pathscribe.css'; // Note: if this file is at src/pages/system/ level, change to '../../pathscribe.css'
import { Client } from "../../../contexts/useClientDictionary";

interface ClientTableProps {
  clients: Client[];
  onEdit: (clientId: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | "internal" | "external";

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEdit,
  onToggleActive,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  
  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients.filter((c) => {
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (typeFilter !== "all" && c.clientType !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        (c.hl7.receivingFacility ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, search, statusFilter, typeFilter]);

  // ── Delete confirmation ────────────────────────────────────────────────────

  // ── Styles ─────────────────────────────────────────────────────────────────
  const filterTabBase: React.CSSProperties = {
    padding: "5px 14px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const filterTab = (active: boolean): React.CSSProperties => ({
    ...filterTabBase,
    background: active ? "#0891b2" : "transparent",
    color: active ? "#0f172a" : "#64748b",
    borderColor: active ? "#0891b2" : "rgba(255,255,255,0.1)",
  });

  // ── Empty state ────────────────────────────────────────────────────────────
  if (clients.length === 0) {
    return (
      <div style={{
        padding: "48px 24px",
        textAlign: "center",
        color: "#64748b",
        border: "1px dashed rgba(255,255,255,0.15)",
        borderRadius: "12px",
        fontSize: "14px",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏥</div>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#64748b" }}>No clients yet</div>
        <div>Click <strong>+ Add Client</strong> to define your first client.</div>
      </div>
    );
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
        flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{
            position: "absolute", left: "10px", top: "50%",
            transform: "translateY(-50%)", color: "#64748b", fontSize: "14px",
            pointerEvents: "none",
          }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, contact, facility…"
            style={{
              width: "100%",
              padding: "7px 10px 7px 32px",
              fontSize: "13px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              outline: "none",
              color: "#e2e8f0",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0891b2")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: "8px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", color: "#64748b",
                fontSize: "14px", lineHeight: 1, padding: "2px",
              }}
            >✕</button>
          )}
        </div>

        {/* Status filter tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              style={filterTab(statusFilter === f)}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Type filter tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "internal", "external"] as TypeFilter[]).map((f) => (
            <button
              key={f}
              style={filterTab(typeFilter === f)}
              onClick={() => setTypeFilter(f)}
            >
              {f === "all" ? "All Types" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
          {filtered.length} of {clients.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", width: "100%", maxWidth: "100%", paddingRight: "2px" }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: "32px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
          }}>
            No clients match your search.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["Client", "Type", "Contact", "TAT", "Status", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(8,145,178,0.06)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)")
                  }
                >
                  {/* CLIENT — name + code + address */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13 }}>{client.name}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                        background: "rgba(255,255,255,0.06)", color: "#0891b2",
                        padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>{client.code}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0, minWidth: "100%" }}>
                      {client.address}
                    </div>
                    {client.parentId && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>↳ affiliate</div>}
                  </td>

                  {/* TYPE */}
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      ...(client.clientType === "internal"
                        ? { background: "rgba(139,92,246,0.15)", color: "#c084fc" }
                        : { background: "rgba(8,145,178,0.15)", color: "#38bdf8" }) }}>
                      {client.clientType === "internal" ? "Internal" : "External"}
                    </span>
                  </td>

                  {/* CONTACT */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 500 }}>{client.contactName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0, minWidth: "100%" }}>{client.contactEmail}</div>
                  </td>

                  {/* TAT */}
                  <td style={{ padding: "10px 14px" }}>
                    {(client as any).tatFirstTouchHours != null || (client as any).tatTotalHours != null ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {(client as any).tatFirstTouchHours != null && (
                          <span style={{ fontSize: 11, color: "#38bdf8" }}>
                            {(client as any).tatFirstTouchHours}h 1st touch
                          </span>
                        )}
                        {(client as any).tatTotalHours != null && (
                          <span style={{ fontSize: 11, color: "#34d399" }}>
                            {(client as any).tatTotalHours}h total
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>Default</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: "10px 14px" }}>
                    {client.active ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10,
                        background: "rgba(16,185,129,0.15)", color: "#34d399" }}>Active</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10,
                        background: "rgba(239,68,68,0.15)", color: "#f87171" }}>Inactive</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "10px 16px 10px 8px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="ps-conf-btn-secondary"
                        onClick={() => onEdit(client.id)}
                        style={{ padding: "5px 12px", fontSize: 12 }}
                      >Edit</button>
                      <button
                        className="ps-conf-btn-secondary"
                        onClick={() => onToggleActive(client.id, !client.active)}
                        title={client.active ? "Deactivate client" : "Reactivate client"}
                        style={{ padding: "4px 10px", fontSize: 11,
                          color: client.active ? "#f87171" : "#34d399",
                          borderColor: client.active ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)",
                        }}
                      >{client.active ? "Deactivate" : "Activate"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
