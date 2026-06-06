// PathScribe — SynopticLayout
// Four-column layout for the Synoptic Reporting page.
//
// Column 1 │ Column 2      │ Column 3       │ Column 4
// Sidebar  │ Sidecar       │ Report         │ Checklist
// (fixed)  │ (collapsible) │ (flex, grows)  │ (fixed)
//
// When the Sidecar opens it pushes Columns 3 and 4 — never overlays them.
// Zero-Overlay Rule: primary diagnostic text is always fully visible.

import React, { useCallback, useState } from 'react';
import { Flag } from '@/services/flags/IFlagService';
import { ComputationalResult } from '@/types/smarttag.types';
import { useSidecar } from '@/contexts/SidecarContext';
import SynopticSidebar from './SynopticSidebar';
import SidecarDrawer   from '../sidecar/SidecarDrawer';

// ─── Column widths ────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH   = 260;
const SIDECAR_WIDTH   = 640;
const CHECKLIST_WIDTH = 340;

// ─── Column wrapper ───────────────────────────────────────────────────────────

const Column: React.FC<{
  children:  React.ReactNode;
  style?:    React.CSSProperties;
  bordered?: boolean;
}> = ({ children, style, bordered = true }) => (
  <div style={{
    display:      'flex',
    flexDirection: 'column',
    height:       '100%',
    overflowY:    'auto',
    borderLeft:   bordered ? '0.5px solid var(--color-border-tertiary)' : undefined,
    ...style,
  }}>
    {children}
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** All active Computational flags for the current case. */
  computationalFlags: Flag[];

  /** Case ID — passed to data-fetching hooks inside the Sidecar. */
  caseId: string;

  /** Slot: existing Specimens & Reports navigation (top of left sidebar). */
  sidebarChildren: React.ReactNode;

  /** Slot: main diagnostic text / reference report (Column 3). */
  reportChildren: React.ReactNode;

  /** Slot: data-entry checklist (Column 4). */
  checklistChildren: React.ReactNode;
}

// ─── SynopticLayout ───────────────────────────────────────────────────────────

const SynopticLayout: React.FC<Props> = ({
  computationalFlags,
  caseId: _caseId,
  sidebarChildren,
  reportChildren,
  checklistChildren,
}) => {
  const { isOpen, layoutMode } = useSidecar();
  const sidecarVisible = isOpen && layoutMode === 'docked';

  // Collect results from SidecarDisplay so status dots stay live
  // without independent fetches per sidebar row.
  const [results, setResults] = useState<Record<string, ComputationalResult | null>>({});

  const handleResultLoaded = useCallback((flagId: string, result: ComputationalResult) => {
    setResults(prev => (prev[flagId] === result ? prev : { ...prev, [flagId]: result }));
  }, []);

  // Suppress unused warning — results collected for future sidebar status dots
  void results;

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'row',
      height:        '100%',
      width:         '100%',
      overflow:      'hidden',
    }}>

      {/* ── Col 1: Sidebar (fixed width) ── */}
      {/* computationalFlags were planned here but moved to the Results tab */}
      <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0, height: '100%' }}>
        <SynopticSidebar>
          {sidebarChildren}
        </SynopticSidebar>
      </div>

      {/* ── Col 2: Sidecar (collapsible — pushes, never overlays) ── */}
      <div style={{
        width:      sidecarVisible ? SIDECAR_WIDTH : 0,
        flexShrink: 0,
        height:     '100%',
        overflow:   'hidden',
        transition: 'width 0.2s ease',
        borderLeft: sidecarVisible ? '0.5px solid var(--color-border-tertiary)' : undefined,
      }}>
        <SidecarDrawer
          computationalFlags={computationalFlags}
          width={SIDECAR_WIDTH}
          onResultLoaded={handleResultLoaded}
        />
      </div>

      {/* ── Col 3: Report (flex — absorbs the width freed by sidecar) ── */}
      <Column style={{ flex: 1, minWidth: 0 }}>
        {reportChildren}
      </Column>

      {/* ── Col 4: Checklist (fixed width) ── */}
      <Column style={{ width: CHECKLIST_WIDTH, flexShrink: 0 }}>
        {checklistChildren}
      </Column>

    </div>
  );
};

export default SynopticLayout;
