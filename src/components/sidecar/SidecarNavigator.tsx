// PathScribe — SidecarNavigator
// Left pane of the SidecarDrawer.
// Lists all active Computational flags for the case.
// Each row shows the flag icon (with live status color), name, and LIS code.
// Selecting a row switches the Display pane without closing the drawer.

import React from 'react';
import { Flag } from '@/services/flags/IFlagService';
import { ComputationalResult, ResultStatus, ActionabilityLevel } from '@/types/smarttag.types';
import { FlagIconGlyph } from '@/components/Flags/flagIcons';

// ─── Status color (matches ComputationalFlagIcon) ─────────────────────────────

function statusColor(result: ComputationalResult | null | undefined): string {
  if (!result) return '#888780';
  if (result.status === ResultStatus.PENDING)     return '#888780';
  if (result.status === ResultStatus.PRELIMINARY) return '#BA7517';
  if (result.status === ResultStatus.FINAL) {
    return result.actionability === ActionabilityLevel.ACTIONABLE ? '#A32D2D' : '#0F6E56';
  }
  return '#888780';
}

function statusLabel(result: ComputationalResult | null | undefined): string {
  if (!result) return 'Loading…';
  if (result.status === ResultStatus.PENDING)     return 'Pending';
  if (result.status === ResultStatus.PRELIMINARY) return 'Preliminary';
  if (result.status === ResultStatus.FINAL) {
    return result.actionability === ActionabilityLevel.ACTIONABLE
      ? 'Final — action required'
      : 'Final';
  }
  return '—';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NavigatorRowProps {
  flag:       Flag;
  result:     ComputationalResult | null;
  isSelected: boolean;
  onSelect:   (flag: Flag) => void;
}

const NavigatorRow: React.FC<NavigatorRowProps> = ({ flag, result, isSelected, onSelect }) => {
  const color = statusColor(result);

  return (
    <button
      onClick={() => onSelect(flag)}
      title={`${flag.name} — ${statusLabel(result)}`}
      style={{
        width:          '100%',
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '8px 10px 8px 8px',
        border:         'none',
        borderLeft:     `2px solid ${isSelected ? color : 'transparent'}`,
        borderRadius:   0,
        cursor:         'pointer',
        textAlign:      'left',
        background:     isSelected ? `${color}14` : 'transparent',
        transition:     'background 0.12s',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--msg-surface-2)';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {/* Icon with status color */}
      <span style={{ color, flexShrink: 0 }}>
        <FlagIconGlyph iconKey={flag.iconKey ?? 'generic-lab'} size={16} />
      </span>

      {/* Name + LIS code */}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="fm-flag-name" style={{ display: 'block', color: isSelected ? '#e2e8f0' : '#8a9db5' }}>
          {flag.name}
        </span>
        <span className="fm-flag-desc" style={{ display: 'block', marginTop: 1 }}>
          {flag.lisCode}
        </span>
      </span>


    </button>
  );
};

// ─── Navigator ────────────────────────────────────────────────────────────────

interface Props {
  flags:        Flag[];
  results:      Record<string, ComputationalResult | null>; // keyed by flag.id
  selectedFlag: Flag | null;
  onSelect:     (flag: Flag) => void;
}

const SidecarNavigator: React.FC<Props> = ({ flags, results, selectedFlag, onSelect }) => (
  <div style={{
    width:      '100%',
    height:     '100%',
    overflowY:  'auto',
    paddingTop: 6,
  }}>
    <div className="fm-col-label" style={{ padding: '8px 12px 6px' }}>Data sources</div>

    {flags.map(flag => (
      <NavigatorRow
        key={flag.id}
        flag={flag}
        result={results[flag.id] ?? null}
        isSelected={selectedFlag?.id === flag.id}
        onSelect={onSelect}
      />
    ))}

    {flags.length === 0 && (
      <div className="fm-flag-desc" style={{ padding: '16px 12px' }}>No computational flags on this case.</div>
    )}
  </div>
);

export default SidecarNavigator;
