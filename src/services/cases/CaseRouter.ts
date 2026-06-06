/**
 * CaseRouter — Unified Case Service Façade
 *
 * Routes case requests to the correct data source without exposing
 * which source is being used to the calling component.
 *
 * Architecture
 * ────────────
 *  CaseRouter (this file — one singleton, injected with real services in prod)
 *      ├── ILISCaseService   → FHIRCaseService   (NHS HL7 FHIR R4)
 *      │       └── AuditLogger('LIS')   — independent DSPT audit trail
 *      └── IOrchCaseService  → FirestoreCaseService (PathScribe Firestore)
 *              └── AuditLogger('ORCH')  — independent PathScribe audit trail
 *
 * Routing key
 * ───────────
 * Case IDs prefixed 'O26-' belong to the PathScribe Orchestrator (Firestore).
 * All other IDs are routed to the LIS (FHIR) service.
 *
 * In production, replace isOrchCase() with a Case Registry microservice lookup
 * (no patient data — just { caseId → serviceType }) to satisfy UK GDPR Art. 25
 * data minimisation. See PRODUCTION_MIGRATION.md for details.
 *
 * UK / EU compliance
 * ──────────────────
 * - Each underlying service retains its own auth token and AuditLogger.
 *   The router never holds credentials or touches patient data directly.
 * - listCasesForUser queries both services independently so each access
 *   is audited against the correct data controller (NHS Trust vs PathScribe).
 * - getAll is delegated to the LIS service only (LIS is the system of record
 *   for search / admin views). Override if your use-case requires Firestore search.
 */

import type { Case }                                          from '@/types/case/Case';
import type { ICaseService, PathologyCase, CaseFilterParams } from './ICaseService';
import type { ServiceResult }                                 from '../types';
import { AuditLogger }                                        from './AuditLogger';
import { mockCaseService }             from './mockCaseService';
import { mockOrchestratorCaseService } from './mockOrchestratorCaseService';

// ── Routing rule ──────────────────────────────────────────────────────────────
const ORCH_ID_PREFIX = 'O26-';

function isOrchCase(caseId: string): boolean {
  return caseId.startsWith(ORCH_ID_PREFIX);
}

// ── Router ────────────────────────────────────────────────────────────────────
class CaseRouter implements ICaseService {
  private readonly lisAudit:  AuditLogger;
  private readonly orchAudit: AuditLogger;

  constructor(
    private readonly lisService:  ICaseService,
    private readonly orchService: ICaseService,
  ) {
    this.lisAudit  = new AuditLogger('LIS');
    this.orchAudit = new AuditLogger('ORCH');
  }

  // ── getCase ─────────────────────────────────────────────────────────────────
  async getCase(caseId: string, userId = 'current'): Promise<Case | undefined> {
    const [service, audit] = isOrchCase(caseId)
      ? [this.orchService, this.orchAudit]
      : [this.lisService,  this.lisAudit];

    try {
      const c = await service.getCase(caseId);
      audit.log({ eventType: 'case.read', caseId, userId, outcome: c ? 'success' : 'failure' });
      return c;
    } catch {
      audit.log({ eventType: 'case.read', caseId, userId, outcome: 'failure' });
      return undefined;
    }
  }

  // ── getAll ───────────────────────────────────────────────────────────────────
  // Delegated to LIS service — LIS is the system of record for search/admin views.
  async getAll(params?: CaseFilterParams): Promise<ServiceResult<Case[]>> {
    return this.lisService.getAll(params);
  }

  // ── listCasesForUser ─────────────────────────────────────────────────────────
  // Queries both services independently so each access is separately audited.
  async listCasesForUser(userId: string): Promise<Case[]> {
    const [lisCases, orchCases] = await Promise.all([
      this.lisService.listCasesForUser(userId)
        .then(cases => {
          this.lisAudit.log({ eventType: 'case.list', userId, outcome: 'success' });
          return cases;
        })
        .catch((): Case[] => {
          this.lisAudit.log({ eventType: 'case.list', userId, outcome: 'failure' });
          return [];
        }),

      this.orchService.listCasesForUser(userId)
        .then(cases => {
          this.orchAudit.log({ eventType: 'case.list', userId, outcome: 'success' });
          return cases;
        })
        .catch((): Case[] => {
          this.orchAudit.log({ eventType: 'case.list', userId, outcome: 'failure' });
          return [];
        }),
    ]);

    return [...lisCases, ...orchCases];
  }

  // ── updateCase ────────────────────────────────────────────────────────────────
  // Routes to the owning service — only the owner should accept writes.
  async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
    const [service, audit] = isOrchCase(caseId)
      ? [this.orchService, this.orchAudit]
      : [this.lisService,  this.lisAudit];

    try {
      await service.updateCase(caseId, updates);
      audit.log({ eventType: 'case.write', caseId, userId: 'current', outcome: 'success' });
    } catch {
      audit.log({ eventType: 'case.write', caseId, userId: 'current', outcome: 'failure' });
      throw new Error(`CaseRouter.updateCase failed for ${caseId}`);
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────
// In production:
//   import { fhirCaseService }      from './FHIRCaseService';
//   import { firestoreCaseService } from './firestoreCaseService';
//   export const caseRouter = new CaseRouter(fhirCaseService, firestoreCaseService);
export const caseRouter = new CaseRouter(mockCaseService, mockOrchestratorCaseService);
