// src/components/CasePanel/CasePreviewDrawer.tsx

import React, { useState } from "react";
import '../../pathscribe.css';
import { useLISFreshnessCheck } from "../../hooks/useLISFreshnessCheck";
import type { FullReport, MinimalReport } from "../../mock/mockReports";

interface DrawerProps {
  report: FullReport | MinimalReport | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFull: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const isFullReport = (r: FullReport | MinimalReport): r is FullReport =>
  "synoptic" in r && r.synoptic !== undefined;

const Row: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value || value === "Not applicable" || value === "Not identified") return null;
  return (
    <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, width: "120px", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: "1px" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: 1.5 }}>{value}</span>
    </div>
  );
};

// ── component ─────────────────────────────────────────────────────────────────

export const CasePreviewDrawer: React.FC<DrawerProps> = ({
  report,
  isOpen,
  onClose,
  onOpenFull,
}) => {
  // SR-19: AI Learn state — keyed by accession so each case remembers independently
  const [aiLearnChecked, setAiLearnChecked] = useState<Record<string, boolean>>({});

  // SR-16 FIX: Never return null based on report alone.
  // The drawer shell must always exist in the DOM so the CSS translateX
  // transition has something to animate. Previously `if (!report) return null`
  // caused the first click to mount from scratch mid-transition — the shell
  // didn't exist yet so the animation was invisible. Now the shell always
  // renders; content is conditionally shown inside it.

  const { isStale } = useLISFreshnessCheck(report?.accession ?? "");

  const accession = report?.accession ?? "";
  const isLearn   = aiLearnChecked[accession] ?? false;
  const full      = report && isFullReport(report) ? report : null;
  const s         = full?.synoptic;

  const formattedDate = report?.lastUpdated
    ? new Date(report.lastUpdated).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="ps-drawer-backdrop"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", zIndex: 29999 }}
        onClick={onClose}
      />

      {/* Drawer shell — always in DOM (SR-16 fix) */}
      <div
        className="ps-drawer"
        style={{ width: "440px", top: 0, transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease", zIndex: 30000, animation: "none" }}
      >
        {/* ── Header ── */}
        <div className="ps-drawer-header">
          <div>
            <div className="ps-research-eyebrow">Case Preview</div>
            {report ? (
              <>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }} data-phi="accession">
                  {accession}
                </div>
                {formattedDate && (
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                    Last updated {formattedDate}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: "14px", color: "#334155" }}>No case selected</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ps-research-close" style={{ marginTop: "2px" }}
          >✕</button>
        </div>

        {/* ── Body ── */}
        {report ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Staleness warning */}
            {isStale && (
              <div className="ps-warning-banner">
                <span style={{ flexShrink: 0 }}>⚠</span>
                <span>Updated in LIS — this preview may be outdated. Open the full report for current data.</span>
              </div>
            )}

            {/* Diagnosis card */}
            <div style={{ padding: "12px 14px", background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.15)", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>
                Diagnosis
              </div>
              <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.5, fontWeight: 600 }}>
                {report.diagnosis}
              </div>
            </div>

            {/* Synoptic summary */}
            {s && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Synoptic Summary
                </div>
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px" }}>
                  <Row label="Tumor Type" value={s.tumorType} />
                  <Row label="Grade"      value={s.grade} />
                  <Row label="Size"       value={s.size} />
                  <Row label="Margins"    value={s.margins} />
                  <Row label="LVI"        value={s.lymphovascularInvasion} />
                  {s.biomarkers?.er !== "Not applicable" && (
                    <>
                      <Row label="ER"    value={s.biomarkers?.er} />
                      <Row label="PR"    value={s.biomarkers?.pr} />
                      <Row label="HER2"  value={s.biomarkers?.her2} />
                      <Row label="Ki-67" value={s.biomarkers?.ki67} />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Specimen */}
            {full?.specimens?.[0] && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Specimen
                </div>
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px" }}>
                  <Row label="Type"        value={full.specimens[0].type} />
                  <Row label="Description" value={full.specimens[0].description} />
                </div>
              </div>
            )}

            {/* SR-19: AI training reference checkbox */}
            <div className={`ps-ai-learn-card${isLearn ? " checked" : ""}`}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isLearn}
                  onChange={e => setAiLearnChecked(prev => ({ ...prev, [accession]: e.target.checked }))}
                  style={{ width: "15px", height: "15px", marginTop: "2px", cursor: "pointer", accentColor: "#8B5CF6", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: isLearn ? "#a78bfa" : "#64748b", transition: "color 0.2s" }}>
                    Use as AI training reference
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px", lineHeight: 1.5 }}>
                    Included in AI matching feedback on finalization to improve future suggestions.
                  </div>
                </div>
              </label>
            </div>

          </div>
        ) : (
          /* Empty state — shown when drawer is open but no case selected yet */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "13px" }}>
            Select a matched case to preview
          </div>
        )}

        {/* ── Footer ── */}
        {report && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(15,23,42,0.8)" }}>
            <button
              onClick={onOpenFull}
              className="ps-btn-primary" style={{ width: "100%" }}
            >
              View Full Report →
            </button>
          </div>
        )}
      </div>
    </>
  );
};
