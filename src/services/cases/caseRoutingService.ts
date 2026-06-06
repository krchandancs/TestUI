// src/services/cases/caseRoutingService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Automatic case pool routing when no LIS assignment is available.
//
// Routing priority order:
//   1. Direct LIS assignment (handled upstream — not this service)
//   2. Specimen type → Subspecialty → Pool (this service)
//   3. Fallback pool (configurable — default: 'general')
//   4. Unrouted — flagged for manual admin assignment
//
// Called by:
//   - HL7 inbound handler when ORM^O01 arrives with no assignedTo
//   - LIS polling service when assignment timeout is reached
//   - Manual "Route to Pool" action on the worklist
// ─────────────────────────────────────────────────────────────────────────────

import { Case }         from '../../types/case/Case';
import { CaseStatus }   from '../../types/case/CaseStatus';
import { subspecialtyService } from '../index';
import { mockCaseService }     from '../cases/mockCaseService';
import { storageGet, storageSet }               from '../mockStorage';
import { Subspecialty }                         from '../subspecialties/ISubspecialtyService';

// ─── Routing config ───────────────────────────────────────────────────────────
// In production this comes from LISSection config in the System Tab.
// For now stored in localStorage so admins can change it without a redeploy.

export interface RoutingConfig {
  /** Enable automatic pool routing — if false, unassigned cases stay as draft */
  enabled:              boolean;
  /** Pool ID to use when no subspecialty match is found */
  fallbackPoolId:       string;
  /** Display name of the fallback pool */
  fallbackPoolName:     string;
  /** Seconds to wait for LIS assignment before routing to pool */
  assignmentTimeoutSec: number;
  /** Whether STAT cases bypass the timeout and route immediately */
  statRoutesImmediately: boolean;
}

const ROUTING_CONFIG_KEY  = 'pathscribe_routing_config';
const ROUTING_RULES_KEY   = 'pathscribe_routing_rules';

// ─── Routing rule ─────────────────────────────────────────────────────────────
// Each rule maps a set of keywords to a subspecialty pool.
// Built-in rules ship with PathScribe and cannot be deleted but can be disabled.
// Custom rules are added by admins and can be deleted.

export interface RoutingRule {
  id:             string;
  subspecialtyId: string;   // target pool
  keywords:       string[]; // matched against normalised specimen description
  builtIn:        boolean;
  active:         boolean;
  priority:       number;   // lower = checked first
  note?:          string;   // admin notes
}

export const BUILT_IN_ROUTING_RULES: RoutingRule[] = [
  { id: 'rule-gi-colorectal', subspecialtyId: 'gi', priority: 10, builtIn: true, active: true,
    note: 'Colorectal specimens',
    keywords: ['colon', 'colorectal', 'sigmoid', 'rectum', 'rectal', 'caecum', 'cecum', 'appendix', 'ileum', 'jejunum', 'duodenum', 'small bowel', 'large bowel', 'colectomy', 'hemicolectomy', 'hartmann', 'anterior resection', 'low anterior resection', 'tems', 'transanal', 'polypectomy'] },
  { id: 'rule-gi-upper', subspecialtyId: 'gi', priority: 11, builtIn: true, active: true,
    note: 'Upper GI specimens',
    keywords: ['stomach', 'gastric', 'gastrectomy', 'oesophagus', 'esophagus', 'oesophageal', 'esophageal', 'gastroesophageal', 'gej'] },
  { id: 'rule-gi-hpb', subspecialtyId: 'gi', priority: 12, builtIn: true, active: true,
    note: 'Hepatobiliary and pancreatic specimens',
    keywords: ['liver', 'hepatic', 'hepatectomy', 'cholecystectomy', 'gallbladder', 'bile duct', 'biliary', 'pancreas', 'pancreatic', 'whipple'] },
  { id: 'rule-breast', subspecialtyId: 'breast', priority: 20, builtIn: true, active: true,
    note: 'Breast specimens',
    keywords: ['breast', 'mastectomy', 'lumpectomy', 'mammary', 'nipple', 'axilla', 'axillary', 'sentinel node', 'wide local excision'] },
  { id: 'rule-gu', subspecialtyId: 'gu', priority: 30, builtIn: true, active: true,
    note: 'Genitourinary specimens',
    keywords: ['prostate', 'prostatic', 'prostatectomy', 'turp', 'bladder', 'cystectomy', 'kidney', 'renal', 'nephrectomy', 'ureter', 'urethra', 'testis', 'testicular', 'orchidectomy', 'penile'] },
  { id: 'rule-gynae', subspecialtyId: 'gynecologic', priority: 40, builtIn: true, active: true,
    note: 'Gynaecological specimens',
    keywords: ['uterus', 'uterine', 'hysterectomy', 'endometrium', 'endometrial', 'cervix', 'cervical', 'ovary', 'ovarian', 'fallopian', 'vulva', 'vulval', 'vagina', 'vaginal', 'placenta', 'products of conception'] },
  { id: 'rule-derm', subspecialtyId: 'dermatology', priority: 50, builtIn: true, active: true,
    note: 'Dermatopathology specimens',
    keywords: ['skin', 'cutaneous', 'melanoma', 'punch biopsy', 'shave biopsy', 'excision skin', 'wide excision', 'basal cell', 'squamous cell skin'] },
  { id: 'rule-haem', subspecialtyId: 'hematopathology', priority: 60, builtIn: true, active: true,
    note: 'Haematopathology specimens',
    keywords: ['lymph node', 'lymphoma', 'bone marrow', 'thymus', 'lymphadenopathy', 'haematological', 'hematological'] },
];

export function loadRoutingRules(): RoutingRule[] {
  const stored = storageGet<RoutingRule[]>(ROUTING_RULES_KEY, BUILT_IN_ROUTING_RULES);
  // Migration: ensure all built-ins are present
  const storedIds = new Set(stored.map(r => r.id));
  const missing = BUILT_IN_ROUTING_RULES.filter(r => !storedIds.has(r.id));
  const merged = [...missing, ...stored].sort((a, b) => a.priority - b.priority);
  return merged;
}

export function saveRoutingRules(rules: RoutingRule[]): void {
  storageSet(ROUTING_RULES_KEY, rules);
}

const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  enabled:               true,
  fallbackPoolId:        'general',
  fallbackPoolName:      'General Pathology',
  assignmentTimeoutSec:  300,   // 5 minutes
  statRoutesImmediately: true,
};

export function getRoutingConfig(): RoutingConfig {
  return storageGet<RoutingConfig>(ROUTING_CONFIG_KEY, DEFAULT_ROUTING_CONFIG);
}

export function saveRoutingConfig(config: RoutingConfig): void {
  storageSet(ROUTING_CONFIG_KEY, config);
}

// ─── Routing result ───────────────────────────────────────────────────────────

export type RoutingOutcome =
  | 'routed_to_pool'      // matched a subspecialty pool
  | 'routed_to_fallback'  // no match — sent to fallback pool
  | 'unrouted'            // routing disabled or no fallback configured
  | 'already_assigned'    // case already has an assignedTo — skip
  | 'no_specimens';       // case has no specimens to match against

export interface RoutingResult {
  outcome:       RoutingOutcome;
  poolId?:       string;
  poolName?:     string;
  subspecialty?: string;
  reason:        string;
}

// ─── Specimen → Subspecialty matching ────────────────────────────────────────
// Matches a specimen description against all subspecialties via their
// linked specimenIds. The SpecimenDictionary stores subspecialtyId on each
// SpecimenEntry — we look up which subspecialty owns the matching specimen.
//
// Matching strategy (in order):
//   1. Exact specimenId match (if specimen has an id)
//   2. Keyword match against specimen description (normalised, lowercase)

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// Keyword → subspecialty ID mapping for description-based fallback matching.
// Covers the most common specimen descriptions seen in surgical pathology.
// Admins can extend this via the Specimen Dictionary → subspecialty assignment.
// matchSpecimenToSubspecialty — uses dynamic rules loaded from storage
function matchSpecimenToSubspecialty(specimenDescription: string): string | null {
  const norm  = normalise(specimenDescription);
  const rules = loadRoutingRules().filter(r => r.active).sort((a, b) => a.priority - b.priority);
  for (const rule of rules) {
    if (rule.keywords.some(kw => norm.includes(normalise(kw)))) {
      return rule.subspecialtyId;
    }
  }
  return null;
}

// testSpecimenRouting — used by the admin UI to preview routing without saving
export function testSpecimenRouting(specimenDescription: string): { matched: boolean; rule?: RoutingRule; subspecialtyId?: string } {
  const norm  = normalise(specimenDescription);
  const rules = loadRoutingRules().filter(r => r.active).sort((a, b) => a.priority - b.priority);
  for (const rule of rules) {
    if (rule.keywords.some(kw => norm.includes(normalise(kw)))) {
      return { matched: true, rule, subspecialtyId: rule.subspecialtyId };
    }
  }
  return { matched: false };
}

// ─── Main routing function ────────────────────────────────────────────────────

export async function routeCase(caseData: Case): Promise<RoutingResult> {
  const config = getRoutingConfig();

  // Already assigned — nothing to do
  if (caseData.order?.assignedTo) {
    return { outcome: 'already_assigned', reason: 'Case already has an assigned pathologist' };
  }

  // Routing disabled
  if (!config.enabled) {
    return { outcome: 'unrouted', reason: 'Automatic pool routing is disabled in LIS config' };
  }

  // No specimens to match against
  if (!caseData.specimens || caseData.specimens.length === 0) {
    return { outcome: 'unrouted', reason: 'No specimens on case — cannot determine subspecialty' };
  }

  // Load all active subspecialties
  const subsResult = await subspecialtyService.getAll();
  if (!subsResult.ok) {
    return { outcome: 'unrouted', reason: 'Could not load subspecialties for routing' };
  }
  const subspecialties = subsResult.data.filter((s: Subspecialty) => s.active && s.isWorkgroup);

  // Try to match each specimen to a subspecialty pool
  // First match wins — use the most specific specimen (usually specimen A)
  let matchedSubspecialty: Subspecialty | null = null;
  let matchedVia = '';

  for (const specimen of caseData.specimens) {
    const description = specimen.description ?? specimen.label ?? '';

    // Try keyword matching against description
    const subspecialtyId = matchSpecimenToSubspecialty(description);
    if (subspecialtyId) {
      const sub = subspecialties.find((s: Subspecialty) => s.id === subspecialtyId);
      if (sub) {
        matchedSubspecialty = sub;
        matchedVia = `keyword match on "${description}"`;
        break;
      }
    }
  }

  // Route to matched pool
  if (matchedSubspecialty) {
    await applyPoolRouting(caseData, matchedSubspecialty.id, matchedSubspecialty.name);
    return {
      outcome:       'routed_to_pool',
      poolId:        matchedSubspecialty.id,
      poolName:      matchedSubspecialty.name,
      subspecialty:  matchedSubspecialty.name,
      reason:        `Routed to ${matchedSubspecialty.name} pool via ${matchedVia}`,
    };
  }

  // No match — route to fallback pool
  if (config.fallbackPoolId) {
    await applyPoolRouting(caseData, config.fallbackPoolId, config.fallbackPoolName);
    return {
      outcome:   'routed_to_fallback',
      poolId:    config.fallbackPoolId,
      poolName:  config.fallbackPoolName,
      reason:    `No subspecialty match found — routed to fallback pool "${config.fallbackPoolName}"`,
    };
  }

  // No fallback configured
  return {
    outcome: 'unrouted',
    reason:  'No subspecialty match and no fallback pool configured — manual assignment required',
  };
}

// ─── Apply pool routing to case ───────────────────────────────────────────────

async function applyPoolRouting(
  caseData: Case,
  poolId:   string,
  poolName: string,
): Promise<void> {
  await mockCaseService.updateCase(caseData.id, {
    status:   'pool' as CaseStatus,
    poolId,
    poolName,
    order: {
      ...caseData.order,
      assignedTo: undefined,  // explicitly unassigned — in the pool
    },
    updatedAt: new Date().toISOString(),
  } as any);
}

// ─── Batch routing ────────────────────────────────────────────────────────────
// Routes all unassigned cases in a list — used on app startup or
// when routing config changes.

export async function routeUnassignedCases(cases: Case[]): Promise<{
  routed:   number;
  skipped:  number;
  failed:   number;
  results:  { caseId: string; result: RoutingResult }[];
}> {
  const unassigned = cases.filter(c =>
    !c.order?.assignedTo &&
    c.status !== 'pool' &&
    c.status !== 'finalized' &&
    c.status !== 'amended'
  );

  const results: { caseId: string; result: RoutingResult }[] = [];
  let routed = 0, skipped = 0, failed = 0;

  for (const c of unassigned) {
    try {
      const result = await routeCase(c);
      results.push({ caseId: c.id, result });
      if (result.outcome === 'routed_to_pool' || result.outcome === 'routed_to_fallback') {
        routed++;
      } else {
        skipped++;
      }
    } catch (e) {
      failed++;
      results.push({
        caseId: c.id,
        result: { outcome: 'unrouted', reason: `Error during routing: ${(e as Error).message}` },
      });
    }
  }

  return { routed, skipped, failed, results };
}

// ─── STAT routing ─────────────────────────────────────────────────────────────
// STAT cases bypass the assignment timeout and route immediately.
// Called as soon as a STAT case is received.

export async function routeStatCase(caseData: Case): Promise<RoutingResult> {
  const config = getRoutingConfig();
  if (!config.statRoutesImmediately) {
    return { outcome: 'unrouted', reason: 'STAT immediate routing is disabled' };
  }
  return routeCase(caseData);
}
