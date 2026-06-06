import React, { useState } from "react";
import '../../../pathscribe.css';
import { useSubspecialties, Subspecialty } from "../../../contexts/useSubspecialties";
import { useSpecimens } from "../../../contexts/useSpecimens";
import {
  overlay, modalBox, modalHeaderStyle, modalFooterStyle,
  cancelButtonStyle, applyButtonStyle,
} from "../../Common/modalStyles";
import { userService } from "../../../services";
import { StaffUser } from "../Staff/StaffTab";
import { mockClientService, Client } from "../../../services/clients/mockClientService";



const FIELD: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" };
const INPUT: React.CSSProperties = { padding: "9px 12px", fontSize: 13, color: "#e5e7eb", background: "#0f0f0f", border: "1px solid #374151", borderRadius: 7, outline: "none", width: "100%", boxSizing: "border-box" };

const BADGE_STYLES: Record<string, { borderColor: string; color: string; background: string }> = {
  gi:              { borderColor: "#4A8F5A", color: "#7EC89A", background: "#0d2318" },
  dermatology:     { borderColor: "#B8863C", color: "#E0B96A", background: "#2a1e08" },
  breast:          { borderColor: "#4A9EBF", color: "#7FC8E8", background: "#0d2a36" },
  gynecologic:     { borderColor: "#8A6FA8", color: "#C4ABDF", background: "#1e1530" },
  gu:              { borderColor: "#5A6FA8", color: "#9AABDF", background: "#141c30" },
  hematopathology: { borderColor: "#7A9A4A", color: "#AECB78", background: "#1a220d" },
  general:         { borderColor: "#444",    color: "#888",    background: "#1a1a1a"  },
};
const getBadge = (name: string) => BADGE_STYLES[name.toLowerCase()] ?? BADGE_STYLES["general"];

const Avatar = ({ name }: { name: string }) => {
  const words = name.trim().split(" ");
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: "50%", flexShrink: 0, background: "radial-gradient(circle at 35% 35%, #4a6fa8, #1a2a4a 60%, #0d1525)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
      {initials}
    </div>
  );
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, background: value ? "#22c55e" : "#374151", boxShadow: value ? "0 0 8px #22c55e55" : "none" }}>
      <div style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: value ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? "#22c55e" : "#6b7280" }}>{value ? "Active" : "Inactive"}</span>
  </div>
);

const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div style={{ position: "relative", marginBottom: 8 }}>
    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#4b5563", pointerEvents: "none" }}>&#128269;</span>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "7px 10px 7px 30px", fontSize: 12, color: "#d1d5db", background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 6, outline: "none", boxSizing: "border-box" }}
    />
    {value && (
      <span onClick={() => onChange("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#4b5563", cursor: "pointer" }}>&#10005;</span>
    )}
  </div>
);

const CheckRow = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) => (
  <div onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 7, cursor: "pointer", marginBottom: 2, background: checked ? "rgba(34,197,94,0.06)" : "transparent", border: `1px solid ${checked ? "rgba(34,197,94,0.2)" : "transparent"}`, transition: "all 0.15s" }}>
    <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? "#22c55e" : "#374151"}`, background: checked ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
      {checked && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>&#10003;</span>}
    </div>
    <div>
      <div style={{ fontSize: 13, color: "#f9fafb", fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const ImpactRow = ({ name, sub }: { name: string; sub?: string }) => (
  <div style={{ padding: "8px 14px", borderBottom: "1px solid #111827", fontSize: 13, color: "#d1d5db", display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", flexShrink: 0, display: "inline-block" }} />
    {name}
    {sub && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 2 }}>({sub})</span>}
  </div>
);

type Draft = { 
  name: string; 
  active: boolean; 
  userIds: string[]; 
  description: string;      
  isWorkgroup: boolean;     
  clientIds: string[];      
};
const emptyDraft: Draft = { 
  name: "", 
  active: true, 
  userIds: [], 
  description: "",          
  isWorkgroup: false,       
  clientIds: []             
};

type InactiveConfirm = {
  sub: Subspecialty; draft: Draft; specimenAssignments: string[];
  affectedSpecimens: { id: string; name: string }[];
  affectedUsers: { id: string; name: string; role: string }[];
};
type ReactivateConfirm = { sub: Subspecialty; draft: Draft; specimenAssignments: string[] };

const SubspecialtiesSection: React.FC = () => {
  const { subspecialties, addSubspecialty, updateSubspecialty } = useSubspecialties();
  const { specimens, updateSpecimen } = useSpecimens();
  const [users,   setUsers]   = useState<StaffUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  React.useEffect(() => {
    userService.getAll().then(res => { if (res.ok) setUsers(res.data); });
    mockClientService.getAll().then(res => { if (res.ok) setClients(res.data); });
  }, []);

  const [search, setSearch]                           = useState("");
  const [statusFilter, setStatusFilter]               = useState<"All" | "Active" | "Inactive">("All");
  const [showModal, setShowModal]                     = useState(false);
  const [modalMode, setModalMode]                     = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget]                   = useState<Subspecialty | null>(null);
  const [draft, setDraft]                             = useState<Draft>(emptyDraft);
  const [activeTab, setActiveTab]                     = useState<"specimens" | "physicians" | "clients">("specimens");
  const [specimenAssignments, setSpecimenAssignments] = useState<string[]>([]);
  const [specimenSearch, setSpecimenSearch]           = useState("");
  const [physicianSearch, setPhysicianSearch]         = useState("");
  const [clientSearch, setClientSearch]               = useState("");
  const [inactiveConfirm, setInactiveConfirm]         = useState<InactiveConfirm | null>(null);
  const [nameError, setNameError]                     = useState("");
  const [reactivateConfirm, setReactivateConfirm]     = useState<ReactivateConfirm | null>(null);

  const filtered = subspecialties.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || (statusFilter === "Active" ? s.active !== false : s.active === false);
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setModalMode("add"); setEditTarget(null); setDraft(emptyDraft);
    setSpecimenAssignments([]); setSpecimenSearch(""); setPhysicianSearch(""); setClientSearch("");
    setActiveTab("specimens"); setNameError(""); setShowModal(true);
  };

  const openEdit = (sub: Subspecialty) => {
    setModalMode("edit"); 
    setEditTarget(sub);
    setDraft({ 
      name: sub.name, 
      active: sub.active !== false, 
      userIds: [...sub.userIds],
      description: (sub as any).description || "",
      isWorkgroup: (sub as any).isWorkgroup || false,
      clientIds: (sub as any).clientIds || [],
    });
    setSpecimenAssignments(specimens.filter((sp) => sp.subspecialtyId === sub.id).map((sp) => sp.id));
    setSpecimenSearch(""); setPhysicianSearch(""); setClientSearch("");
    setActiveTab("specimens"); setNameError(""); setShowModal(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) { setNameError("Name is required"); return; }
    const wasActive = editTarget ? editTarget.active !== false : true;

    if (modalMode === "edit" && wasActive && !draft.active) {
      const affectedSpecimens = specimens.filter((sp) => sp.subspecialtyId === editTarget!.id);
      const affectedUsers     = users.filter((u) => editTarget!.userIds.includes(u.id));
      if (affectedSpecimens.length > 0 || affectedUsers.length > 0) {
        setInactiveConfirm({ sub: editTarget!, draft, specimenAssignments, affectedSpecimens: affectedSpecimens.map((sp) => ({ id: sp.id, name: sp.name })), affectedUsers: affectedUsers.map((u: any) => ({ id: u.id, name: (u as any).name ?? u.id, role: (u as any).role ?? (u.roles?.[0] ?? '') })) });
        return;
      }
    }

    if (modalMode === "edit" && !wasActive && draft.active) {
      setReactivateConfirm({ sub: editTarget!, draft, specimenAssignments });
      return;
    }

    commitSave(draft, specimenAssignments, editTarget, false);
  };

  const commitSave = (d: Draft, spAssignments: string[], target: Subspecialty | null, unlinkAll: boolean) => {
    const subId = modalMode === "add" ? d.name.toLowerCase().replace(/\s+/g, "-") : target!.id;
    if (modalMode === "add") {
      addSubspecialty({ name: d.name, active: d.active, userIds: d.userIds, specimenIds: [], clientIds: d.clientIds, isWorkgroup: d.isWorkgroup, description: d.description, status: d.active ? 'Active' : 'Inactive' } as any as any as any);
    } else {
     updateSubspecialty({ ...target!, name: d.name, active: d.active, userIds: unlinkAll ? [] : d.userIds, clientIds: d.clientIds, isWorkgroup: d.isWorkgroup, description: d.description, status: d.active ? 'Active' : 'Inactive' } as any);
    }
    specimens.forEach((sp) => {
      const shouldBelong     = !unlinkAll && spAssignments.includes(sp.id);
      const currentlyBelongs = sp.subspecialtyId === subId;
      if (shouldBelong && !currentlyBelongs) {
        updateSpecimen({ ...sp, subspecialtyId: subId, subspecialtyName: d.name, updatedBy: "manual", updatedAt: new Date().toISOString(), version: sp.version + 1 });
      } else if (!shouldBelong && currentlyBelongs) {
        updateSpecimen({ ...sp, subspecialtyId: "", subspecialtyName: "", updatedBy: "manual", updatedAt: new Date().toISOString(), version: sp.version + 1 });
      }
    });
    setShowModal(false); setInactiveConfirm(null); setReactivateConfirm(null);
  };

  // Filtered lists for modal tabs
  const filteredSpecimens = specimens.filter(sp => sp.name?.trim() && (!specimenSearch || sp.name.toLowerCase().includes(specimenSearch.toLowerCase())));
  const filteredPhysicians = users.filter(u => u.roles?.includes("Pathologist") || u.roles?.includes("Resident")).filter(u => !physicianSearch || `${u.firstName} ${u.lastName}`.toLowerCase().includes(physicianSearch.toLowerCase()));

  const ROW_PAD    = "10px 20px";
  const HEADER_PAD = "12px 20px";
  const chevron    = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Subspecialties</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Manage pathology subspecialties, specimen groups, and physician assignments.</p>
        </div>
        <button onClick={openAdd} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #1a6080, #0d4a63)", border: "1px solid #2a7a9a", borderRadius: 8, cursor: "pointer", boxShadow: "0 0 16px rgba(0,163,196,0.2)" }}>
          + Add Subspecialty
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search subspecialties..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 16px", fontSize: 13, color: "#d1d5db", background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 8, outline: "none" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ padding: "9px 36px 9px 14px", fontSize: 13, fontWeight: 600, color: "#d1d5db", background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={{ border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "35%" }} /><col style={{ width: "25%" }} />
              <col style={{ width: "20%" }} /><col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#0a0a0a", borderBottom: "1px solid #1f2937", position: "sticky", top: 0, zIndex: 1 }}>
                {[["Subspecialty Name","left"],["Category","left"],["Status","left"],["Actions","right"]].map(([label, align]) => (
                  <th key={label} style={{ padding: HEADER_PAD, fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: align as any }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, idx) => {
                const badge    = getBadge(sub.name);
                const isActive = sub.active !== false;
                return (
                  <tr key={sub.id} style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #111827" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: ROW_PAD }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={sub.name} />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{sub.name}</span>
                            {(sub as any).isWorkgroup && (
                              <span title="Workgroup / Pool" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block", boxShadow: "0 0 6px #22c55e99" }} />
                            )}
                          </div>
                          {(sub as any).description && (
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                              {(sub as any).description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: ROW_PAD }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${badge.borderColor}`, color: badge.color, background: badge.background }}>{sub.id}</span>
                    </td>
                    <td style={{ padding: ROW_PAD }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", background: isActive ? "#22c55e" : "#4b5563", boxShadow: isActive ? "0 0 6px #22c55e99" : "none" }} />
                        <span style={{ fontSize: 13, color: isActive ? "#d1d5db" : "#6b7280" }}>{isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td style={{ padding: ROW_PAD, textAlign: "right" }}>
                      <button onClick={() => openEdit(sub)}
                        style={{ padding: "5px 16px", fontSize: 13, fontWeight: 600, color: "#e5e7eb", background: "#1c1c1c", border: "1px solid #374151", borderRadius: 7, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#252525"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#4b5563"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1c1c1c"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151"; }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "32px 20px", textAlign: "center", color: "#4b5563", fontSize: 13 }}>No subspecialties match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#22c55e" }}>&#9679;</span> System Live Sync</div>
        <div>{subspecialties.length} subspecialties</div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 620, maxHeight: "95vh", padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ ...modalHeaderStyle, padding: "20px 24px 0", flexShrink: 0 }}>{modalMode === "edit" ? `Edit \u2014 ${editTarget?.name}` : "Add Subspecialty"}</div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", maxHeight: "calc(90vh - 80px)" }}>

              <div style={FIELD}>
                <label style={LABEL}>Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={{ ...INPUT, borderColor: nameError ? "#ef4444" : "#374151" }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Breast, GI, Neuropathology..." />
                {nameError && <span style={{ fontSize: 11, color: "#ef4444" }}>{nameError}</span>}
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Status</label>
                <Toggle value={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
                {modalMode === "edit" && editTarget?.active !== false && !draft.active && (() => {
                  const spCount   = specimens.filter((sp) => sp.subspecialtyId === editTarget!.id).length;
                  const userCount = editTarget!.userIds.length;
                  if (spCount === 0 && userCount === 0) return null;
                  return (
                    <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 7, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)", fontSize: 12, color: "#fbbf24", lineHeight: 1.5 }}>
                      &#9888;&nbsp; Saving will unlink&nbsp;
                      {spCount > 0 && <strong>{spCount} specimen{spCount !== 1 ? "s" : ""}</strong>}
                      {spCount > 0 && userCount > 0 && " and "}
                      {userCount > 0 && <strong>{userCount} physician{userCount !== 1 ? "s" : ""}</strong>}.
                      &nbsp;You will be asked to confirm.
                    </div>
                  );
                })()}
                {modalMode === "edit" && editTarget?.active === false && draft.active && (
                  <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 7, background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.25)", fontSize: 12, color: "#60a5fa", lineHeight: 1.5 }}>
                    &#8635;&nbsp; Previous assignments were cleared when inactivated. You will be reminded to reassign after reactivation.
                  </div>
                )}
              </div>

              {/* Assignment Mode */}
              <div style={FIELD}>
                <label style={LABEL}>Assignment Mode</label>
                <div
                  onClick={() => setDraft(prev => ({ ...prev, isWorkgroup: !prev.isWorkgroup }))}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${draft.isWorkgroup ? "rgba(251,191,36,0.4)" : "#1f2937"}`, background: draft.isWorkgroup ? "rgba(251,191,36,0.06)" : "#0a0a0a", transition: "all 0.15s" }}
                >
                  <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", flexShrink: 0, background: draft.isWorkgroup ? "#f59e0b" : "#374151", transition: "background 0.2s", boxShadow: draft.isWorkgroup ? "0 0 8px #f59e0b55" : "none" }}>
                    <div style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: draft.isWorkgroup ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: draft.isWorkgroup ? "#fbbf24" : "#e5e7eb" }}>
                      {draft.isWorkgroup ? "Pool / Workgroup" : "Create Workgroup"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      {draft.isWorkgroup
                        ? "Cases go to a shared queue — any member can claim"
                        : "Toggle on to enable shared pool mode for this subspecialty"}
                    </div>
                  </div>
                  {draft.isWorkgroup && (
                    <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                      WORKGROUP
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={FIELD}>
                <label style={LABEL}>Description <span style={{ color: "#4b5563", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input
                  style={INPUT}
                  value={draft.description}
                  onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Administrative notes about this subspecialty or pool..."
                />
              </div>

              {/* Assignment tabs */}
              <div style={{ border: "1px solid #1f2937", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", background: "#0a0a0a", borderBottom: "1px solid #1f2937" }}>
                  {([["specimens", "Specimens"], ["physicians", "Physicians"], ["clients", "Clients"]] as const).map(([tab, label]) => {
                    const count = tab === "specimens" ? specimenAssignments.length : 
                    tab === "physicians" ? draft.userIds.length : 
                    draft.clientIds.length;
                    const isActive = activeTab === tab;
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: isActive ? "2px solid #00A3C4" : "2px solid transparent", color: isActive ? "#00A3C4" : "#6b7280", transition: "all 0.15s" }}>
                        {label}
                        <span style={{ marginLeft: 8, padding: "1px 7px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: count > 0 ? "rgba(0,163,196,0.15)" : "#1a1a1a", color: count > 0 ? "#00A3C4" : "#4b5563", border: `1px solid ${count > 0 ? "rgba(0,163,196,0.3)" : "#2a2a2a"}` }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div style={{ background: "#0d0d0d", height: 440, display: "flex", flexDirection: "column" }}>
                  {activeTab === "specimens" && (
                    <>
                      <div style={{ padding: "10px 10px 4px" }}>
                        <SearchInput value={specimenSearch} onChange={setSpecimenSearch} placeholder="Search specimens..." />
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 10px" }}>
                        {filteredSpecimens.length === 0
                          ? <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, padding: "16px 0" }}>{specimenSearch ? "No specimens match your search." : "No specimens available."}</div>
                          : filteredSpecimens.map((sp) => {
                              const takenBy = sp.subspecialtyId && sp.subspecialtyId !== editTarget?.id ? sp.subspecialtyName : null;
                              return <CheckRow key={sp.id} label={sp.name} sub={takenBy ? `Currently in: ${takenBy}` : sp.description || undefined} checked={specimenAssignments.includes(sp.id)} onChange={() => setSpecimenAssignments(prev => prev.includes(sp.id) ? prev.filter(x => x !== sp.id) : [...prev, sp.id])} />;
                            })
                        }
                      </div>
                    </>
                  )}

                  {activeTab === "physicians" && (
                    <>
                      <div style={{ padding: "10px 10px 4px" }}>
                        <SearchInput value={physicianSearch} onChange={setPhysicianSearch} placeholder="Search physicians..." />
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 10px" }}>
                        {filteredPhysicians.length === 0
                          ? <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, padding: "16px 0" }}>{physicianSearch ? "No physicians match your search." : "No physicians available."}</div>
                          : filteredPhysicians.map((u) => (
                              <CheckRow key={u.id} label={`${u.firstName} ${u.lastName}`} sub={u.roles?.join(", ")} checked={draft.userIds.includes(u.id)} onChange={() => setDraft(prev => ({ ...prev, userIds: prev.userIds.includes(u.id) ? prev.userIds.filter(x => x !== u.id) : [...prev.userIds, u.id] }))} />
                            ))
                        }
                      </div>
                    </>
                  )}

                  {activeTab === "clients" && (
                    <>
                      <div style={{ padding: "10px 10px 4px" }}>
                        <SearchInput value={clientSearch} onChange={setClientSearch} placeholder="Search clients..." />
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 10px" }}>
                        {clients
                          .filter(c => c.status === 'Active')
                          .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                          .length === 0
                          ? <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, padding: "16px 0" }}>{clientSearch ? "No clients match your search." : "No clients available."}</div>
                          : clients
                              .filter(c => c.status === 'Active')
                              .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                              .map((c) => (
                                <CheckRow
                                  key={c.id}
                                  label={c.name}
                                  sub={c.code}
                                  checked={draft.clientIds.includes(c.id)}
                                  onChange={() => setDraft(prev => ({
                                    ...prev,
                                    clientIds: prev.clientIds.includes(c.id)
                                      ? prev.clientIds.filter(x => x !== c.id)
                                      : [...prev.clientIds, c.id]
                                  }))}
                                />
                              ))
                        }
                      </div>
                    </>
                  )}
                </div> {/* Closes background #0d0d0d */}
            </div> {/* Closes assignment tabs border div */}
          </div> {/* Closes modal content padding div */}

          <div style={{ ...modalFooterStyle, padding: "12px 24px", borderTop: "1px solid #1f2937", flexShrink: 0 }}>
            <button style={cancelButtonStyle} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={applyButtonStyle} onClick={handleSave}>
              {modalMode === "edit" ? "Save Changes" : "Save"}
            </button>
          </div>
        </div>
      </div>
    )}
      {/* Inactivation confirmation */}
      {inactiveConfirm && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 500 }}>
            <div style={{ ...modalHeaderStyle, color: "#fbbf24" }}>&#9888;&nbsp; Confirm Inactivation</div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", lineHeight: 1.6 }}>
                Inactivating <strong style={{ color: "#f9fafb" }}>{inactiveConfirm.sub.name}</strong> will unlink the following entries. If reactivated, these will need to be manually reassigned.
              </p>
              {inactiveConfirm.affectedSpecimens.length > 0 && (
                <div style={{ borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", background: "#0a0a0a", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8 }}>
                    Specimens to unlink
                    <span style={{ padding: "1px 7px", borderRadius: 999, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)", fontSize: 11 }}>{inactiveConfirm.affectedSpecimens.length}</span>
                  </div>
                  <div style={{ maxHeight: 160, overflowY: "auto" }}>
                    {inactiveConfirm.affectedSpecimens.map((sp) => <ImpactRow key={sp.id} name={sp.name} />)}
                  </div>
                </div>
              )}
              {inactiveConfirm.affectedUsers.length > 0 && (
                <div style={{ borderRadius: 8, border: "1px solid #1f2937", overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", background: "#0a0a0a", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8 }}>
                    Physicians to unassign
                    <span style={{ padding: "1px 7px", borderRadius: 999, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)", fontSize: 11 }}>{inactiveConfirm.affectedUsers.length}</span>
                  </div>
                  <div style={{ maxHeight: 160, overflowY: "auto" }}>
                    {inactiveConfirm.affectedUsers.map((u) => <ImpactRow key={u.id} name={u.name} sub={u.role} />)}
                  </div>
                </div>
              )}
            </div>
            <div style={modalFooterStyle}>
              <button style={cancelButtonStyle} onClick={() => { setDraft(prev => ({ ...prev, active: true })); setInactiveConfirm(null); }}>Cancel</button>
              <button style={{ ...applyButtonStyle, background: "#78350f", borderColor: "#fbbf24", color: "#fde68a" }}
                onClick={() => commitSave(inactiveConfirm.draft, inactiveConfirm.specimenAssignments, inactiveConfirm.sub, true)}>
                Inactivate &amp; Unlink
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivation notice */}
      {reactivateConfirm && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 460 }}>
            <div style={{ ...modalHeaderStyle, color: "#60a5fa" }}>&#8635;&nbsp; Reactivating Subspecialty</div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", lineHeight: 1.7 }}>
                <strong style={{ color: "#f9fafb" }}>{reactivateConfirm.sub.name}</strong> will be set back to <strong style={{ color: "#22c55e" }}>Active</strong>.
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", lineHeight: 1.7 }}>
                Any specimens and physicians that were unlinked when this subspecialty was inactivated <strong style={{ color: "#f9fafb" }}>will not be automatically restored</strong>. Please use the <strong style={{ color: "#f9fafb" }}>Edit modal</strong> after reactivation to reassign them.
              </p>
              <div style={{ marginTop: 4, padding: "10px 12px", borderRadius: 7, background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 12, color: "#60a5fa", lineHeight: 1.5 }}>
                &#9432;&nbsp; After clicking <em>Got it</em>, open Edit again to reassign specimens and physicians.
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button style={cancelButtonStyle} onClick={() => setReactivateConfirm(null)}>Cancel</button>
              <button style={{ ...applyButtonStyle, background: "#1a3a5c", borderColor: "#60a5fa", color: "#bfdbfe" }}
                onClick={() => commitSave(reactivateConfirm.draft, reactivateConfirm.specimenAssignments, reactivateConfirm.sub, false)}>
                Got it &mdash; Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubspecialtiesSection;
