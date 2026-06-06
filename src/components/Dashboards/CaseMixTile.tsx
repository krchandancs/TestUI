import React, { useState } from "react";
import '../../pathscribe.css';
import { pathscribeTheme } from "@theme/pathscribeTheme";
import type { CaseMixData } from "../../types/ContributionDashboard";

export interface CaseMixTileProps {
  title: string;
  data: CaseMixData;
  colors: Record<keyof CaseMixData, string>;
  showCounts?: boolean;
}

const CATEGORY_LABELS: Record<keyof CaseMixData, string> = {
  breast: "Breast",
  gi:     "GI",
  gu:     "GU",
  derm:   "Derm",
  other:  "Other",
};

const t = pathscribeTheme;

const CaseMixTile: React.FC<CaseMixTileProps> = ({ title, data, colors, showCounts: _showCounts = false }) => {
  const [hovered, setHovered] = useState<keyof CaseMixData | null>(null);
  const categories = Object.keys(data) as Array<keyof CaseMixData>;
  const total = categories.reduce((sum, k) => sum + data[k], 0);
  const maxVal = Math.max(...categories.map(k => data[k]));

  return (
    <div style={{
      padding: "20px", borderRadius: "18px",
      background: t.colors.surfaceSubtle,
      border: `1px solid ${t.colors.border.subtle}`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: t.colors.text.primary }}>{title}</div>
          <div style={{ fontSize: "13px", color: t.colors.text.muted }}>
            Distribution of signed‑out cases by category · {total} total
          </div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", height: "120px" }}>
        {categories.map((key) => {
          const pct    = Math.round((data[key] / total) * 100);
          const barH   = (data[key] / maxVal) * 80;
          const isHov  = hovered === key;

          return (
            <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", cursor: "default" }}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                  background: t.colors.background.panel, border: `1px solid ${t.colors.border.subtle}`,
                  borderRadius: "8px", padding: "7px 10px", fontSize: "12px",
                  color: t.colors.text.secondary, whiteSpace: "nowrap", zIndex: 10,
                  boxShadow: `0 4px 16px ${t.colors.tile.shadow}`,
                }}>
                  <div style={{ fontWeight: 700, color: t.colors.text.primary }}>{CATEGORY_LABELS[key]}</div>
                  <div>{data[key]} cases · {pct}%</div>
                </div>
              )}

              {/* Count always visible above bar */}
              <div style={{ fontSize: "12px", fontWeight: 700, color: colors[key], marginBottom: "4px" }}>
                {data[key]}
              </div>

              {/* Bar */}
              <div style={{
                width: "100%", height: `${barH}px`,
                borderRadius: "6px 6px 0 0",
                background: colors[key],
                opacity: isHov ? 1 : 0.85,
                transition: "height 0.25s ease, opacity 0.15s",
              }} />

              {/* Label + pct always visible below */}
              <div style={{ marginTop: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: t.colors.text.muted }}>{CATEGORY_LABELS[key]}</div>
                <div style={{ fontSize: "11px", color: t.colors.text.muted, marginTop: "1px" }}>{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseMixTile;
