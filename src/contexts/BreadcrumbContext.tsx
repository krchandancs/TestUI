// src/contexts/BreadcrumbContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Crumb {
  label: string;
  path: string;
}

interface BreadcrumbContextValue {
  crumbs: Crumb[];
  /** Push a new crumb — call on page/modal mount */
  pushCrumb: (label: string, path: string) => void;
  /** Replace the entire trail (e.g. when navigating from a modal) */
  setCrumbs: (crumbs: Crumb[]) => void;
  /** Navigate back to a crumb and trim the trail */
  navigateTo: (index: number) => void;
  /** Reset to a single root crumb */
  reset: (label: string, path: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  crumbs: [],
  pushCrumb: () => {},
  setCrumbs: () => {},
  navigateTo: () => {},
  reset: () => {},
});

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [crumbs, setCrumbsState] = useState<Crumb[]>([{ label: 'Home', path: '/' }]);
  const navigate = useNavigate();

  const pushCrumb = useCallback((label: string, path: string) => {
    setCrumbsState(prev => {
      // If already in trail, trim back to that point
      const existingIdx = prev.findIndex(c => c.path === path);
      if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
      // Avoid duplicate at tail
      if (prev[prev.length - 1]?.path === path) return prev;
      return [...prev, { label, path }];
    });
  }, []);

  const setCrumbs = useCallback((crumbs: Crumb[]) => {
    setCrumbsState(crumbs);
  }, []);

  const navigateTo = useCallback((index: number) => {
    setCrumbsState(prev => {
      const trimmed = prev.slice(0, index + 1);
      const target = trimmed[trimmed.length - 1];
      if (target) navigate(target.path);
      return trimmed;
    });
  }, [navigate]);

  const reset = useCallback((label: string, path: string) => {
    setCrumbsState([{ label, path }]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ crumbs, pushCrumb, setCrumbs, navigateTo, reset }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};
