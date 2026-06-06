// PathScribe — Flag Icon Glyphs
// One SVG component per IconKey. All designed to be legible at 16–24px.
// Color is controlled by the parent — these glyphs use currentColor throughout.

import React from 'react';
import { IconKey } from '../../types/smarttag.types';

interface GlyphProps {
  size?: number;
}

// IHC — two stacked slides
const IhcIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="4" y="9" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="5.5" cy="5" r="1" fill="currentColor"/>
    <circle cx="8.5" cy="11" r="1" fill="currentColor"/>
  </svg>
);

// FISH — two paired dots (probe signals)
const FishIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="5" cy="11" r="2" fill="currentColor"/>
    <circle cx="11" cy="11" r="2" fill="currentColor"/>
    <line x1="5" y1="7" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="11" y1="7" x2="11" y2="9" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

// Molecular — three nodes connected
const MolecularIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="3" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="13" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="6.7" y1="5" x2="4" y2="10.4" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="9.3" y1="5" x2="12" y2="10.4" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="4.8" y1="12" x2="11.2" y2="12" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

// Flow cytometry — scatter plot
const FlowCytometryIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="4"  cy="12" r="1.2" fill="currentColor"/>
    <circle cx="6"  cy="9"  r="1.2" fill="currentColor"/>
    <circle cx="5"  cy="6"  r="1.2" fill="currentColor"/>
    <circle cx="9"  cy="11" r="1.2" fill="currentColor"/>
    <circle cx="10" cy="7"  r="1.2" fill="currentColor"/>
    <circle cx="12" cy="4"  r="1.2" fill="currentColor"/>
    <circle cx="13" cy="9"  r="1.2" fill="currentColor"/>
    <line x1="2" y1="14" x2="2" y2="2"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Cytogenetics — stylised chromosome
const CytogeneticsIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M5 2C5 2 5 6 8 8C11 10 11 14 11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 2C11 2 11 6 8 8C5 10 5 14 5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6.2" y1="7.2" x2="9.8" y2="8.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Micro (microbiology) — microscope outline
const MicroIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="6" y="2" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="8" y1="8" x2="8" y2="11" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 14h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="10.5" cy="4" r="1" fill="currentColor"/>
  </svg>
);

// Coag — droplet
const CoagIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2L12 9C12 11.8 10.2 14 8 14C5.8 14 4 11.8 4 9L8 2Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M6 10.5C6.5 11.5 7.5 12 8.5 11.5"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Generic lab — conical flask
const GenericLabIcon: React.FC<GlyphProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M6 2h4M6 2v5L2.5 13.5A1 1 0 003.4 15h9.2a1 1 0 00.9-1.5L10 7V2"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="11" r="1" fill="currentColor"/>
    <circle cx="9" cy="12.5" r="0.8" fill="currentColor"/>
  </svg>
);

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<IconKey, React.FC<GlyphProps>> = {
  'ihc':            IhcIcon,
  'fish':           FishIcon,
  'molecular':      MolecularIcon,
  'flow-cytometry': FlowCytometryIcon,
  'cytogenetics':   CytogeneticsIcon,
  'micro':          MicroIcon,
  'coag':           CoagIcon,
  'generic-lab':    GenericLabIcon,
};

interface FlagIconGlyphProps extends GlyphProps {
  iconKey: IconKey;
}

export const FlagIconGlyph: React.FC<FlagIconGlyphProps> = ({ iconKey, size }) => {
  const Icon = ICON_MAP[iconKey] ?? ICON_MAP['generic-lab'];
  return <Icon size={size} />;
};
