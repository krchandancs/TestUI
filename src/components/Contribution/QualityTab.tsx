// src/components/Contribution/QualityTab.tsx
import React, { useState } from "react";
import '../../pathscribe.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity   = "low" | "medium" | "high";
type DateRange  = "30d" | "90d" | "ytd";
type Section    = "discordant" | "amended" | "tat" | "tatClient";
type TatSubView = "firstTouch" | "total";
type MetricView = "firstTouch" | "total";

interface DiscordantCase {
  id: string; caseType: string; frozenDx: string; finalDx: string;
  delta: string; date: string; severity: Severity; daysAgo: number;
}
interface AmendedCase {
  id: string; caseType: string; reason: string; date: string; severity: Severity; daysAgo: number;
}
interface FirstTouchOutlier {
  id: string; caseType: string; date: string;
  firstTouchHrs: number; targetHrs: number; overByHrs: number; clientCode: string; daysAgo: number;
}
interface TotalTATOutlier {
  id: string; caseType: string; date: string;
  tatHrs: number; targetHrs: number; overByHrs: number; clientCode: string; daysAgo: number;
}
interface ClientTatRow {
  id: string; name: string; code: string;
  target:   { firstTouch: number; total: number };
  mine:     { firstTouch: number; total: number };
  peer:     { firstTouch: number; total: number };
  breaches: { firstTouch: number; total: number };
}
interface TatTrendMonth {
  month: string; firstTouch: number; total: number; cases: number;
}
interface ClientTatConfig {
  label: string; targetFirst: number; targetTotal: number;
  peerFirst: number; peerTotal: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockDiscordant: DiscordantCase[] = [
  { id: "PSA-2024-1190", caseType: "Breast Core Bx",    frozenDx: "Atypical, favor benign",  finalDx: "DCIS, low grade",         delta: "Upgraded",   date: "Aug 12", severity: "high",   daysAgo: 13  },
  { id: "PSA-2024-1178", caseType: "Colon Polypectomy", frozenDx: "Adenoma, low-grade",      finalDx: "Adenoma, low-grade",      delta: "Concordant", date: "Aug 9",  severity: "low",    daysAgo: 16  },
  { id: "PSA-2024-1165", caseType: "Thyroid Lobe",      frozenDx: "Follicular lesion",       finalDx: "Follicular carcinoma",    delta: "Upgraded",   date: "Aug 5",  severity: "medium", daysAgo: 20  },
  { id: "PSA-2024-1142", caseType: "Lymph Node",        frozenDx: "Reactive",                finalDx: "Metastatic carcinoma",    delta: "Upgraded",   date: "Jul 28", severity: "high",   daysAgo: 28  },
  { id: "PSA-2024-1098", caseType: "Soft Tissue Mass",  frozenDx: "Spindle cell neoplasm",   finalDx: "Low-grade sarcoma",       delta: "Upgraded",   date: "Jul 3",  severity: "medium", daysAgo: 53  },
  { id: "PSA-2024-1071", caseType: "Liver Wedge",       frozenDx: "Atypical hepatocytes",    finalDx: "Hepatocellular carcinoma",delta: "Upgraded",   date: "Jun 15", severity: "high",   daysAgo: 71  },
  { id: "PSA-2024-1034", caseType: "Lung Wedge",        frozenDx: "Inflammatory change",     finalDx: "Adenocarcinoma",          delta: "Upgraded",   date: "May 20", severity: "high",   daysAgo: 97  },
  { id: "PSA-2024-0988", caseType: "Prostate Bx",       frozenDx: "PIN, high grade",         finalDx: "Gleason 3+4 carcinoma",   delta: "Upgraded",   date: "Apr 18", severity: "medium", daysAgo: 129 },
];

const mockAmended: AmendedCase[] = [
  { id: "PSA-2024-1201", caseType: "Prostate Bx",      reason: "Specimen labeling mismatch",    date: "Aug 14", severity: "high",   daysAgo: 11  },
  { id: "PSA-2024-1185", caseType: "Skin Excision",    reason: "Margin status correction",       date: "Aug 11", severity: "medium", daysAgo: 14  },
  { id: "PSA-2024-1170", caseType: "GI Biopsy",        reason: "Diagnosis clarification added",  date: "Aug 6",  severity: "low",    daysAgo: 19  },
  { id: "PSA-2024-1155", caseType: "Breast Excision",  reason: "IHC results addended",           date: "Jul 31", severity: "low",    daysAgo: 25  },
  { id: "PSA-2024-1102", caseType: "Renal Biopsy",     reason: "Tumour grade amended",           date: "Jun 28", severity: "medium", daysAgo: 58  },
  { id: "PSA-2024-1063", caseType: "Lymph Node Panel", reason: "Additional immunostains addended",date: "Jun 5", severity: "low",    daysAgo: 81  },
  { id: "PSA-2024-1021", caseType: "Thyroid FNA",      reason: "Cytological reclassification",   date: "May 8",  severity: "medium", daysAgo: 109 },
];

const mockFirstTouchOutliers: FirstTouchOutlier[] = [
  { id: "PSA-2024-1199", caseType: "Renal Biopsy",  date: "Aug 14", firstTouchHrs: 7.2,  targetHrs: 4, overByHrs: 3.2, clientCode: "MGH", daysAgo: 11  },
  { id: "PSA-2024-1188", caseType: "Lung Wedge",    date: "Aug 10", firstTouchHrs: 9.1,  targetHrs: 4, overByHrs: 5.1, clientCode: "MGH", daysAgo: 15  },
  { id: "PSA-2024-1173", caseType: "Liver Core Bx", date: "Aug 6",  firstTouchHrs: 10.4, targetHrs: 8, overByHrs: 2.4, clientCode: "RMC", daysAgo: 19  },
  { id: "PSA-2024-1099", caseType: "Brain Biopsy",  date: "Jul 1",  firstTouchHrs: 6.8,  targetHrs: 4, overByHrs: 2.8, clientCode: "MGH", daysAgo: 55  },
  { id: "PSA-2024-1052", caseType: "Bone Marrow",   date: "Jun 8",  firstTouchHrs: 11.2, targetHrs: 8, overByHrs: 3.2, clientCode: "RMC", daysAgo: 78  },
  { id: "PSA-2024-0997", caseType: "Skin Punch Bx", date: "Apr 30", firstTouchHrs: 8.4,  targetHrs: 6, overByHrs: 2.4, clientCode: "WSC", daysAgo: 116 },
];

const mockTotalTATOutliers: TotalTATOutlier[] = [
  { id: "PSA-2024-1198", caseType: "Soft Tissue Mass", date: "Aug 13", tatHrs: 31.2, targetHrs: 24, overByHrs: 7.2,  clientCode: "MGH", daysAgo: 12  },
  { id: "PSA-2024-1176", caseType: "Decalcified Bone", date: "Aug 8",  tatHrs: 52.4, targetHrs: 48, overByHrs: 4.4,  clientCode: "RMC", daysAgo: 17  },
  { id: "PSA-2024-1160", caseType: "Lymph Node Panel", date: "Aug 2",  tatHrs: 28.6, targetHrs: 24, overByHrs: 4.6,  clientCode: "MGH", daysAgo: 23  },
  { id: "PSA-2024-1104", caseType: "Placenta",          date: "Jun 30", tatHrs: 36.1, targetHrs: 24, overByHrs: 12.1, clientCode: "WSC", daysAgo: 56  },
  { id: "PSA-2024-1058", caseType: "Liver Resection",   date: "Jun 10", tatHrs: 58.2, targetHrs: 48, overByHrs: 10.2, clientCode: "MGH", daysAgo: 76  },
  { id: "PSA-2024-0995", caseType: "Bone Marrow Bx",    date: "Apr 28", tatHrs: 74.4, targetHrs: 48, overByHrs: 26.4, clientCode: "RMC", daysAgo: 118 },
];

const mockTatByClient: ClientTatRow[] = [
  { id: 'c1', name: 'Metro General Hospital',   code: 'MGH', target: { firstTouch: 4,  total: 24 }, mine: { firstTouch: 2.4, total: 18.2 }, peer: { firstTouch: 3.1, total: 21.4 }, breaches: { firstTouch: 2, total: 1 } },
  { id: 'c4', name: 'Westview Surgery Center',  code: 'WSC', target: { firstTouch: 6,  total: 36 }, mine: { firstTouch: 4.8, total: 28.6 }, peer: { firstTouch: 5.2, total: 31.0 }, breaches: { firstTouch: 0, total: 1 } },
  { id: 'c2', name: 'Riverside Medical Center', code: 'RMC', target: { firstTouch: 8,  total: 48 }, mine: { firstTouch: 6.2, total: 39.1 }, peer: { firstTouch: 7.4, total: 42.0 }, breaches: { firstTouch: 1, total: 1 } },
];

const peerAvgTotal = 26.9;

const mockSummary = {
  discordant:         mockDiscordant.length,
  amended:            mockAmended.length,
  firstTouchBreaches: mockFirstTouchOutliers.length,
  totalTatBreaches:   mockTotalTATOutliers.length,
  concordanceRate:    94.2,
};

// ─── TAT Trend data ───────────────────────────────────────────────────────────

const CLIENT_CONFIG: Record<string, ClientTatConfig> = {
  all: { label: 'All Clients',             targetFirst: 5,  targetTotal: 30, peerFirst: 3.8, peerTotal: 24.2 },
  c1:  { label: 'MGH — Metro General',     targetFirst: 4,  targetTotal: 24, peerFirst: 3.1, peerTotal: 21.4 },
  c4:  { label: 'WSC — Westview Surgery',  targetFirst: 6,  targetTotal: 36, peerFirst: 5.2, peerTotal: 31.0 },
  c2:  { label: 'RMC — Riverside Medical', targetFirst: 8,  targetTotal: 48, peerFirst: 7.4, peerTotal: 42.0 },
};

const TREND_DATA: Record<string, TatTrendMonth[]> = {
  all: [
    { month: "Sep '24", firstTouch: 3.2, total: 22.4, cases: 310 },
    { month: "Oct '24", firstTouch: 3.6, total: 24.1, cases: 334 },
    { month: "Nov '24", firstTouch: 4.1, total: 26.8, cases: 298 },
    { month: "Dec '24", firstTouch: 3.8, total: 25.3, cases: 261 },
    { month: "Jan '25", firstTouch: 3.3, total: 22.9, cases: 305 },
    { month: "Feb '25", firstTouch: 3.7, total: 24.6, cases: 318 },
    { month: "Mar '25", firstTouch: 4.2, total: 27.1, cases: 341 },
    { month: "Apr '25", firstTouch: 3.5, total: 23.8, cases: 352 },
    { month: "May '25", firstTouch: 3.1, total: 22.1, cases: 346 },
    { month: "Jun '25", firstTouch: 3.4, total: 24.0, cases: 368 },
    { month: "Jul '25", firstTouch: 2.9, total: 21.6, cases: 341 },
    { month: "Aug '25", firstTouch: 2.4, total: 18.2, cases: 387 },
  ],
  c1: [
    { month: "Sep '24", firstTouch: 2.1, total: 16.8, cases: 98  },
    { month: "Oct '24", firstTouch: 2.8, total: 19.2, cases: 112 },
    { month: "Nov '24", firstTouch: 3.1, total: 22.4, cases: 89  },
    { month: "Dec '24", firstTouch: 2.6, total: 20.1, cases: 76  },
    { month: "Jan '25", firstTouch: 2.2, total: 17.6, cases: 94  },
    { month: "Feb '25", firstTouch: 2.9, total: 21.3, cases: 108 },
    { month: "Mar '25", firstTouch: 3.4, total: 23.8, cases: 115 },
    { month: "Apr '25", firstTouch: 2.7, total: 19.9, cases: 121 },
    { month: "May '25", firstTouch: 2.3, total: 18.4, cases: 118 },
    { month: "Jun '25", firstTouch: 2.6, total: 20.7, cases: 128 },
    { month: "Jul '25", firstTouch: 2.2, total: 17.9, cases: 115 },
    { month: "Aug '25", firstTouch: 2.4, total: 18.2, cases: 132 },
  ],
  c4: [
    { month: "Sep '24", firstTouch: 4.2, total: 28.1, cases: 74  },
    { month: "Oct '24", firstTouch: 4.8, total: 30.4, cases: 81  },
    { month: "Nov '24", firstTouch: 5.6, total: 33.2, cases: 68  },
    { month: "Dec '24", firstTouch: 5.1, total: 31.7, cases: 54  },
    { month: "Jan '25", firstTouch: 4.4, total: 28.9, cases: 71  },
    { month: "Feb '25", firstTouch: 4.9, total: 30.8, cases: 78  },
    { month: "Mar '25", firstTouch: 5.8, total: 34.1, cases: 84  },
    { month: "Apr '25", firstTouch: 4.6, total: 29.6, cases: 88  },
    { month: "May '25", firstTouch: 4.1, total: 27.8, cases: 86  },
    { month: "Jun '25", firstTouch: 4.5, total: 29.9, cases: 94  },
    { month: "Jul '25", firstTouch: 3.9, total: 27.2, cases: 88  },
    { month: "Aug '25", firstTouch: 4.8, total: 28.6, cases: 96  },
  ],
  c2: [
    { month: "Sep '24", firstTouch: 5.8, total: 38.4, cases: 138 },
    { month: "Oct '24", firstTouch: 6.4, total: 41.2, cases: 141 },
    { month: "Nov '24", firstTouch: 7.2, total: 44.8, cases: 141 },
    { month: "Dec '24", firstTouch: 6.9, total: 43.1, cases: 131 },
    { month: "Jan '25", firstTouch: 6.1, total: 39.6, cases: 140 },
    { month: "Feb '25", firstTouch: 6.7, total: 42.4, cases: 132 },
    { month: "Mar '25", firstTouch: 7.4, total: 45.8, cases: 142 },
    { month: "Apr '25", firstTouch: 6.3, total: 40.7, cases: 143 },
    { month: "May '25", firstTouch: 5.9, total: 38.9, cases: 142 },
    { month: "Jun '25", firstTouch: 6.2, total: 41.1, cases: 146 },
    { month: "Jul '25", firstTouch: 5.8, total: 38.6, cases: 138 },
    { month: "Aug '25", firstTouch: 6.2, total: 39.1, cases: 159 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityClass = (s: Severity) =>
  `ps-severity-badge ps-severity-badge--${s}`;

const barColor = (pct: number) =>
  pct < 70 ? '#10b981' : pct < 90 ? '#f59e0b' : '#ef4444';

const deltaLabel = (mine: number, peer: number) => {
  const diff   = mine - peer;
  const faster = diff < 0;
  return { text: `${faster ? '↓' : '↑'} ${Math.abs(diff).toFixed(1)}h vs peers`, color: faster ? '#10b981' : '#f59e0b' };
};

// Summary tile colour map
const SUMMARY_TILES = [
  { label: "Discordant Cases",   key: "discordant"         as const, unit: "",  color: "#f97316", icon: "⚠️" },
  { label: "Amended Reports",    key: "amended"            as const, unit: "",  color: "#FDD663", icon: "✏️" },
  { label: "1st Touch Breaches", key: "firstTouchBreaches" as const, unit: "",  color: "#f59e0b", icon: "⚡" },
  { label: "Total TAT Breaches", key: "totalTatBreaches"   as const, unit: "",  color: "#f97316", icon: "⏱️" },
  { label: "Concordance Rate",   key: "concordanceRate"    as const, unit: "%", color: "#10b981", icon: "✓"  },
];

// ─── Custom Reference Line Label — callout with leader line ──────────────────

interface RefLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  value:    string;
  color:    string;
  side:     'left' | 'right';
  nudge?:   number;  // px offset from the line: negative = above, positive = below
}

const RefLineLabel: React.FC<RefLabelProps> = ({
  viewBox, value, color, side, nudge = -16,
}) => {
  if (!viewBox) return null;
  const { x, y, width } = viewBox;

  const isLeft  = side === 'left';
  const pinX    = isLeft ? x + 44 : x + width - 44;   // where leader touches the ref line
  const labelY  = y + nudge;
  const leaderY1 = nudge < 0 ? labelY + 12 : labelY;  // from bottom/top of label text
  const leaderY2 = y;                                   // to the actual reference line

  return (
    <g>
      {/* Leader line */}
      <line
        x1={pinX} y1={leaderY1}
        x2={pinX} y2={leaderY2}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="2 2"
        opacity={0.55}
      />
      {/* Callout dot on the reference line */}
      <circle cx={pinX} cy={y} r={2.5} fill={color} opacity={0.7} />
      {/* Label text with dark halo so it reads over any background */}
      <text
        x={isLeft ? pinX + 4 : pinX - 4}
        y={labelY + 9}
        fontSize={9.5}
        fontWeight={700}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={color}
        textAnchor={isLeft ? 'start' : 'end'}
        style={{
          paintOrder:      'stroke fill',
          stroke:          '#0a1628',
          strokeWidth:     '3.5px',
          strokeLinejoin:  'round',
        } as React.CSSProperties}
      >
        {value}
      </text>
    </g>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const TatTooltip = ({ active, payload, label, data, cfg }: any) => {
  if (!active || !payload?.length) return null;
  const ft    = payload.find((p: any) => p.dataKey === 'firstTouch');
  const tt    = payload.find((p: any) => p.dataKey === 'total');
  const cases = (data as TatTrendMonth[]).find(d => d.month === label)?.cases ?? 0;
  return (
    <div className="ps-tat-trend__tooltip">
      <div className="ps-tat-trend__tooltip-header">{label} · {cases} cases</div>
      {ft && <div className="ps-tat-trend__tooltip-ft">⚡ First Touch: {ft.value}h</div>}
      {tt && <div className="ps-tat-trend__tooltip-total">✓ Total Case: {tt.value}h</div>}
      <div className="ps-tat-trend__tooltip-footer">
        Target: {cfg.targetFirst}h / {cfg.targetTotal}h &nbsp;·&nbsp; Peer: {cfg.peerFirst}h / {cfg.peerTotal}h
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const QualityTab: React.FC = () => {
  const [section,     setSection]     = useState<Section>("discordant");
  const [dateRange,   setDateRange]   = useState<DateRange>("30d");

  // Derive filtered arrays from the selected date range
  const cutoff             = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 366;
  const filteredDiscordant = mockDiscordant.filter(r => r.daysAgo <= cutoff);
  const filteredAmended    = mockAmended.filter(r => r.daysAgo <= cutoff);
  const filteredFirstTouch = mockFirstTouchOutliers.filter(r => r.daysAgo <= cutoff);
  const filteredTotalTAT   = mockTotalTATOutliers.filter(r => r.daysAgo <= cutoff);

  // TAT trend: 30d=last 1 month, 90d=last 3 months, ytd=all 12
  const trendSlice = dateRange === "30d" ? -1 : dateRange === "90d" ? -3 : undefined;
  const trendData  = (clientId: string) => {
    const d = TREND_DATA[clientId] ?? TREND_DATA.all;
    return trendSlice !== undefined ? d.slice(trendSlice) : d;
  };

  // Reactive summary counts that update with the filter
  const summaryData = {
    discordant:         filteredDiscordant.length,
    amended:            filteredAmended.length,
    firstTouchBreaches: filteredFirstTouch.length,
    totalTatBreaches:   filteredTotalTAT.length,
    concordanceRate:    mockSummary.concordanceRate,
  };
  const [tatSubView,  setTatSubView]  = useState<TatSubView>("firstTouch");
  const [metric,      setMetric]      = useState<MetricView>("total");
  const [trendClient, setTrendClient] = useState<string>("all");

  const trendCfg  = CLIENT_CONFIG[trendClient];
  const trendRows = trendData(trendClient);
  const yMax      = Math.ceil(Math.max(trendCfg.targetTotal, ...trendRows.map(d => d.total)) * 1.15);

  return (
    <div className="ps-quality-container">

      {/* ── Summary tiles ── */}
      <div className="ps-quality-summary-grid">
        {SUMMARY_TILES.map(s => (
          <div key={s.label} className="ps-quality-summary-tile">
            <div className="ps-quality-summary-tile__header">
              <span className="ps-quality-summary-tile__label">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="ps-quality-summary-tile__value-row">
              <span className="ps-quality-summary-tile__value" style={{ color: s.color }}>
                {summaryData[s.key]}
              </span>
              {s.unit && <span className="ps-quality-summary-tile__unit">{s.unit}</span>}
            </div>
            <div className="ps-quality-summary-tile__period">Last {dateRange}</div>
          </div>
        ))}
      </div>

      {/* ── Section nav + date range ── */}
      <div className="ps-quality-nav">
        <div className="ps-quality-nav__left">
          <button className={`ps-quality-btn${section === "discordant" ? " active" : ""}`} onClick={() => setSection("discordant")}>Frozen vs Final</button>
          <button className={`ps-quality-btn${section === "amended"    ? " active" : ""}`} onClick={() => setSection("amended")}>Amended Reports</button>
          <button className={`ps-quality-btn${section === "tat"        ? " active" : ""}`} onClick={() => setSection("tat")}>TAT Outliers</button>
          <button className={`ps-quality-btn${section === "tatClient"  ? " active" : ""}`} onClick={() => setSection("tatClient")}>TAT by Client</button>
        </div>
        <div className="ps-quality-nav__right">
          {(["30d", "90d", "ytd"] as DateRange[]).map(r => (
            <button key={r} className={`ps-quality-btn${dateRange === r ? " active" : ""}`} onClick={() => setDateRange(r)}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Discordant diagnoses ── */}
      {section === "discordant" && (
        <div className="ps-quality-card">
          <div className="ps-quality-card__header">
            <div className="ps-quality-card__title">Discordant Diagnoses</div>
            <div className="ps-quality-card__subtitle">Cases where frozen section and final diagnosis differ</div>
          </div>
          <table className="ps-quality-table">
            <thead>
              <tr>{["Case", "Type", "Frozen Dx", "Final Dx", "Delta", "Date", "Severity"].map(h => <th key={h} className="ps-quality-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredDiscordant.map(c => (
                <tr key={c.id}>
                  <td className="ps-quality-td ps-quality-td--accent">{c.id}</td>
                  <td className="ps-quality-td">{c.caseType}</td>
                  <td className="ps-quality-td ps-quality-td--muted">{c.frozenDx}</td>
                  <td className="ps-quality-td ps-quality-td--primary">{c.finalDx}</td>
                  <td className="ps-quality-td">
                    <span className={c.delta === "Concordant" ? "ps-delta--concordant" : "ps-delta--upgraded"}>
                      {c.delta === "Concordant" ? "✓" : "↑"} {c.delta}
                    </span>
                  </td>
                  <td className="ps-quality-td ps-quality-td--muted">{c.date}</td>
                  <td className="ps-quality-td"><span className={severityClass(c.severity)}>{c.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Amended reports ── */}
      {section === "amended" && (
        <div className="ps-quality-card">
          <div className="ps-quality-card__header">
            <div className="ps-quality-card__title">Amended Reports</div>
            <div className="ps-quality-card__subtitle">Reports modified after initial sign-out</div>
          </div>
          <table className="ps-quality-table">
            <thead>
              <tr>{["Case", "Type", "Reason for Amendment", "Date", "Severity"].map(h => <th key={h} className="ps-quality-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredAmended.map(c => (
                <tr key={c.id}>
                  <td className="ps-quality-td ps-quality-td--accent">{c.id}</td>
                  <td className="ps-quality-td">{c.caseType}</td>
                  <td className="ps-quality-td ps-quality-td--primary">{c.reason}</td>
                  <td className="ps-quality-td ps-quality-td--muted">{c.date}</td>
                  <td className="ps-quality-td"><span className={severityClass(c.severity)}>{c.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAT Outliers — split sub-views ── */}
      {section === "tat" && (
        <div className="ps-quality-tat-outliers">

          <div className="ps-quality-sub-toggle">
            <button className={`ps-quality-sub-btn${tatSubView === "firstTouch" ? " active" : ""}`} onClick={() => setTatSubView("firstTouch")}>
              ⚡ First Touch Breaches
              {mockFirstTouchOutliers.length > 0 && <span className="ps-quality-sub-btn__badge">{mockFirstTouchOutliers.length}</span>}
            </button>
            <button className={`ps-quality-sub-btn${tatSubView === "total" ? " active" : ""}`} onClick={() => setTatSubView("total")}>
              ✓ Total TAT Breaches
              {mockTotalTATOutliers.length > 0 && <span className="ps-quality-sub-btn__badge">{mockTotalTATOutliers.length}</span>}
            </button>
          </div>

          {tatSubView === "firstTouch" && (
            <div className="ps-quality-card">
              <div className="ps-quality-card__header">
                <div className="ps-quality-card__title">⚡ First Touch Breaches</div>
                <div className="ps-quality-card__subtitle">Cases not opened within the client's first-touch TAT threshold</div>
              </div>
              {filteredFirstTouch.length === 0
                ? <div className="ps-quality-empty">✓ No first-touch breaches this period</div>
                : (
                  <table className="ps-quality-table">
                    <thead>
                      <tr>{["Case", "Type", "Client", "First Opened", "Target", "Over By", "Date"].map(h => <th key={h} className="ps-quality-th">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredFirstTouch.map(c => (
                        <tr key={c.id}>
                          <td className="ps-quality-td ps-quality-td--accent">{c.id}</td>
                          <td className="ps-quality-td">{c.caseType}</td>
                          <td className="ps-quality-td"><span className="ps-client-code-badge">{c.clientCode}</span></td>
                          <td className="ps-quality-td ps-quality-td--warning">{c.firstTouchHrs}h</td>
                          <td className="ps-quality-td ps-quality-td--muted">{c.targetHrs}h</td>
                          <td className="ps-quality-td"><span className="ps-quality-over-by">+{c.overByHrs}h</span></td>
                          <td className="ps-quality-td ps-quality-td--muted">{c.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}

          {tatSubView === "total" && (
            <div className="ps-quality-card">
              <div className="ps-quality-card__header">
                <div className="ps-quality-card__title">✓ Total TAT Breaches</div>
                <div className="ps-quality-card__subtitle">Cases where receivedDate → finalizedAt exceeded the client's total TAT target</div>
              </div>
              {filteredTotalTAT.length === 0
                ? <div className="ps-quality-empty">✓ No total TAT breaches this period</div>
                : (
                  <table className="ps-quality-table">
                    <thead>
                      <tr>{["Case", "Type", "Client", "Actual TAT", "Target", "Over By", "Date"].map(h => <th key={h} className="ps-quality-th">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredTotalTAT.map(c => (
                        <tr key={c.id}>
                          <td className="ps-quality-td ps-quality-td--accent">{c.id}</td>
                          <td className="ps-quality-td">{c.caseType}</td>
                          <td className="ps-quality-td"><span className="ps-client-code-badge">{c.clientCode}</span></td>
                          <td className="ps-quality-td ps-quality-td--warning">{c.tatHrs}h</td>
                          <td className="ps-quality-td ps-quality-td--muted">{c.targetHrs}h</td>
                          <td className="ps-quality-td"><span className="ps-quality-over-by">+{c.overByHrs}h</span></td>
                          <td className="ps-quality-td ps-quality-td--muted">{c.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}
        </div>
      )}

      {/* ── TAT by Client ── */}
      {section === "tatClient" && (
        <div className="ps-quality-tat-client">

          <div className="ps-tat-client__section-header">
            <div>
              <div className="ps-tat-client__title">TAT by Client</div>
              <div className="ps-tat-client__subtitle">Your performance vs client targets · peer group overlay (anonymised, same subspecialty)</div>
            </div>
            <div className="ps-tat-client__metric-toggle">
              <button className={`ps-quality-sub-btn${metric === "firstTouch" ? " active" : ""}`} onClick={() => setMetric("firstTouch")}>⚡ First Touch</button>
              <button className={`ps-quality-sub-btn${metric === "total"      ? " active" : ""}`} onClick={() => setMetric("total")}>✓ Total TAT</button>
            </div>
          </div>

          <div className="ps-tat-client__cards">
            {mockTatByClient.map(client => {
              const myVal      = client.mine[metric];
              const target     = client.target[metric];
              const peerVal    = client.peer[metric];
              const pct        = Math.min(100, (myVal   / target) * 100);
              const peerPct    = Math.min(100, (peerVal / target) * 100);
              const color      = barColor(pct);
              const delta      = deltaLabel(myVal, peerVal);
              const breachCount = client.breaches[metric];

              return (
                <div key={client.id} className="ps-tat-client__card">
                  <div className="ps-tat-client__card-header">
                    <div className="ps-tat-client__card-left">
                      <span className="ps-client-code-badge">{client.code}</span>
                      <span className="ps-tat-client__card-name">{client.name}</span>
                    </div>
                    <div className="ps-tat-client__card-right">
                      {breachCount > 0 && (
                        <span className="ps-tat-client__breach-badge">
                          {breachCount} breach{breachCount !== 1 ? "es" : ""}
                        </span>
                      )}
                      <span className="ps-tat-client__delta" style={{ color: delta.color }}>{delta.text}</span>
                    </div>
                  </div>

                  <div className="ps-tat-client__bar-track">
                    <div className="ps-tat-client__bar-fill"    style={{ width: `${pct}%`,     background: color }} />
                    <div className="ps-tat-client__peer-marker" style={{ left:  `${peerPct}%` }} />
                    <div className="ps-tat-client__target-marker" />
                  </div>

                  <div className="ps-tat-client__legend-row">
                    <div className="ps-tat-client__legend-left">
                      <div className="ps-tat-client__legend-item">
                        <div className="ps-tat-client__legend-dot" style={{ background: color }} />
                        <span className="ps-tat-client__you-label" style={{ color }}>You: {myVal}h</span>
                      </div>
                      <div className="ps-tat-client__legend-item">
                        <div className="ps-tat-client__legend-peer-mark" />
                        <span className="ps-tat-client__peer-label">Peers: {peerVal}h</span>
                      </div>
                    </div>
                    <span className="ps-tat-client__pct-label">{pct.toFixed(0)}% of {target}h target used</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ps-tat-client__footer">
            <span>Peer avg (total TAT): {peerAvgTotal}h · anonymised · role-gated · same subspecialty</span>
            <span>Targets configured per client in Client Dictionary</span>
          </div>
        </div>
      )}

      {/* ── TAT Trend — 12-month chart, always visible ── */}
      {(() => {
        const cfg  = CLIENT_CONFIG[trendClient];
        const trendRows = trendData(trendClient);
        const yMax = Math.ceil(Math.max(cfg.targetTotal, ...trendRows.map(d => d.total)) * 1.15);

        // 12-month averages
        const avgFirst = +(trendRows.reduce((s, d) => s + d.firstTouch, 0) / trendRows.length).toFixed(1);
        const avgTotal = +(trendRows.reduce((s, d) => s + d.total,      0) / trendRows.length).toFixed(1);

        // vs target (negative = under target = good)
        const vsTargetFirst = +(avgFirst - cfg.targetFirst).toFixed(1);
        const vsTargetTotal = +(avgTotal - cfg.targetTotal).toFixed(1);

        // vs peer (negative = faster than peers = good)
        const vsPeerFirst = +(avgFirst - cfg.peerFirst).toFixed(1);
        const vsPeerTotal = +(avgTotal - cfg.peerTotal).toFixed(1);

        const pill = (val: number, good: 'under' | 'over') => {
          const positive = good === 'under' ? val < 0 : val > 0;
          return {
            color: val === 0 ? '#64748b' : positive ? '#10b981' : '#f59e0b',
            arrow: val === 0 ? '–' : val < 0 ? '↓' : '↑',
          };
        };

        // Custom X axis tick — only print year label when month transitions (Jan)
        const YearBoundaryTick = ({ x, y, payload }: any) => {
          const label   = payload.value as string;          // e.g. "Jan '25"
          const isJan   = label.startsWith("Jan");
          const month   = label.split(" '")[0];             // "Jan"
          const year    = isJan ? `'${label.split("'")[1]}` : null;
          return (
            <g transform={`translate(${x},${y})`}>
              <text x={0} y={0} dy={12} textAnchor="middle" fontSize={13} fill="#cbd5e1" fontWeight={600}>
                {month}
              </text>
              {year && (
                <text x={0} y={0} dy={24} textAnchor="middle" fontSize={10} fill="#7dd3fc" fontWeight={700}>
                  {year}
                </text>
              )}
            </g>
          );
        };

        const ftTarget  = pill(vsTargetFirst, 'under');
        const ttTarget  = pill(vsTargetTotal, 'under');
        const ftPeer    = pill(vsPeerFirst,   'under');
        const ttPeer    = pill(vsPeerTotal,   'under');

        return (
          <div className="ps-tat-trend">

            <div className="ps-tat-trend__header">
              <div>
                <div className="ps-tat-trend__title">TAT Trend — Last 12 Months</div>
                <div className="ps-tat-trend__subtitle">
                  Average first-touch and total TAT per month vs target and peer group
                </div>

                {/* 12-month summary pills */}
                <div className="ps-tat-trend__summary-row">
                  {/* Averages */}
                  <span className="ps-tat-trend__summary-group">
                    <span className="ps-tat-trend__summary-label">12-mo avg</span>
                    <span className="ps-tat-trend__summary-pill ps-tat-trend__summary-pill--teal">⚡ {avgFirst}h</span>
                    <span className="ps-tat-trend__summary-pill ps-tat-trend__summary-pill--amber">✓ {avgTotal}h</span>
                  </span>

                  <span className="ps-tat-trend__summary-divider">|</span>

                  {/* vs target */}
                  <span className="ps-tat-trend__summary-group">
                    <span className="ps-tat-trend__summary-label">vs target</span>
                    <span className="ps-tat-trend__summary-delta" style={{ color: ftTarget.color }}>
                      {ftTarget.arrow} {Math.abs(vsTargetFirst)}h
                    </span>
                    <span className="ps-tat-trend__summary-delta" style={{ color: ttTarget.color }}>
                      {ttTarget.arrow} {Math.abs(vsTargetTotal)}h
                    </span>
                  </span>

                  <span className="ps-tat-trend__summary-divider">|</span>

                  {/* vs peers */}
                  <span className="ps-tat-trend__summary-group">
                    <span className="ps-tat-trend__summary-label">vs peers</span>
                    <span className="ps-tat-trend__summary-delta" style={{ color: ftPeer.color }}>
                      {ftPeer.arrow} {Math.abs(vsPeerFirst)}h
                    </span>
                    <span className="ps-tat-trend__summary-delta" style={{ color: ttPeer.color }}>
                      {ttPeer.arrow} {Math.abs(vsPeerTotal)}h
                    </span>
                  </span>
                </div>
              </div>

              <div className="ps-tat-trend__switcher">
                {Object.entries(CLIENT_CONFIG).map(([key]) => (
                  <button
                    key={key}
                    onClick={() => setTrendClient(key)}
                    className={`ps-tat-trend__client-btn${trendClient === key ? " active" : ""}`}
                  >
                    {key === "all" ? "All Clients" : key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps-tat-trend__legend">
              <div className="ps-tat-trend__legend-item ps-tat-trend__legend-item--teal">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#7dd3fc" strokeWidth="2" /></svg>
                ⚡ First Touch avg
              </div>
              <div className="ps-tat-trend__legend-item ps-tat-trend__legend-item--amber">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#fcd34d" strokeWidth="2" /></svg>
                ✓ Total Case avg
              </div>
              <div className="ps-tat-trend__legend-item ps-tat-trend__legend-item--red">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                Target
              </div>
              <div className="ps-tat-trend__legend-item ps-tat-trend__legend-item--purple">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 3" /></svg>
                Peer avg
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendRows} margin={{ top: 8, right: 24, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={<YearBoundaryTick />}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  height={40}
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fontSize: 13, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}h`}
                  width={42}
                />
                <Tooltip content={<TatTooltip data={trendRows} cfg={cfg} />} />

                <ReferenceLine y={cfg.targetFirst} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                  label={<RefLineLabel value={`⚡ ${cfg.targetFirst}h target`} color="#ef4444" side="left"  nudge={-18} />} />
                <ReferenceLine y={cfg.targetTotal} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                  label={<RefLineLabel value={`✓ ${cfg.targetTotal}h target`}  color="#ef4444" side="left"  nudge={-18} />} />
                <ReferenceLine y={cfg.peerFirst}   stroke="#a78bfa" strokeDasharray="2 3" strokeWidth={1.5}
                  label={<RefLineLabel value={`⚡ peer ${cfg.peerFirst}h`}      color="#a78bfa" side="right" nudge={8}   />} />
                <ReferenceLine y={cfg.peerTotal}   stroke="#a78bfa" strokeDasharray="2 3" strokeWidth={1.5}
                  label={<RefLineLabel value={`✓ peer ${cfg.peerTotal}h`}       color="#a78bfa" side="right" nudge={8}   />} />

                <Line type="monotone" dataKey="firstTouch" stroke="#7dd3fc" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7dd3fc', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#7dd3fc' }} />
                <Line type="monotone" dataKey="total" stroke="#fcd34d" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#fcd34d', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fcd34d' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

    </div>
  );
};

export default QualityTab;
