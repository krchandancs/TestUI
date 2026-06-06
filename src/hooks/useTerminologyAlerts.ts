/**
 * hooks/useTerminologyAlerts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans an EditorTemplate for deprecated / retired SNOMED CT and ICD codes
 * and returns structured alerts. Runs on mount and debounced on every edit.
 *
 * Mock phase: validates against MOCK_DEPRECATED_CODES below.
 * Real phase: swap validateTerminologyCodes() to call POST /terminology/validate.
 *
 * Drop-in path: src/hooks/useTerminologyAlerts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import { EditorTemplate } from '../components/Config/Protocols/SynopticEditor';
import { validateTerminologyCodes, TerminologyAlert } from '../services/templates/templateService';

export type { TerminologyAlert };

export interface TerminologyAlertsState {
  alerts:    TerminologyAlert[];
  isLoading: boolean;
  hasErrors: boolean;   // any severity === 'error'
  hasWarnings: boolean; // any severity === 'warning'
  dismiss:   (alertId: string) => void;
  revalidate: () => void;
}

const DEBOUNCE_MS = 1200;

export function useTerminologyAlerts(template: EditorTemplate): TerminologyAlertsState {
  const [alerts,     setAlerts]     = useState<TerminologyAlert[]>([]);
  const [dismissed,  setDismissed]  = useState<Set<string>>(new Set());
  const [isLoading,  setIsLoading]  = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef   = useRef(false);

  const run = async (tpl: EditorTemplate) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsLoading(true);
    try {
      const results = await validateTerminologyCodes(tpl);
      setAlerts(results);
    } catch (err) {
      console.error('[useTerminologyAlerts] Validation failed:', err);
    } finally {
      setIsLoading(false);
      runningRef.current = false;
    }
  };

  // Run immediately on mount, then debounced on template changes
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      run(template);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(template), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [template]);

  const dismiss = (alertId: string) => {
    setDismissed(prev => new Set([...prev, alertId]));
  };

  const revalidate = () => run(template);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  return {
    alerts:     visibleAlerts,
    isLoading,
    hasErrors:   visibleAlerts.some(a => a.severity === 'error'),
    hasWarnings: visibleAlerts.some(a => a.severity === 'warning'),
    dismiss,
    revalidate,
  };
}
