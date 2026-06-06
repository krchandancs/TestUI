// PathScribe — ComputationalFlagIcon
// Compact worklist icon for a Computational flag.
// Visual state machine: PENDING → PRELIMINARY → FINAL (actionable | non-actionable)
// Clicking opens the Sidecar Drawer via onSelect.
// Keyframes live in pathscribe.css (ps-pulse-subtle).

import React from 'react';
import '@/pathscribe.css';
import { Flag } from '@/services/flags/IFlagService';
import { ResultStatus, ActionabilityLevel } from '@/types/smarttag.types';
import { useComputationalResult } from '@/hooks/useComputationalResult';
import { FlagIconGlyph } from './flagIcons';

// ─── Status → visual config ───────────────────────────────────────────────────

interface VisualConfig {
  color:       string;   // icon + border color
  bgColor:     string;   // container background (tinted)
  animation:   string;   // CSS animation shorthand or 'none'
  statusLabel: string;   // accessible / tooltip text
}

const STATUS_VISUAL: Record<string, VisualConfig> = {
  PENDING: {
    color:       '#888780',
    bgColor:     'rgba(136,135,128,0.10)',
    animation:   'none',
    statusLabel: 'Pending',
  },
  PRELIMINARY: {
    color:       '#BA7517',
    bgColor:     'rgba(186,117,23,0.10)',
    animation:   'ps-pulse-subtle 3.5s ease-in-out infinite',
    statusLabel: 'Preliminary',
  },
  FINAL_ACTIONABLE: {
    color:       '#A32D2D',
    bgColor:     'rgba(163,45,45,0.10)',
    animation:   'none',
    statusLabel: 'Final — action required',
  },
  FINAL_NON_ACTIONABLE: {
    color:       '#0F6E56',
    bgColor:     'rgba(15,110,86,0.10)',
    animation:   'none',
    statusLabel: 'Final',
  },
};

const LOADING_VISUAL: VisualConfig = {
  color:       '#0891B2',
  bgColor:     'rgba(8,145,178,0.06)',
  animation:   'none',
  statusLabel: 'Loading…',
};

function resolveVisual(
  status:        ResultStatus | undefined,
  actionability: ActionabilityLevel | undefined,
): VisualConfig {
  if (!status) return LOADING_VISUAL;
  if (status === ResultStatus.PENDING)     return STATUS_VISUAL.PENDING;
  if (status === ResultStatus.PRELIMINARY) return STATUS_VISUAL.PRELIMINARY;
  if (status === ResultStatus.FINAL) {
    return actionability === ActionabilityLevel.ACTIONABLE
      ? STATUS_VISUAL.FINAL_ACTIONABLE
      : STATUS_VISUAL.FINAL_NON_ACTIONABLE;
  }
  return LOADING_VISUAL;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  flag:     Flag;
  caseId:   string;
  size?:    number;   // icon container size in px (default 28)
  onSelect: (flag: Flag) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ComputationalFlagIcon: React.FC<Props> = ({ flag, caseId, size = 28, onSelect }) => {
  // loading is intentionally omitted — resolveVisual handles the no-result state
  // via LOADING_VISUAL when result is undefined.
  const { result, error } = useComputationalResult(flag, caseId);
  const visual    = resolveVisual(result?.status, result?.actionability);
  const glyphSize = Math.round(size * 0.55);
  const tooltip   = [flag.name, visual.statusLabel, error ? `Error: ${error}` : null]
    .filter(Boolean).join('\n');

  return (
    <button
      title={tooltip}
      aria-label={`${flag.name}: ${visual.statusLabel}`}
      onClick={e => { e.stopPropagation(); onSelect(flag); }}
      className="ps-comp-flag-btn"
      style={{
        width:      size,
        height:     size,
        background: visual.bgColor,
        border:     `1.5px solid ${visual.color}`,
        color:      visual.color,
        animation:  visual.animation,
      }}
    >
      <FlagIconGlyph iconKey={flag.iconKey ?? 'generic-lab'} size={glyphSize} />

      {/* Status dot — bottom-right corner */}
      <span aria-hidden="true" className="ps-comp-flag-dot"
        style={{ background: visual.color }} />
    </button>
  );
};

export default ComputationalFlagIcon;
