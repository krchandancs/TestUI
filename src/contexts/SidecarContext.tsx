// PathScribe — SidecarContext
// Provides Sidecar drawer state across route changes.
// Wrap at the app level (above the router outlet) so the drawer
// survives navigation between Worklist and Synoptic Report.

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Flag } from '../services/flags/IFlagService';

// ─── Shape ────────────────────────────────────────────────────────────────────

export type SidecarLayoutMode = 'overlay' | 'docked';

interface SidecarState {
  isOpen:       boolean;
  layoutMode:   SidecarLayoutMode;
  selectedFlag: Flag | null;
  caseId:       string | null;
  /** Computational flags ordered for the current case — drives Navigator list. */
  caseFlags:    Flag[];
}

interface SidecarContextValue extends SidecarState {
  openOverlay:        (flag: Flag, caseId: string, caseFlags?: Flag[]) => void;
  openDocked:         (flag: Flag, caseId: string, caseFlags?: Flag[]) => void;
  selectFlag:         (flag: Flag) => void;
  close:              () => void;
  transitionToOverlay: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SidecarContext = createContext<SidecarContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const SidecarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SidecarState>({
    isOpen:       false,
    layoutMode:   'overlay',
    selectedFlag: null,
    caseId:       null,
    caseFlags:    [],
  });

  const openOverlay = useCallback((flag: Flag, caseId: string, caseFlags?: Flag[]) => {
    setState({ isOpen: true, layoutMode: 'overlay', selectedFlag: flag, caseId, caseFlags: caseFlags ?? [] });
  }, []);

  const openDocked = useCallback((flag: Flag, caseId: string, caseFlags?: Flag[]) => {
    setState({ isOpen: true, layoutMode: 'docked', selectedFlag: flag, caseId, caseFlags: caseFlags ?? [] });
  }, []);

  // Switch selected flag without closing — used by the Navigator pane.
  const selectFlag = useCallback((flag: Flag) => {
    setState(prev => ({ ...prev, selectedFlag: flag }));
  }, []);

  const transitionToOverlay = useCallback(() => {
    setState(prev => ({ ...prev, layoutMode: 'overlay' }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    // Note: selectedFlag and caseId are intentionally retained so re-opening
    // the drawer restores the last-viewed flag (PRD: state persistence).
  }, []);

  return (
    <SidecarContext.Provider value={{ ...state, openOverlay, openDocked, selectFlag, close, transitionToOverlay }}>
      {children}
    </SidecarContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSidecar(): SidecarContextValue {
  const ctx = useContext(SidecarContext);
  if (!ctx) throw new Error('useSidecar must be used within a SidecarProvider');
  return ctx;
}
