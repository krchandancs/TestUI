// PathScribe — useComputationalResult
// Fetches and polls the live ComputationalResult for a given flag + case.
// Uses IResultService so MockResultService and FirestoreResultService are
// interchangeable — no component changes needed when going live.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Flag } from '@/services/flags/IFlagService';
import { ComputationalResult, ResultStatus } from '@/types/smarttag.types';
import { resultService } from '@/services';   // injected singleton — see services/index.ts

export interface UseComputationalResultState {
  result:  ComputationalResult | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

// Polling stops once the result reaches a terminal (FINAL) state.
const TERMINAL_STATUSES: ResultStatus[] = [ResultStatus.FINAL];

export function useComputationalResult(
  flag: Flag,
  caseId: string,
): UseComputationalResultState {
  const [result,  setResult]  = useState<ComputationalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const { dataSource } = flag;

  const fetch_ = useCallback(async () => {
    if (!dataSource?.sourceId) return;

    try {
      const data = await resultService.getResult(dataSource.sourceId, caseId);

      if (!isMountedRef.current) return;

      setResult(data);
      setError(null);

      // Stop polling once the result reaches a terminal state.
      if (TERMINAL_STATUSES.includes(data?.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (e) {
      if (!isMountedRef.current) return;
      setError((e as Error).message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [dataSource?.sourceId, caseId]);

  useEffect(() => {
    isMountedRef.current = true;

    void fetch_();

    const interval = dataSource?.pollIntervalMs;
    if (interval && interval > 0) {
      intervalRef.current = setInterval(() => void fetch_(), interval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetch_, dataSource?.pollIntervalMs]);

  return { result, loading, error, refetch: fetch_ };
}
