// src/pages/Synoptic/codeConstants.ts
// Source metadata for medical code badges used in CodesPanel.

export interface CodeSourceMeta {
  label: string;
  bg:    string;
  color: string;
}

/** Visual config for each code source type */
export const SOURCE_META: Record<string, CodeSourceMeta> = {
  system: { label: 'SYS', bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' }, // CAP / RCPath — locked
  ai:     { label: 'AI',  bg: 'rgba(8,145,178,0.12)',   color: '#0891B2' }, // AI-assigned
  manual: { label: 'USR', bg: 'rgba(16,185,129,0.12)',  color: '#10b981' }, // Manual / user-entered
};
