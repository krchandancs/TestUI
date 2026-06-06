import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuditLog } from "../components/Audit/useAuditLog";
import {
  ProtocolDefinition,
  ProtocolSection,
  ProtocolQuestion
} from "../types/ProtocolDefinition";
import {
  loadProtocolRegistry,
  saveProtocolOverride
} from "./protocolRegistry";

const ProtocolEditor: React.FC = () => {
  const navigate = useNavigate();
  const { protocolId } = useParams();
  const location = useLocation();
  const { log } = useAuditLog();
  const returnTab = new URLSearchParams(location.search).get("from") || "protocols";
  const [protocol, setProtocol] = useState<ProtocolDefinition | null>(null);
  const originalProtocol = React.useRef<ProtocolDefinition | null>(null);

  useEffect(() => {
    const registry = loadProtocolRegistry();
    if (protocolId && registry[protocolId]) {
      const loaded = structuredClone(registry[protocolId]);
      setProtocol(loaded);
      originalProtocol.current = structuredClone(loaded);
    }
  }, [protocolId]);

  if (!protocol) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", padding: 24, color: "#e2e8f0" }}>
        <button
          onClick={() => navigate(`/configuration?tab=${returnTab}`)}
          style={{
            marginBottom: 16,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13
          }}
        >
          ← Back to Configuration
        </button>
        <div style={{ color: "#94a3b8" }}>Protocol not found.</div>
      </div>
    );
  }

  const updateSection = (sectionId: string, updater: (s: ProtocolSection) => ProtocolSection) => {
    setProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => (s.id === sectionId ? updater(s) : s))
      };
    });
  };

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: ProtocolQuestion) => ProtocolQuestion
  ) => {
    updateSection(sectionId, section => ({
      ...section,
      questions: section.questions.map(q =>
        q.id === questionId ? updater(q) : q
      )
    }));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setProtocol(prev => {
      if (!prev) return prev;
      const idx = prev.sections.findIndex(s => s.id === sectionId);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [moved] = sections.splice(idx, 1);
      sections.splice(newIdx, 0, moved);
      return { ...prev, sections };
    });
  };

  const moveQuestion = (
    sectionId: string,
    questionId: string,
    direction: -1 | 1
  ) => {
    updateSection(sectionId, section => {
      const idx = section.questions.findIndex(q => q.id === questionId);
      if (idx < 0) return section;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= section.questions.length) return section;
      const questions = [...section.questions];
      const [moved] = questions.splice(idx, 1);
      questions.splice(newIdx, 0, moved);
      return { ...section, questions };
    });
  };

  const addSection = () => {
    const id = `section_${Date.now()}`;
    setProtocol(prev =>
      prev
        ? {
            ...prev,
            sections: [
              ...prev.sections,
              { id, title: "New Section", questions: [] }
            ]
          }
        : prev
    );
  };

  const addQuestion = (sectionId: string) => {
    const id = `q_${Date.now()}`;
    updateSection(sectionId, section => ({
      ...section,
      questions: [
        ...section.questions,
        {
          id,
          text: "New question",
          type: "text",
          required: false
        }
      ]
    }));
  };

  const save = () => {
    if (!protocol) return;
    saveProtocolOverride(protocol);

    // ── Build human-readable diff ────────────────────────────────────────────
    const orig = originalProtocol.current;
    const changes: string[] = [];

    if (orig) {
      // Top-level field changes
      if (orig.name !== protocol.name)
        changes.push(`Name: "${orig.name}" → "${protocol.name}"`);
      if (orig.lifecycle !== protocol.lifecycle)
        changes.push(`Lifecycle: "${orig.lifecycle}" → "${protocol.lifecycle}"`);
      if (orig.version !== protocol.version)
        changes.push(`Version: "${orig.version}" → "${protocol.version}"`);

      // Section-level changes
      const origSections = new Map(orig.sections.map(s => [s.id, s]));
      const newSections = new Map(protocol.sections.map(s => [s.id, s]));

      // Added sections
      protocol.sections.forEach(s => {
        if (!origSections.has(s.id))
          changes.push(`Added section: "${s.title}"`);
      });

      // Removed sections
      orig.sections.forEach(s => {
        if (!newSections.has(s.id))
          changes.push(`Removed section: "${s.title}"`);
      });

      // Modified sections / questions
      protocol.sections.forEach(newSection => {
        const origSection = origSections.get(newSection.id);
        if (!origSection) return;

        if (origSection.title !== newSection.title)
          changes.push(`Section renamed: "${origSection.title}" → "${newSection.title}"`);

        const origQs = new Map(origSection.questions.map(q => [q.id, q]));
        const newQs = new Map(newSection.questions.map(q => [q.id, q]));

        newSection.questions.forEach(q => {
          if (!origQs.has(q.id))
            changes.push(`Added question in "${newSection.title}": "${q.text}"`);
        });
        origSection.questions.forEach(q => {
          if (!newQs.has(q.id))
            changes.push(`Removed question from "${newSection.title}": "${q.text}"`);
        });
        newSection.questions.forEach(q => {
          const oq = origQs.get(q.id);
          if (!oq) return;
          if (oq.text !== q.text)
            changes.push(`Question text: "${oq.text}" → "${q.text}"`);
          if (oq.type !== q.type)
            changes.push(`"${q.text}" type: ${oq.type} → ${q.type}`);
          if (oq.required !== q.required)
            changes.push(`"${q.text}" required: ${oq.required} → ${q.required}`);
        });
      });
    }

    log("save_protocol", {
      name: protocol.name,
      changes,
    });

    navigate(`/configuration?tab=${returnTab}`);
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#f1f5f9",
    fontSize: 12,
    cursor: "pointer",
  };

  const arrowBtn = (disabled: boolean): React.CSSProperties => ({
    padding: "3px 8px",
    fontSize: 12,
    borderRadius: 5,
    border: "1px solid #334155",
    background: disabled ? "transparent" : "#1e293b",
    color: disabled ? "#475569" : "#94a3b8",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        backgroundImage: "linear-gradient(to bottom, #0f172a 0%, #020617 100%)",
        color: "#f1f5f9",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => navigate(`/configuration?tab=${returnTab}`)}
          style={{
            padding: "7px 16px",
            borderRadius: 7,
            border: "1px solid #334155",
            background: "rgba(255,255,255,0.04)",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to Configuration
        </button>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div style={{ padding: "36px 40px 80px", maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#f1f5f9",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Protocol Editor: {protocol.name}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span>Source: <span style={{ color: "#94a3b8" }}>{protocol.source}</span></span>
            <span style={{ color: "#334155" }}>&bull;</span>
            <span>Version: <span style={{ color: "#94a3b8" }}>{protocol.version}</span></span>
            <span style={{ color: "#334155" }}>&bull;</span>
            <span>Lifecycle:{" "}
              <span
                style={{
                  color: protocol.lifecycle === "validated" ? "#10b981"
                    : protocol.lifecycle === "draft" ? "#f59e0b"
                    : "#94a3b8",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {protocol.lifecycle}
              </span>
            </span>
          </div>
        </div>

        {/* Add Section button */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={addSection}
            style={{
              padding: "8px 16px",
              borderRadius: 7,
              border: "1px solid #0891B2",
              background: "rgba(8,145,178,0.12)",
              color: "#38bdf8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Add Section
          </button>
        </div>

        {/* Sections */}
        {protocol.sections.map((section, sIdx) => (
          <div
            key={section.id}
            style={{
              marginBottom: 16,
              borderRadius: 10,
              border: "1px solid #1e293b",
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(8px)",
              overflow: "hidden",
            }}
          >
            {/* Section header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid #1e293b",
                gap: 10,
              }}
            >
              <input
                type="text"
                value={section.title}
                onChange={e =>
                  updateSection(section.id, s => ({ ...s, title: e.target.value }))
                }
                style={{ ...inputStyle, fontSize: 14, fontWeight: 600, background: "#0f172a" }}
              />
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => moveSection(section.id, -1)}
                  disabled={sIdx === 0}
                  style={arrowBtn(sIdx === 0)}
                >↑</button>
                <button
                  onClick={() => moveSection(section.id, 1)}
                  disabled={sIdx === protocol.sections.length - 1}
                  style={arrowBtn(sIdx === protocol.sections.length - 1)}
                >↓</button>
              </div>
            </div>

            {/* Section body */}
            <div style={{ padding: "12px 14px" }}>
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => addQuestion(section.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "1px solid #0891B2",
                    background: "transparent",
                    color: "#38bdf8",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Question
                </button>
              </div>

              {section.questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  style={{
                    marginBottom: 8,
                    padding: "10px 12px",
                    borderRadius: 7,
                    border: "1px solid #1e293b",
                    background: "rgba(30,41,59,0.6)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: q.type === "choice" ? 8 : 0,
                    }}
                  >
                    <input
                      type="text"
                      value={q.text}
                      onChange={e =>
                        updateQuestion(section.id, q.id, qq => ({
                          ...qq,
                          text: e.target.value
                        }))
                      }
                      style={inputStyle}
                    />
                    <select
                      value={q.type}
                      onChange={e =>
                        updateQuestion(section.id, q.id, qq => ({
                          ...qq,
                          type: e.target.value as any
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value="choice">Choice</option>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        color: "#cbd5e1",
                        flexShrink: 0,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e =>
                          updateQuestion(section.id, q.id, qq => ({
                            ...qq,
                            required: e.target.checked
                          }))
                        }
                        style={{ accentColor: "#0891B2", width: 14, height: 14 }}
                      />
                      Required
                    </label>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => moveQuestion(section.id, q.id, -1)}
                        disabled={qIdx === 0}
                        style={arrowBtn(qIdx === 0)}
                      >↑</button>
                      <button
                        onClick={() => moveQuestion(section.id, q.id, 1)}
                        disabled={qIdx === section.questions.length - 1}
                        style={arrowBtn(qIdx === section.questions.length - 1)}
                      >↓</button>
                    </div>
                  </div>

                  {q.type === "choice" && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontStyle: "italic",
                        paddingLeft: 4,
                      }}
                    >
                      Choice options editing can be added next — structure is ready.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save / Cancel */}
        {(() => {
          const hasChanges = JSON.stringify(protocol) !== JSON.stringify(originalProtocol.current);
          return (
        <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={save}
            disabled={!hasChanges}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: `1px solid ${hasChanges ? "#22c55e" : "#1e3a2a"}`,
              background: hasChanges ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.03)",
              color: hasChanges ? "#22c55e" : "#2d5a3d",
              fontWeight: 700,
              fontSize: 14,
              cursor: hasChanges ? "pointer" : "not-allowed",
              opacity: hasChanges ? 1 : 0.45,
              transition: "all 0.2s",
            }}
          >
            Save Protocol
          </button>
          <button
            onClick={() => navigate(`/configuration?tab=${returnTab}`)}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#64748b",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ProtocolEditor;
