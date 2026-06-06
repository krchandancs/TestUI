// PathScribe — FirestoreResultService
// Production implementation of IResultService.
// Calls the endpoint defined in flag.dataSource — either the LIS directly
// or a PathScribe AI extraction service that fronts the LIS.
// No Firestore reads needed — results are fetched from the source of truth.

import { IResultService } from './IResultService';
import { Flag } from '../flags/IFlagService';
import { ComputationalResult } from '../../types/smarttag.types';

// ---------------------------------------------------------------------------
// Endpoint resolution
// ---------------------------------------------------------------------------

// The base URL for the PathScribe API / AI extraction proxy.
// In production this is set per-environment via an env var.
const API_BASE = import.meta.env.VITE_PATHSCRIBE_API_BASE ?? '';

function buildUrl(endpoint: string, caseId: string, resultPath?: string): string {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  );
  url.searchParams.set('caseId', caseId);
  if (resultPath) url.searchParams.set('resultPath', resultPath);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Dot-notation path resolver
// ---------------------------------------------------------------------------

function getAtPath(obj: unknown, path?: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ---------------------------------------------------------------------------
// FirestoreResultService
// ---------------------------------------------------------------------------

export class FirestoreResultService implements IResultService {
  /**
   * Fetches the ComputationalResult for a flag + case from the configured endpoint.
   * The endpoint may be:
   *   - A LIS REST API returning discrete structured data
   *   - A PathScribe AI extraction service returning ComputationalResult JSON
   *     (including ExtractionProvenance when the LIS source is unstructured)
   */
  async getResult(sourceId: string, caseId: string, flag?: Flag): Promise<ComputationalResult> {
    const endpoint   = flag?.dataSource?.endpoint  ?? `/api/results/${sourceId}`;
    const resultPath = flag?.dataSource?.resultPath;

    const url = buildUrl(endpoint, caseId, resultPath);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache:   'no-cache',
    });

    if (!res.ok) {
      throw new Error(`ResultService: ${res.status} ${res.statusText} — ${url}`);
    }

    const json    = await res.json();
    const payload = resultPath ? getAtPath(json, resultPath) : json;

    return payload as ComputationalResult;
  }
}
