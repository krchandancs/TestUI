// src/components/Contribution/AIContributionTab.tsx
import React, { useState } from "react";
import '../../pathscribe.css';
import { pathscribeTheme as t } from "@theme/pathscribeTheme";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = "30d" | "90d" | "ytd";

interface OverriddenCase {
  id: string; caseType: string; aiSuggestion: string;
  finalDiagnosis: string; reason: string; date: string;
}

interface CaseComparison {
  caseType: string; aiAssisted: number; manual: number;
  aiTat: number; manualTat: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockAiSummary = {
  acceptanceRate:    87,
  totalAiCases:      92,
  totalCases:        128,
  overriddenCount:   12,
  avgConfidence:     91.4,
  acceptanceDelta:   "+4.2%",
  up:                true,
};

const mockAcceptanceByType = [
  { type: "Breast",   rate: 91, cases: 38 },
  { type: "GI",       rate: 88, cases: 34 },
  { type: "GU",       rate: 85, cases: 19 },
  { type: "Derm",     rate: 82, cases: 15 },
  { type: "Other",    rate: 79, cases: 10 },
];

const mockOverridden: OverriddenCase[] = [
  { id: "PSA-2024-1195", caseType: "Breast Core Bx",   aiSuggestion: "Benign fibrocystic change",   finalDiagnosis: "Atypical ductal hyperplasia", reason: "Clinical context",     date: "Aug 13" },
  { id: "PSA-2024-1183", caseType: "Prostate Bx",      aiSuggestion: "Gleason 3+3=6",               finalDiagnosis: "Gleason 3+4=7",              reason: "Pattern assessment",   date: "Aug 10" },
  { id: "PSA-2024-1171", caseType: "Skin Shave",       aiSuggestion: "Compound nevus",              finalDiagnosis: "Dysplastic nevus, moderate",  reason: "Architectural atypia", date: "Aug 7"  },
  { id: "PSA-2024-1158", caseType: "Lymph Node",       aiSuggestion: "Reactive lymphadenopathy",    finalDiagnosis: "Metastatic carcinoma",        reason: "IHC correlation",      date: "Aug 1"  },
];

const mockComparison: CaseComparison[] = [
  { caseType: "Breast",  aiAssisted: 38, manual: 4, aiTat: 1.8, manualTat: 2.9 },
  { caseType: "GI",      aiAssisted: 34, manual: 4, aiTat: 1.5, manualTat: 2.4 },
  { caseType: "GU",      aiAssisted: 19, manual: 2, aiTat: 1.9, manualTat: 3.1 },
  { caseType: "Derm",    aiAssisted: 15, manual: 2, aiTat: 1.2, manualTat: 2.0 },
];

const mockMonthlyAcceptance = [
  { month: "Jan", rate: 82 }, { month: "Feb", rate: 84 }, { month: "Mar", rate: 83 },
  { month: "Apr", rate: 86 }, { month: "May", rate: 85 }, { month: "Jun", rate: 88 },
  { month: "Jul", rate: 87 }, { month: "Aug", rate: 87 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const th: React.CSSProperties = {
  padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600,
  color: t.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.06em",
  borderBottom: `1px solid ${t.colors.border.subtle}`, background: "rgba(255,255,255,0.02)",
};
const td: React.CSSProperties = {
  padding: "12px 12px", fontSize: "13px", color: t.colors.text.secondary,
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
};
const card: React.CSSProperties = {
  borderRadius: "16px", border: `1px solid ${t.colors.tile.border}`,
  background: t.colors.tile.background, padding: "20px",
};

type Section = "acceptance" | "overrides" | "comparison";

const AIContributionTab: React.FC = () => {
  const [section,   setSection]   = useState<Section>("acceptance");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const btn = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", cursor: "pointer",
    border: `1px solid ${active ? t.colors.accentTealBorder : t.colors.border.subtle}`,
    background: active ? t.colors.accentTealSubtle : t.colors.button.subtle,
    color: active ? t.colors.accentTeal : t.colors.text.muted, transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Summary tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "AI Acceptance Rate",  value: mockAiSummary.acceptanceRate, unit: "%", color: t.colors.semantic.success, delta: mockAiSummary.acceptanceDelta, up: mockAiSummary.up, icon: "✓" },
          { label: "AI-Assisted Cases",   value: mockAiSummary.totalAiCases,   unit: "",  color: t.colors.chart.cases,      delta: `of ${mockAiSummary.totalCases} total`, up: true, icon: "🤖" },
          { label: "Overrides",           value: mockAiSummary.overriddenCount, unit: "", color: "#FDD663",                  delta: "pathologist-changed",  up: false, icon: "✏️" },
          { label: "Avg AI Confidence",   value: mockAiSummary.avgConfidence,  unit: "%", color: t.colors.accentTeal,       delta: "across AI suggestions", up: true, icon: "📊" },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px", borderRadius: "14px", background: t.colors.tile.background, border: `1px solid ${t.colors.tile.border}`, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: t.colors.text.muted }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, color: s.color }}>{s.value}</span>
              {s.unit && <span style={{ fontSize: "13px", color: t.colors.text.muted }}>{s.unit}</span>}
            </div>
            <div style={{ fontSize: "11px", color: t.colors.text.muted }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Section nav + date range ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={btn(section === "acceptance")} onClick={() => setSection("acceptance")}>Acceptance Rate</button>
          <button style={btn(section === "overrides")}  onClick={() => setSection("overrides")}>AI Overrides</button>
          <button style={btn(section === "comparison")} onClick={() => setSection("comparison")}>AI vs Manual</button>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["30d", "90d", "ytd"] as DateRange[]).map(r => (
            <button key={r} style={btn(dateRange === r)} onClick={() => setDateRange(r)}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* ── Acceptance Rate section ── */}
      {section === "acceptance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Acceptance by case type */}
          <div style={card}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: t.colors.text.primary, marginBottom: "4px" }}>Acceptance by Case Type</div>
            <div style={{ fontSize: "12px", color: t.colors.text.muted, marginBottom: "20px" }}>% of AI suggestions accepted</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {mockAcceptanceByType.map(r => (
                <div key={r.type}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: t.colors.text.secondary }}>{r.type}</span>
                    <span style={{ color: t.colors.text.muted }}>{r.cases} cases · <span style={{ color: t.colors.accentTeal, fontWeight: 700 }}>{r.rate}%</span></span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${r.rate}%`, background: t.colors.accentTeal, borderRadius: "99px", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance trend chart */}
          <div style={card}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: t.colors.text.primary, marginBottom: "4px" }}>Acceptance Trend</div>
            <div style={{ fontSize: "12px", color: t.colors.text.muted, marginBottom: "16px" }}>Monthly AI suggestion acceptance rate</div>
            <svg viewBox="0 0 100 60" style={{ width: "100%", height: "160px", overflow: "visible" }}>
              {[50, 75, 100].map(y => (
                <line key={y} x1={0} y1={60 - y * 0.5} x2={100} y2={60 - y * 0.5} stroke={t.colors.chart.gridline} strokeWidth="0.4" />
              ))}
              {mockMonthlyAcceptance.map((d, i) => {
                const x = (i / (mockMonthlyAcceptance.length - 1)) * 100;
                const y = 60 - (d.rate / 100) * 50;
                return <circle key={d.month} cx={x} cy={y} r="1.8" fill={t.colors.accentTeal} />;
              })}
              <path
                d={mockMonthlyAcceptance.map((d, i) => {
                  const x = (i / (mockMonthlyAcceptance.length - 1)) * 100;
                  const y = 60 - (d.rate / 100) * 50;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none" stroke={t.colors.accentTeal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
              {mockMonthlyAcceptance.map((d, i) => (
                <text key={d.month} x={(i / (mockMonthlyAcceptance.length - 1)) * 100} y="67" textAnchor="middle" fontSize="4.5" fill={t.colors.chart.axis}>{d.month}</text>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* ── AI Overrides (flagged + changed) ── */}
      {section === "overrides" && (
        <div style={{ borderRadius: "16px", border: `1px solid ${t.colors.tile.border}`, background: t.colors.tile.background, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: t.colors.text.primary }}>AI Overrides</div>
            <div style={{ fontSize: "12px", color: t.colors.text.muted, marginTop: "2px", marginBottom: "12px" }}>
              Cases where AI suggestion was reviewed and changed by pathologist
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Case</th>
                <th style={th}>Type</th>
                <th style={th}>AI Suggestion</th>
                <th style={th}>Final Diagnosis</th>
                <th style={th}>Override Reason</th>
                <th style={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {mockOverridden.map(c => (
                <tr key={c.id}>
                  <td style={{ ...td, color: t.colors.accentTeal, fontWeight: 600 }}>{c.id}</td>
                  <td style={td}>{c.caseType}</td>
                  <td style={{ ...td, color: t.colors.text.muted }}>{c.aiSuggestion}</td>
                  <td style={{ ...td, color: t.colors.text.primary }}>{c.finalDiagnosis}</td>
                  <td style={td}>
                    <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "99px", background: "rgba(45,212,191,0.1)", border: `1px solid ${t.colors.accentTealBorder}`, color: t.colors.accentTeal }}>
                      {c.reason}
                    </span>
                  </td>
                  <td style={{ ...td, color: t.colors.text.muted }}>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AI vs Manual comparison ── */}
      {section === "comparison" && (
        <div style={{ borderRadius: "16px", border: `1px solid ${t.colors.tile.border}`, background: t.colors.tile.background, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: t.colors.text.primary }}>AI-Assisted vs Manual</div>
            <div style={{ fontSize: "12px", color: t.colors.text.muted, marginTop: "2px", marginBottom: "4px" }}>
              Case volume and average turnaround time by workflow type
            </div>
            <div style={{ display: "flex", gap: "14px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: t.colors.accentTeal }} />
                <span style={{ fontSize: "11px", color: t.colors.text.muted }}>AI-Assisted</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: t.colors.chart.cases }} />
                <span style={{ fontSize: "11px", color: t.colors.text.muted }}>Manual</span>
              </div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Case Type</th>
                <th style={th}>AI Cases</th>
                <th style={th}>Manual Cases</th>
                <th style={th}>AI Avg TAT</th>
                <th style={th}>Manual Avg TAT</th>
                <th style={th}>TAT Improvement</th>
              </tr>
            </thead>
            <tbody>
              {mockComparison.map(c => {
                const improvement = ((c.manualTat - c.aiTat) / c.manualTat * 100).toFixed(0);
                return (
                  <tr key={c.caseType}>
                    <td style={{ ...td, fontWeight: 600, color: t.colors.text.primary }}>{c.caseType}</td>
                    <td style={{ ...td, color: t.colors.accentTeal, fontWeight: 700 }}>{c.aiAssisted}</td>
                    <td style={{ ...td, color: t.colors.chart.cases }}>{c.manual}</td>
                    <td style={{ ...td, color: t.colors.accentTeal, fontWeight: 600 }}>{c.aiTat}d</td>
                    <td style={{ ...td, color: t.colors.text.muted }}>{c.manualTat}d</td>
                    <td style={td}>
                      <span style={{ color: t.colors.semantic.success, fontWeight: 700 }}>▲ {improvement}% faster</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default AIContributionTab;
