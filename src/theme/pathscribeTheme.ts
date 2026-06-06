export const pathscribeTheme = {
  colors: {
    // ─────────────────────────────────────────────
    // Background surfaces (dark mode)
    // ─────────────────────────────────────────────
    background: {
      base: "#0F172A",        // page background
      surface: "#1E293B",     // cards, tiles
      panel: "#243447"        // modals, elevated surfaces
    },

    // ─────────────────────────────────────────────
    // Text colors
    // ─────────────────────────────────────────────
    text: {
      primary: "#F8FAFC",     // bright text
      secondary: "#CBD5E1",   // slate-300
      muted: "#94A3B8"        // slate-400
    },

    // ─────────────────────────────────────────────
    // Tile / card styling
    // ─────────────────────────────────────────────
    tile: {
      background: "#1E293B",
      border: "#334155",
      shadow: "rgba(0, 0, 0, 0.35)"
    },

    // ─────────────────────────────────────────────
    // Chart colors
    // ─────────────────────────────────────────────
    chart: {
      cases: "#60A5FA",
      rvu: "#F59E0B",
      gridline: "#334155",
      axis: "#CBD5E1"
    },

    // ─────────────────────────────────────────────
    // Accent — teal
    // Used for interactive highlights, active tab
    // indicators, ghost borders, and hover states.
    // Distinct from chart.cases (blue) intentionally.
    // ─────────────────────────────────────────────
    accentTeal: "#2DD4BF",          // teal-400
    accentTealSubtle: "rgba(45,212,191,0.08)",   // teal at 8% — hover / ghost backgrounds
    accentTealBorder: "rgba(45,212,191,0.35)",   // teal at 35% — ghost borders

    // ─────────────────────────────────────────────
    // Complexity colors (easy → complex)
    // ─────────────────────────────────────────────
    complexity: {
      easy: "#2DD4BF",
      moderate: "#3B82F6",
      complex: "#FBBF24"
    },

    // ─────────────────────────────────────────────
    // Semantic colors (status indicators)
    // ─────────────────────────────────────────────
    semantic: {
      success: "#32D36C",
      warning: "#F97316",
      info: "#38BDF8"
    },

    // ─────────────────────────────────────────────
    // Border tokens
    // ─────────────────────────────────────────────
    border: {
      subtle: "rgba(148,163,184,0.35)",
      strong: "rgba(148,163,184,0.5)"
    },

    // ─────────────────────────────────────────────
    // Case Mix colors
    // ─────────────────────────────────────────────
    caseMix: {
      breast: "#3b82f6",
       gi: "#32D36C",
      gu: "#f97316",
      derm: "#ef4444",
      other: "#a855f7"
    },

    // ─────────────────────────────────────────────
    // Overlay + subtle surfaces
    // ─────────────────────────────────────────────
    overlay: "rgba(0,0,0,0.85)",
    surfaceSubtle: "rgba(255,255,255,0.03)",

    // ─────────────────────────────────────────────
    // Button tokens
    // ─────────────────────────────────────────────
    button: {
      subtle: "rgba(255,255,255,0.03)",
      border: "rgba(148,163,184,0.35)",
      text: "#CBD5E1",
      textMuted: "#94A3B8"
    }
  },

  // ─────────────────────────────────────────────
  // Gradients
  // All values are valid CSS gradient strings,
  // ready to drop directly into `background:`.
  // ─────────────────────────────────────────────
  gradients: {
    // TAT histogram bars, progress fills
    tealVertical: "linear-gradient(to top, #0EA5E9, #2DD4BF)",

    // Alternative horizontal variant (future use)
    tealHorizontal: "linear-gradient(to right, #0EA5E9, #2DD4BF)",

    // Warm amber — RVU bars, productivity charts
    amberVertical: "linear-gradient(to top, #D97706, #F59E0B)",

    // Subtle dark surface overlay (modals, drawers)
    surfaceFade: "linear-gradient(to bottom, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
  },

  // ─────────────────────────────────────────────
  // Typography tokens
  // ─────────────────────────────────────────────
  typography: {
    label: "REPLACE_WITH_LABEL_FONT",
    value: "REPLACE_WITH_VALUE_FONT",
    small: "REPLACE_WITH_SMALL_FONT"
  }
};
