import { ProtocolDefinition } from "../types/ProtocolDefinition";

// ─────────────────────────────────────────────────────────────
// BASE PROTOCOL REGISTRY (read‑only CAP templates)
// ─────────────────────────────────────────────────────────────

export const baseProtocolRegistry: Record<string, ProtocolDefinition> = {
  cap_breast_invasive: {
    id: "cap_breast_invasive",
    name: "CAP Breast Invasive Carcinoma",
    version: "1.0.0",
    source: "CAP",
    lifecycle: "validated",
    category: "Breast",
    isBaseTemplate: true,
    sections: [
      {
        id: "general",
        title: "General",
        questions: [
          {
            id: "procedure",
            text: "Procedure",
            type: "choice",
            required: true,
            options: [
              { id: "lumpectomy", label: "Lumpectomy" },
              { id: "mastectomy", label: "Mastectomy" }
            ]
          }
        ]
      }
    ]
  },

  cap_colon_resection: {
    id: "cap_colon_resection",
    name: "CAP Colon Resection",
    version: "1.0.0",
    source: "CAP",
    lifecycle: "validated",
    category: "Colon",
    isBaseTemplate: true,
    sections: [
      {
        id: "general",
        title: "General",
        questions: [
          {
            id: "procedure",
            text: "Procedure",
            type: "choice",
            required: true,
            options: [
              { id: "right_hemicolectomy", label: "Right hemicolectomy" },
              { id: "left_hemicolectomy", label: "Left hemicolectomy" }
            ]
          }
        ]
      }
    ]
  },

  cap_prostatectomy: {
    id: "cap_prostatectomy",
    name: "CAP Prostatectomy",
    version: "1.0.0",
    source: "CAP",
    lifecycle: "validated",
    category: "Prostate",
    isBaseTemplate: true,
    sections: [
      {
        id: "general",
        title: "General",
        questions: [
          {
            id: "procedure",
            text: "Procedure",
            type: "choice",
            required: true,
            options: [
              { id: "radical_prostatectomy", label: "Radical prostatectomy" }
            ]
          }
        ]
      }
    ]
  }
};

// ─────────────────────────────────────────────────────────────
// LOCAL OVERRIDES (saved to LocalStorage)
// ─────────────────────────────────────────────────────────────

const OVERRIDE_KEY = "ps_protocol_overrides";

export const loadProtocolRegistry = (): Record<string, ProtocolDefinition> => {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return baseProtocolRegistry;

    const overrides = JSON.parse(raw) as Record<string, ProtocolDefinition>;

    // Merge base + overrides (overrides win)
    return { ...baseProtocolRegistry, ...overrides };
  } catch {
    return baseProtocolRegistry;
  }
};

export const saveProtocolOverride = (protocol: ProtocolDefinition) => {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    const overrides = raw
      ? (JSON.parse(raw) as Record<string, ProtocolDefinition>)
      : {};

    overrides[protocol.id] = protocol;

    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore errors silently
  }
};
