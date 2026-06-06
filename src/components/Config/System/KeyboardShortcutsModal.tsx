import React, { useState, useEffect } from "react";
import '../../../pathscribe.css';
import { SHORTCUT_GROUPS } from "@/constants/systemActions";

export type Shortcut = {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string | null;
};

export type ShortcutMap = {
  [command: string]: Shortcut;
};

interface Props {
  shortcuts: ShortcutMap;
  setShortcuts: (map: ShortcutMap) => void;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<Props> = ({
  shortcuts,
  setShortcuts,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [tempShortcut, setTempShortcut] = useState<Shortcut | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  // Convert structured shortcut → display string
  const formatShortcut = (s: Shortcut) => {
    if (!s.key) return "Unassigned";
    const parts = [];
    if (s.ctrl) parts.push("Ctrl");
    if (s.shift) parts.push("Shift");
    if (s.alt) parts.push("Alt");
    if (s.meta) parts.push("Cmd");
    parts.push(s.key.toUpperCase());
    return parts.join("+");
  };

  // Detect conflicts
  const checkConflict = (candidate: Shortcut, command: string) => {
    const candidateStr = JSON.stringify(candidate);
    for (const [cmd, sc] of Object.entries(shortcuts)) {
      if (cmd !== command && JSON.stringify(sc) === candidateStr) {
        return cmd;
      }
    }
    return null;
  };

  // Capture key presses when editing
  useEffect(() => {
    if (!editingCommand) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newShortcut: Shortcut = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        key: e.key.length === 1 ? e.key.toUpperCase() : null,
      };

      setTempShortcut(newShortcut);

      const conflictCmd = checkConflict(newShortcut, editingCommand);
      setConflict(conflictCmd);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingCommand]);

  const applyShortcut = () => {
    if (!editingCommand || !tempShortcut) return;

    if (conflict) return;

    setShortcuts({
      ...shortcuts,
      [editingCommand]: tempShortcut,
    });

    setEditingCommand(null);
    setTempShortcut(null);
  };

  const resetDefaults = () => {
    const defaults: ShortcutMap = {
      "editor.bold":             { ctrl: true,  shift: true,  alt: false, meta: false, key: "B" },
      "editor.italic":           { ctrl: true,  shift: true,  alt: false, meta: false, key: "I" },
      "editor.underline":        { ctrl: true,  shift: true,  alt: false, meta: false, key: "U" },
      "editor.bullets":          { ctrl: false, shift: false, alt: true,  meta: false, key: "8" },
      "editor.numbering":        { ctrl: false, shift: false, alt: true,  meta: false, key: "7" },
      "editor.increaseIndent":   { ctrl: true,  shift: false, alt: false, meta: false, key: "]" },
      "editor.decreaseIndent":   { ctrl: true,  shift: false, alt: false, meta: false, key: "[" },
      "editor.insertMacro":      { ctrl: false, shift: false, alt: true,  meta: false, key: "M" },
      "editor.insertTable":      { ctrl: false, shift: true,  alt: false, meta: false, key: "T" },
      "editor.insertSignature":  { ctrl: false, shift: true,  alt: false, meta: false, key: "S" },
      "editor.find":             { ctrl: true,  shift: false, alt: false, meta: false, key: "F" },
      "editor.replace":          { ctrl: true,  shift: true,  alt: false, meta: false, key: "F" },
      "editor.selectAll":        { ctrl: true,  shift: false, alt: false, meta: false, key: "A" },
      "editor.showRuler":        { ctrl: true,  shift: false, alt: true,  meta: false, key: "R" },
      "editor.toggleFormatting": { ctrl: true,  shift: true,  alt: false, meta: false, key: "P" },
    };
    setShortcuts(defaults);
  };

  // Groups sourced from systemActions.ts — single source of truth
  const groups = SHORTCUT_GROUPS.map((g: any) => ({
    title: g.title,
    commands: g.actions.map((a: any) => ({ id: a.id, label: a.label })),
  }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: "28px", fontWeight: 800 }}>Keyboard Shortcuts</h2>

        <button
          onClick={onClose}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: "transparent",
            border: "2px solid #0891B2",
            color: "#0891B2",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "20px 40px" }}>
        <input
          placeholder="Search commands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: "16px",
          }}
        />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 40px 40px 40px",
        }}
      >
        {groups.map((group: any) => {
          const filtered = group.commands.filter((cmd: any) =>
            cmd.label.toLowerCase().includes(search.toLowerCase())
          );

          if (filtered.length === 0) return null;

          return (
            <div key={group.title} style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  color: "#0891B2",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                {group.title}
              </h3>

              {filtered.map((cmd: any) => (
                <div
                  key={cmd.id}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ color: "white", fontSize: "15px", fontWeight: 600 }}>
                    {cmd.label}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.1)",
                        color: "#cbd5e1",
                        fontSize: "14px",
                        minWidth: "120px",
                        textAlign: "center",
                      }}
                    >
                      {formatShortcut(shortcuts[cmd.id])}
                    </div>

                    <button
                      onClick={() => {
                        setEditingCommand(cmd.id);
                        setTempShortcut(null);
                        setConflict(null);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "#0891B2",
                        border: "none",
                        color: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <button
          onClick={resetDefaults}
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            background: "rgba(8,145,178,0.15)",
            border: "1px solid rgba(8,145,178,0.3)",
            color: "#0891B2",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            width: "100%",
            marginTop: "20px",
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Key Capture Overlay */}
      {editingCommand && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
          }}
        >
          <div
            style={{
              padding: "40px",
              background: "#111",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
              width: "420px",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>
              Press new shortcut…
            </h3>

            <div
              style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "18px",
                marginBottom: "20px",
              }}
            >
              {tempShortcut ? formatShortcut(tempShortcut) : "Waiting…"}
            </div>

            {conflict && (
              <div
                style={{
                  color: "#F59E0B",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              >
                Conflict with: {conflict}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setEditingCommand(null);
                  setTempShortcut(null);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!tempShortcut || conflict !== null}
                onClick={applyShortcut}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: conflict ? "#475569" : "#0891B2",
                  border: "none",
                  color: "white",
                  fontWeight: 600,
                  cursor: conflict ? "not-allowed" : "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsModal;