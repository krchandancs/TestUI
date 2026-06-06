import { useMemo, useRef, useState } from "react";
import '../../../pathscribe.css';
import { useSpecimens } from "../../../contexts/useSpecimens";
import { useSubspecialties } from "../../../contexts/useSubspecialties";
import { Specimen } from "../../Config/Models/specimenTypes";
import * as XLSX from "xlsx";
import { overlay, modalBox, modalHeaderStyle, modalFooterStyle, cancelButtonStyle, applyButtonStyle } from "../../Common/modalStyles";

// ─── Shared inline style constants ────────────────────────────────────────────
const FIELD: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" };
const INPUT: React.CSSProperties = { padding: "9px 12px", fontSize: 13, color: "#e5e7eb", background: "#0f0f0f", border: "1px solid #374151", borderRadius: 7, outline: "none", width: "100%", boxSizing: "border-box" };
const TEXTAREA: React.CSSProperties = { ...INPUT, resize: "vertical", minHeight: 72 } as React.CSSProperties;
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 } as React.CSSProperties;

// ─── Subspecialty badge colours ───────────────────────────────────────────────
const SUB_STYLES: Record<string, { borderColor: string; color: string; background: string }> = {
  breast:    { borderColor: "#4A9EBF", color: "#7FC8E8", background: "#0d2a36" },
  gi:        { borderColor: "#4A8F5A", color: "#7EC89A", background: "#0d2318" },
  gu:        { borderColor: "#5A6FA8", color: "#9AABDF", background: "#141c30" },
  thoracic:  { borderColor: "#8A6FA8", color: "#C4ABDF", background: "#1e1530" },
  derm:      { borderColor: "#B8863C", color: "#E0B96A", background: "#2a1e08" },
  endocrine: { borderColor: "#7A9A4A", color: "#AECB78", background: "#1a220d" },
  general:   { borderColor: "#444",    color: "#888",    background: "#1a1a1a"  },
};
const getSubStyle = (name?: string) => {
  const key = name?.split("/")[0]?.trim().toLowerCase() ?? "general";
  return SUB_STYLES[key] ?? SUB_STYLES["general"];
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name }: { name: string }) => {
  const words = name.trim().split(" ");
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, minWidth: 32, borderRadius: "50%", flexShrink: 0,
      background: "radial-gradient(circle at 35% 35%, #4a6fa8, #1a2a4a 60%, #0d1525)",
      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  );
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
        background: value ? "#22c55e" : "#374151",
        boxShadow: value ? "0 0 8px #22c55e55" : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        left: value ? 23 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? "#22c55e" : "#6b7280" }}>
      {value ? "Active" : "Inactive"}
    </span>
  </div>
);

// ─── Draft type ───────────────────────────────────────────────────────────────
type SpecimenDraft = {
  name: string;
  description: string;
  specimenCode: string;
  subspecialtyId: string;
  subspecialtyName: string;
  active: boolean;
};

const emptyDraft: SpecimenDraft = {
  name: "", description: "", specimenCode: "",
  subspecialtyId: "", subspecialtyName: "", active: true,
};

// ─── Main component ───────────────────────────────────────────────────────────
export const SpecimenDictionary = () => {
  const { specimens, addSpecimen, updateSpecimen } = useSpecimens();
  const { subspecialties } = useSubspecialties();

  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<"All" | "Active" | "Inactive">("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<Specimen[]>([]);
  const [uploadSummary, setUploadSummary] = useState({ newCount: 0, updateCount: 0 });
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorMode, setEditorMode]       = useState<"add" | "edit">("add");
  const [editorSpecimen, setEditorSpecimen] = useState<Specimen | null>(null);
  const [draft, setDraft]                 = useState<SpecimenDraft>(emptyDraft);

  const scrollRef = useRef<HTMLDivElement>(null);

  const subspecialtyMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    subspecialties.forEach((s) => { map[s.name.toLowerCase()] = { id: s.id, name: s.name }; });
    return map;
  }, [subspecialties]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const preview: Specimen[] = [];
      let newCount = 0, updateCount = 0;
      rows.forEach((row) => {
        const incomingName = (row.name || row.Name || "").toString().trim();
        const incomingDesc = (row.description || row.Description || "").toString().trim();
        const incomingSub  = (row.subspecialty || row.Subspecialty || "").toString().trim();
        const incomingCode = (row.specimenCode || row.SpecimenCode || "").toString().trim();
        if (!incomingName) return;
        const sub = subspecialtyMap[incomingSub.toLowerCase()] ?? subspecialtyMap["general"] ?? { id: "", name: incomingSub };
        let existing: Specimen | undefined;
        if (incomingCode) existing = specimens.find((s) => s.specimenCode?.toLowerCase() === incomingCode.toLowerCase());
        if (!existing)    existing = specimens.find((s) => s.name.toLowerCase() === incomingName.toLowerCase());
        if (existing) {
          updateCount++;
          preview.push({ ...existing, name: incomingName, description: incomingDesc || existing.description, specimenCode: incomingCode || existing.specimenCode, subspecialtyId: sub.id, subspecialtyName: sub.name, updatedBy: "upload", updatedAt: new Date().toISOString(), version: existing.version + 1 });
        } else {
          newCount++;
          preview.push({ id: crypto.randomUUID(), name: incomingName, description: incomingDesc, specimenCode: incomingCode || undefined, subspecialtyId: sub.id, subspecialtyName: sub.name, active: true, version: 1, updatedBy: "upload", updatedAt: new Date().toISOString() });
        }
      });
      setUploadPreview(preview);
      setUploadSummary({ newCount, updateCount });
      setShowUploadModal(true);
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const rows = [
      { Name: "Colon Biopsy", Description: "Biopsy of colon tissue", Subspecialty: "GI", SpecimenCode: "GI-COL-BX" },
      { Name: "Breast Core Needle Biopsy", Description: "Core biopsy of breast tissue", Subspecialty: "Breast", SpecimenCode: "BR-CORE-BX" },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "SpecimenDictionaryTemplate.xlsx");
  };

  const handleApplyUpload = () => {
    uploadPreview.forEach((row) => {
      const existing =
        specimens.find((s) => row.specimenCode && s.specimenCode?.toLowerCase() === row.specimenCode.toLowerCase()) ??
        specimens.find((s) => s.name.toLowerCase() === row.name.toLowerCase());
      if (existing) {
        updateSpecimen({ ...existing, ...row, updatedBy: "upload", updatedAt: new Date().toISOString(), version: existing.version + 1 });
      } else {
        addSpecimen(row);
      }
    });
    setShowUploadModal(false);
    setUploadPreview([]);
    setUploadSummary({ newCount: 0, updateCount: 0 });
  };

  const openEditor = (mode: "add" | "edit", s?: Specimen) => {
    setEditorMode(mode);
    setEditorSpecimen(s ?? null);
    setDraft(s ? { name: s.name ?? "", description: s.description ?? "", specimenCode: s.specimenCode ?? "", subspecialtyId: s.subspecialtyId ?? "", subspecialtyName: s.subspecialtyName ?? "", active: s.active !== false } : emptyDraft);
    setShowEditorModal(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    if (editorMode === "add") {
      addSpecimen({ id: crypto.randomUUID(), name: draft.name, description: draft.description, specimenCode: draft.specimenCode || undefined, subspecialtyId: draft.subspecialtyId, subspecialtyName: draft.subspecialtyName, active: draft.active, version: 1, updatedBy: "manual", updatedAt: new Date().toISOString() });
    } else {
      updateSpecimen({ ...editorSpecimen!, name: draft.name, description: draft.description, specimenCode: draft.specimenCode || undefined, subspecialtyId: draft.subspecialtyId, subspecialtyName: draft.subspecialtyName, active: draft.active, updatedBy: "manual", updatedAt: new Date().toISOString(), version: editorSpecimen!.version + 1 });
    }
    setShowEditorModal(false);
  };

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filtered = specimens.filter((s) => {
    if (!s.name || s.name.trim() === "") return false;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || (statusFilter === "Active" ? s.active !== false : s.active === false);
    return matchSearch && matchStatus;
  });

  const ROW_PAD    = "10px 20px";
  const HEADER_PAD = "12px 20px";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Specimen Dictionary</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Manage normalized pathology terminology and subspecialty routing.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleDownloadTemplate} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#9ca3af", background: "transparent", border: "1px solid #374151", borderRadius: 8, cursor: "pointer" }}>
            Download Template
          </button>
          <label style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #1a6080, #0d4a63)", border: "1px solid #2a7a9a", borderRadius: 8, cursor: "pointer", boxShadow: "0 0 16px rgba(0,163,196,0.2)", display: "inline-flex", alignItems: "center" }}>
            + Upload Spreadsheet
            <input type="file" hidden accept=".csv,.xlsx" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          </label>
          <button onClick={() => openEditor("add")} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#1a6080", border: "1px solid #2a7a9a", borderRadius: 8, cursor: "pointer" }}>
            + Add Specimen
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text" placeholder="Search specimens..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 16px", fontSize: 13, color: "#d1d5db", background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 8, outline: "none" }}
        />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ padding: "9px 36px 9px 14px", fontSize: 13, fontWeight: 600, color: "#d1d5db", background: "#0f0f0f", border: "1px solid #1f2937", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
        <div ref={scrollRef} style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "25%" }} /><col style={{ width: "29%" }} />
              <col style={{ width: "17%" }} /><col style={{ width: "14%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#0a0a0a", borderBottom: "1px solid #1f2937", position: "sticky", top: 0, zIndex: 1 }}>
                {[["Specimen Name","left"],["Description","left"],["Subspecialty","left"],["Status","left"],["Actions","right"]].map(([label, align]) => (
                  <th key={label} style={{ padding: HEADER_PAD, fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: align as any }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const sub = getSubStyle(s.subspecialtyName);
                const isActive = s.active !== false;
                return (
                  <tr key={s.id} style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #111827" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: ROW_PAD }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.name} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: ROW_PAD }}>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>{s.description || "Standard diagnostic specimen."}</span>
                    </td>
                    <td style={{ padding: ROW_PAD }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${sub.borderColor}`, color: sub.color, background: sub.background }}>
                        {s.subspecialtyName || "General"}
                      </span>
                    </td>
                    <td style={{ padding: ROW_PAD }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", display: "inline-block", background: isActive ? "#22c55e" : "#4b5563", boxShadow: isActive ? "0 0 6px #22c55e99" : "none" }} />
                        <span style={{ fontSize: 13, color: isActive ? "#d1d5db" : "#6b7280" }}>{isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td style={{ padding: ROW_PAD, textAlign: "right" }}>
                      <button
                        onClick={() => openEditor("edit", s)}
                        style={{ padding: "5px 16px", fontSize: 13, fontWeight: 600, color: "#e5e7eb", background: "#1c1c1c", border: "1px solid #374151", borderRadius: 7, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#252525"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#4b5563"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1c1c1c"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151"; }}
                      >Edit</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "32px 20px", textAlign: "center", color: "#4b5563", fontSize: 13 }}>No specimens match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#22c55e" }}>●</span> System Live Sync</div>
        <div>Dictionary v2.0.4</div>
      </div>

      {/* Add / Edit Modal */}
      {showEditorModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={modalHeaderStyle}>{editorMode === "edit" ? "Edit Specimen" : "Add Specimen"}</div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Name */}
              <div style={FIELD}>
                <label style={LABEL}>Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={{ ...INPUT, borderColor: draft.name.trim() === "" ? "#ef4444" : "#374151" }}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Required"
                />
                {draft.name.trim() === "" && <span style={{ fontSize: 11, color: "#ef4444" }}>Name is required</span>}
              </div>

              {/* Description */}
              <div style={FIELD}>
                <label style={LABEL}>Description</label>
                <textarea style={TEXTAREA} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>

              {/* Specimen Code */}
              <div style={FIELD}>
                <label style={LABEL}>Specimen Code</label>
                <input style={INPUT} value={draft.specimenCode} onChange={(e) => setDraft({ ...draft, specimenCode: e.target.value })} />
              </div>

              {/* Subspecialty */}
              <div style={FIELD}>
                <label style={LABEL}>Subspecialty</label>
                <select
                  style={SELECT}
                  value={draft.subspecialtyId ?? ""}
                  onChange={(e) => {
                    const sub = subspecialties.find((s) => s.id === e.target.value);
                    if (sub) setDraft({ ...draft, subspecialtyId: sub.id, subspecialtyName: sub.name });
                  }}
                >
                  <option value="" disabled>Select a subspecialty…</option>
                  {subspecialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Status toggle */}
              <div style={FIELD}>
                <label style={LABEL}>Status</label>
                <Toggle value={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
              </div>

            </div>

            <div style={modalFooterStyle}>
              <button style={cancelButtonStyle} onClick={() => setShowEditorModal(false)}>Cancel</button>
              <button
                style={{ ...applyButtonStyle, opacity: draft.name.trim() === "" ? 0.4 : 1, cursor: draft.name.trim() === "" ? "not-allowed" : "pointer" }}
                onClick={handleSave}
              >
                {editorMode === "edit" ? "Save Changes" : "Add Specimen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e5e5", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #2a2a2a" }}>
              Upload Preview — Specimens
            </div>
            <div style={{ marginBottom: 14, color: "#ccc", fontSize: 13 }}>
              <span style={{ marginRight: 20 }}>New: <strong style={{ color: "#7ec89a" }}>{uploadSummary.newCount}</strong></span>
              <span>Updates: <strong style={{ color: "#e0b96a" }}>{uploadSummary.updateCount}</strong></span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #2a2a2a", borderRadius: 6, backgroundColor: "#121212" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#1e1e1e", position: "sticky", top: 0 }}>
                  <tr>
                    {["Status","Name","Description","Subspecialty","Specimen Code"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadPreview.map((row, idx) => {
                    const isUpdate = specimens.some((s) => (row.specimenCode && s.specimenCode?.toLowerCase() === row.specimenCode.toLowerCase()) || s.name.toLowerCase() === row.name.toLowerCase());
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #1f1f1f", background: isUpdate ? "#1a1408" : "#0d1a12" }}>
                        <td style={{ padding: "10px 12px", color: isUpdate ? "#e0b96a" : "#7ec89a", fontSize: 12, fontWeight: 600 }}>{isUpdate ? "Update" : "New"}</td>
                        <td style={{ padding: "10px 12px", color: "#e5e5e5", fontSize: 13 }}>{row.name}</td>
                        <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>{row.description}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ padding: "2px 8px", borderRadius: 4, background: "#1e1e1e", border: "1px solid #444", color: "#ccc", fontSize: 12 }}>{row.subspecialtyName}</span></td>
                        <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>{row.specimenCode || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid #2a2a2a" }}>
              <button onClick={() => { setShowUploadModal(false); setUploadPreview([]); setUploadSummary({ newCount: 0, updateCount: 0 }); }} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#ccc", background: "#2a2a2a", border: "1px solid #444", borderRadius: 7, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleApplyUpload} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#fff", background: "#1a6080", border: "1px solid #2a7a9a", borderRadius: 7, cursor: "pointer" }}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpecimenDictionary;
