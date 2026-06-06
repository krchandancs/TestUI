/**
 * services/templateService.ts
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Service layer for all synoptic template operations.
 *
 * MOCK PHASE (current):
 *   All functions return realistic mock data with simulated async latency.
 *   Components are fully wired â€” swap the implementations below when the
 *   backend is ready. Nothing in the UI layer needs to change.
 *
 * REAL PHASE (when backend is ready):
 *   Replace each function body with the corresponding fetch() call.
 *   API contracts are documented inline above each function.
 *   See also: /docs/api-contracts/templates.md (generate from this file)
 *
 * Used by:
 *   components/Config/Protocols/SynopticEditor.tsx
 *   components/Config/Templates/TemplateRenderer.tsx
 *
 * Drop-in path: src/services/templateService.ts
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

import { EditorTemplate } from '../../components/Config/Protocols/SynopticEditor';
import { PROTOCOL_REGISTRY, Protocol, LifecycleState, notifyRegistryChanged, saveRegistryOverride } from '../../components/Config/Protocols/protocolShared';

// â”€â”€â”€ Shared types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type TemplateStatus = LifecycleState | 'deprecated';

export interface TemplateSummary {
  id:           string;
  name:         string;
  source:       string;
  version:      string;
  category:     string;
  status:       TemplateStatus;
  fields:       number;
  sections:     number;
  createdBy:    string;
  createdAt:    string;
  updatedAt:    string;
  submittedAt?: string;
  publishedAt?: string;
}

export interface TemplateDetail extends TemplateSummary {
  template:     EditorTemplate;
  reviewNote?:  string;
  reviewedBy?:  string;
}

export interface SaveDraftResult {
  id:        string;
  status:    'draft';
  updatedAt: string;
}

export interface SubmitResult {
  id:          string;
  status:      'in_review';
  submittedAt: string;
}

export interface TransitionResult {
  id:          string;
  status:      TemplateStatus;
  reviewNote?: string;
  updatedAt:   string;
}

export interface ServiceError {
  code:    string;
  message: string;
}

// â”€â”€â”€ In-memory editor state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stores the full EditorTemplate structure keyed by id.
// PROTOCOL_REGISTRY holds the summary/status view; this holds the field data.
// Both are updated together on every write.

const editorStore = new Map<string, EditorTemplate>();

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

const now = () => new Date().toISOString();

function registryEntry(id: string): Protocol | undefined {
  return PROTOCOL_REGISTRY.find(p => p.id === id);
}

function upsertRegistry(patch: Partial<Protocol> & { id: string }): void {
  const idx = PROTOCOL_REGISTRY.findIndex(p => p.id === patch.id);
  if (idx >= 0) {
    PROTOCOL_REGISTRY[idx] = { ...PROTOCOL_REGISTRY[idx], ...patch };
  } else {
    // New entry â€” build a full Protocol from the patch
    PROTOCOL_REGISTRY.push({
      name:         patch.name         ?? 'Untitled',
      category:     patch.category     ?? 'OTHER',
      version:      patch.version      ?? '1.0.0',
      source:       (patch.source as Protocol['source']) ?? 'Custom',
      type:         patch.type         ?? 'Custom',
      status:       patch.status       ?? 'draft',
      fields:       patch.fields       ?? 0,
      snomedPct:    patch.snomedPct    ?? 0,
      icdPct:       patch.icdPct       ?? 0,
      lastModified: patch.lastModified ?? now().slice(0, 10),
      owner:        patch.owner        ?? 'Current User',
      ...patch,
    } as Protocol);
  }
  // Persist to localStorage so transitions survive page reloads (mock-phase bridge)
  saveRegistryOverride(patch);
  notifyRegistryChanged();
}

// â”€â”€â”€ GET /api/templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function listTemplates(
  status?: TemplateStatus | TemplateStatus[]
): Promise<Protocol[]> {
  await delay(300);

  // â”€â”€ MOCK â”€â”€
  const statuses = status ? (Array.isArray(status) ? status : [status]) : null;
  return PROTOCOL_REGISTRY.filter(p => !statuses || statuses.includes(p.status as TemplateStatus));

  // â”€â”€ REAL â”€â”€
  // const q = status ? `?status=${Array.isArray(status) ? status.join(',') : status}` : '';
  // const res = await fetch(`/api/templates${q}`);
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ GET /api/templates/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getTemplate(id: string): Promise<TemplateDetail> {
  await delay(350);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  const storedTemplate = editorStore.get(id);

  // Fallback: template seeded directly into editorStore but not in PROTOCOL_REGISTRY
  // (e.g. skin_melanoma_bx, or any template added via editorStore.set without a registry entry)
  if (!entry && storedTemplate) {
    const tpl = storedTemplate as any;
    const fieldCount = (tpl.sections ?? []).reduce((n: number, s: any) => n + (s.fields?.length ?? 0), 0);
    return {
      id,
      name:      tpl.name ?? id,
      source:    tpl.source ?? 'CAP',
      version:   tpl.version ?? '1.0.0',
      category:  tpl.category ?? 'Other',
      status:    'approved' as TemplateStatus,
      fields:    fieldCount,
      sections:  (tpl.sections ?? []).length,
      createdBy: 'CAP',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      template:  storedTemplate,
    };
  }

  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;
  const template = storedTemplate ?? {
    id, name: entry.name, source: entry.source,
    version: entry.version, category: entry.category, sections: [],
  };
  return {
    id:          entry.id,
    name:        entry.name,
    source:      entry.source,
    version:     entry.version,
    category:    entry.category,
    status:      entry.status as TemplateStatus,
    fields:      entry.fields,
    sections:    0,
    createdBy:   entry.owner,
    createdAt:   entry.lastModified,
    updatedAt:   entry.lastModified,
    reviewNote:  entry.reviewNote,
    template,
  };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}`);
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function saveDraft(template: EditorTemplate): Promise<SaveDraftResult> {
  await delay(400);

  // â”€â”€ MOCK â”€â”€
  const ts = now();
  editorStore.set(template.id, template);
  upsertRegistry({
    id:           template.id,
    name:         template.name || 'Untitled',
    source:       template.source as Protocol['source'],
    version:      template.version,
    category:     template.category,
    status:       'draft',
    fields:       template.sections.reduce((n, s) => n + s.fields.length, 0),
    lastModified: ts.slice(0, 10),
    owner:        'Current User',  // TODO: replace with auth context
  });

  console.info(`[templateService] Draft saved: ${template.name} (${template.id})`);
  return { id: template.id, status: 'draft', updatedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch('/api/templates', {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ template }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates/:id/submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function submitForReview(id: string, note?: string): Promise<SubmitResult> {
  await delay(500);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;

  const ts = now();
  upsertRegistry({ id, status: 'in_review', lastModified: ts.slice(0, 10), reviewNote: note });

  console.info(`[templateService] Submitted for review: ${entry.name}`);
  return { id, status: 'in_review', submittedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}/submit`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ note }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates/:id/approve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function approveTemplate(id: string, note?: string, reviewedBy?: string): Promise<TransitionResult> {
  await delay(500);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;

  const ts = now();
  upsertRegistry({
    id, status: 'approved',
    reviewedBy: reviewedBy ?? 'Unknown User',
    reviewedAt: ts,
    lastModified: ts.slice(0, 10), reviewNote: note,
  });

  console.info(`[templateService] Approved: ${entry.name}`);
  return { id, status: 'approved', updatedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}/approve`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ note }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates/:id/publish â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function publishTemplate(id: string, _note?: string): Promise<TransitionResult> {
  await delay(600);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;

  const ts = now();
  upsertRegistry({ id, status: 'published', reviewNote: undefined, lastModified: ts.slice(0, 10) });

  console.info(`[templateService] Published: ${entry.name}`);

  // Notify the requester if template was built from a request
  // Requester info stored in reviewNote as NOTIFY_REQUESTER:{...} marker
  try {
    const metaMatch = (entry.reviewNote ?? '').match(/NOTIFY_REQUESTER:({.*?})/);
    if (metaMatch) {
      const meta = JSON.parse(metaMatch[1]);
      if (meta.requesterId && meta.requesterName) {
        const { messageService } = await import('../../services');
        await messageService.send({
          senderId: 'u3', senderName: 'System Admin',
recipientId: meta.requesterId, recipientName: meta.requesterName,
subject: `Your template request is ready — ${entry.name}`,
body: `Great news — the synoptic template you requested, "${entry.name}", has been published and is now available in the Synoptic Library. You can add it to any case via "+ Add Synoptic Report".`,
timestamp: new Date(), isUrgent: false,
caseNumber: '',
        });
      }
    }
  } catch { /* notification is best-effort */ }
  return { id, status: 'published', updatedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}/publish`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ note }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates/:id/request-changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function requestChanges(id: string, note: string, reviewedBy?: string): Promise<TransitionResult> {
  await delay(500);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;

  const ts = now();
  upsertRegistry({
    id, status: 'needs_changes', reviewNote: note,
    reviewedBy: reviewedBy ?? 'Unknown User',
    reviewedAt: ts,
    lastModified: ts.slice(0, 10),
  });

  console.info(`[templateService] Changes requested: ${entry.name} â€” "${note}"`);
  return { id, status: 'needs_changes', reviewNote: note, updatedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}/request-changes`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ note }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ POST /api/templates/:id/resubmit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function resubmitForReview(id: string, _note?: string): Promise<SubmitResult> {
  await delay(500);

  // â”€â”€ MOCK â”€â”€
  const entry = registryEntry(id);
  if (!entry) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;

  const ts = now();
  upsertRegistry({ id, status: 'in_review', reviewNote: undefined, lastModified: ts.slice(0, 10) });

  console.info(`[templateService] Resubmitted: ${entry.name}`);
  return { id, status: 'in_review', submittedAt: ts };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}/resubmit`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ note }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ DELETE /api/templates/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function deleteTemplate(id: string): Promise<{ deleted: true }> {
  await delay(300);

  // â”€â”€ MOCK â”€â”€
  const idx = PROTOCOL_REGISTRY.findIndex(p => p.id === id);
  if (idx < 0) throw { code: 'NOT_FOUND', message: `Template ${id} not found` } as ServiceError;
  if (PROTOCOL_REGISTRY[idx].status !== 'draft') {
    throw { code: 'FORBIDDEN', message: 'Only draft templates can be deleted' } as ServiceError;
  }
  PROTOCOL_REGISTRY.splice(idx, 1);
  editorStore.delete(id);

  // Remove from localStorage persistence store
  try {
    const { loadRegistryOverrides } = await import('../../components/Config/Protocols/protocolShared');
    const overrides = loadRegistryOverrides();
    delete overrides[id];
    localStorage.setItem('ps_registry_overrides_v1', JSON.stringify(overrides));
  } catch { /* storage unavailable */ }

  console.info(`[templateService] Deleted draft: ${id}`);
  return { deleted: true };

  // â”€â”€ REAL â”€â”€
  // const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ Convenience: lifecycle transition dispatcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function transitionTemplate(
  id:         string,
  target:     TemplateStatus,
  note?:      string,
  reviewedBy?: string
): Promise<TransitionResult | SubmitResult> {
  switch (target) {
    case 'in_review':     return resubmitForReview(id, note);
    case 'approved':      return approveTemplate(id, note, reviewedBy);
    case 'published':     return publishTemplate(id, note);
    case 'needs_changes': return requestChanges(id, note ?? '', reviewedBy);
    default:
      throw { code: 'INVALID_TRANSITION', message: `No handler for transition to ${target}` } as ServiceError;
  }
}

// â”€â”€â”€ Terminology validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/v1/terminology/validate (see /docs/api/pathscribe-api-contract.yaml)
//
// Mock phase: validates against MOCK_DEPRECATED_CODES.
// Real phase: replace function body with fetch() to the backend endpoint.

export interface TermCode {
  code:    string;
  system:  'snomed' | 'icd';
  display: string;
}

export interface TerminologyAlert {
  id:           string;    // stable key for dismiss tracking: `${system}:${code}:${fieldId}`
  severity:     'error' | 'warning';
  system:       'snomed' | 'icd';
  code:         string;
  message:      string;
  fieldId?:     string;
  fieldLabel?:  string;
  optionId?:    string;
  optionLabel?: string;
  replacements?: TermCode[];
}

// Known deprecated codes â€” mock registry.
// Format: code â†’ { severity, message, replacements? }
// Replace with API call in real phase.
const MOCK_DEPRECATED_CODES: Record<string, {
  system:       'snomed' | 'icd';
  severity:     'error' | 'warning';
  message:      string;
  replacements?: TermCode[];
}> = {
  // SNOMED CT â€” retired concepts
  '363346000': {
    system: 'snomed', severity: 'error',
    message: 'SNOMED CT 363346000 (Malignant neoplastic disease) was retired on 2024-01-31.',
    replacements: [{ code: '363346001', system: 'snomed', display: 'Malignant neoplasm (disorder)' }],
  },
  '188340000': {
    system: 'snomed', severity: 'error',
    message: 'SNOMED CT 188340000 has been retired. Use the updated concept below.',
    replacements: [{ code: '254837009', system: 'snomed', display: 'Malignant neoplasm of breast (disorder)' }],
  },
  '413448000': {
    system: 'snomed', severity: 'warning',
    message: 'SNOMED CT 413448000 is flagged for deprecation in the next release (Jan 2026). Plan replacement.',
    replacements: [{ code: '413448001', system: 'snomed', display: 'Adenocarcinoma of colon (disorder)' }],
  },
  // ICD â€” retired codes
  'C18':  {
    system: 'icd', severity: 'warning',
    message: 'ICD-10 C18 (unspecified) â€” use a more specific 4th-character code (e.g. C18.0â€“C18.9) for CAP compliance.',
  },
  'D05.1': {
    system: 'icd', severity: 'error',
    message: 'ICD-10 D05.1 was retired in ICD-11. Use ICD-11 2E65.0 (Lobular carcinoma in situ of breast) instead.',
    replacements: [{ code: '2E65.0', system: 'icd', display: 'Lobular carcinoma in situ of breast' }],
  },
};

export async function validateTerminologyCodes(
  template: EditorTemplate
): Promise<TerminologyAlert[]> {
  await delay(300);

  // â”€â”€ MOCK â”€â”€
  const alerts: TerminologyAlert[] = [];

  template.sections.forEach(section => {
    section.fields.forEach(field => {

      // Field-level SNOMED
      if (field.snomed) {
        const hit = MOCK_DEPRECATED_CODES[field.snomed];
        if (hit && hit.system === 'snomed') {
          alerts.push({
            id:           `snomed:${field.snomed}:${field.id}`,
            severity:     hit.severity,
            system:       'snomed',
            code:         field.snomed,
            message:      hit.message,
            fieldId:      field.id,
            fieldLabel:   field.label || '(unlabelled field)',
            replacements: hit.replacements,
          });
        }
      }

      // Field-level ICD
      if (field.icd) {
        const hit = MOCK_DEPRECATED_CODES[field.icd];
        if (hit && hit.system === 'icd') {
          alerts.push({
            id:           `icd:${field.icd}:${field.id}`,
            severity:     hit.severity,
            system:       'icd',
            code:         field.icd,
            message:      hit.message,
            fieldId:      field.id,
            fieldLabel:   field.label || '(unlabelled field)',
            replacements: hit.replacements,
          });
        }
      }

      // Option-level SNOMED + ICD
      field.options.forEach(option => {
        if (option.snomed) {
          const hit = MOCK_DEPRECATED_CODES[option.snomed];
          if (hit && hit.system === 'snomed') {
            alerts.push({
              id:           `snomed:${option.snomed}:${field.id}:${option.id}`,
              severity:     hit.severity,
              system:       'snomed',
              code:         option.snomed,
              message:      hit.message,
              fieldId:      field.id,
              fieldLabel:   field.label || '(unlabelled field)',
              optionId:     option.id,
              optionLabel:  option.label || '(unlabelled option)',
              replacements: hit.replacements,
            });
          }
        }
        if (option.icd) {
          const hit = MOCK_DEPRECATED_CODES[option.icd];
          if (hit && hit.system === 'icd') {
            alerts.push({
              id:           `icd:${option.icd}:${field.id}:${option.id}`,
              severity:     hit.severity,
              system:       'icd',
              code:         option.icd,
              message:      hit.message,
              fieldId:      field.id,
              fieldLabel:   field.label || '(unlabelled field)',
              optionId:     option.id,
              optionLabel:  option.label || '(unlabelled option)',
              replacements: hit.replacements,
            });
          }
        }
      });
    });
  });

  return alerts;

  // â”€â”€ REAL â”€â”€
  // const res = await fetch('/api/v1/terminology/validate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ codes: extractCodes(template) }),
  // });
  // if (!res.ok) throw await res.json() as ServiceError;
  // return res.json();
}

// â”€â”€â”€ DEVELOPMENT SEED (CAP eCC JSON files) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Imports real CAP protocol JSON files converted from official eCCs.
// Each is seeded into editorStore at module load so getTemplate() returns
// real field data during development. Remove when backend API is wired in.

import BREAST_INVASIVE_JSON      from '../../data/templates/CAP/breast_invasive.json';
import BREAST_DCIS_JSON          from '../../data/templates/CAP/breast_dcis_resection.json';
import LUNG_ADENO_JSON           from '../../data/templates/CAP/lung_adeno.json';
import PROSTATE_NEEDLE_JSON      from '../../data/templates/CAP/prostate_needle_biopsy.json';
import COLON_RESECTION_JSON      from '../../data/templates/CAP/colon_resection.json';
import SKIN_MELANOMA_JSON        from '../../data/templates/CAP/skin_melanoma_bx.json';
import PROSTATE_RESECTION_JSON   from '../../data/templates/CAP/prostate_resection.json';
import LUNG_RESECTION_JSON       from '../../data/templates/CAP/lung_resection.json';
import KIDNEY_RESECTION_JSON    from '../../data/templates/CAP/kidney_resection.json';
import KIDNEY_BIOPSY_JSON       from '../../data/templates/CAP/kidney_biopsy.json';
import WILMS_RESECTION_JSON     from '../../data/templates/CAP/wilms_resection.json';
import WILMS_BIOPSY_JSON        from '../../data/templates/CAP/wilms_biopsy.json';

// Seed all real CAP templates
editorStore.set('breast_invasive',        BREAST_INVASIVE_JSON   as any);
editorStore.set('breast_dcis_resection',  BREAST_DCIS_JSON       as any);
editorStore.set('lung_adeno',             LUNG_ADENO_JSON        as any);
editorStore.set('prostate_needle_biopsy', PROSTATE_NEEDLE_JSON   as any);
editorStore.set('colon_resection',        COLON_RESECTION_JSON   as any);
editorStore.set('skin_melanoma_bx',          SKIN_MELANOMA_JSON       as any);
editorStore.set('kidney_resection',    KIDNEY_RESECTION_JSON    as unknown as EditorTemplate);
editorStore.set('kidney_biopsy',       KIDNEY_BIOPSY_JSON       as unknown as EditorTemplate);
editorStore.set('wilms_resection',     WILMS_RESECTION_JSON     as unknown as EditorTemplate);
editorStore.set('wilms_biopsy',        WILMS_BIOPSY_JSON        as unknown as EditorTemplate);
editorStore.set('prostate_resection',        PROSTATE_RESECTION_JSON  as any);
editorStore.set('lung_resection',            LUNG_RESECTION_JSON      as any);
// Alias — internal protocol ID used in CAP JSON
editorStore.set('skin_invasive_melanoma_biopsy', SKIN_MELANOMA_JSON as any);

// RCPath Templates (UK)
import RCPATH_BREAST_JSON         from '../../data/templates/RCPATH/rcpath_g148_breast_surgical_excision.json';
import RCPATH_COLORECTAL_RES_JSON from '../../data/templates/RCPATH/rcpath_colorectal_resection.json';
import RCPATH_COLORECTAL_LOC_JSON from '../../data/templates/RCPATH/rcpath_colorectal_local_excision.json';
import RCPATH_COLORECTAL_FI_JSON  from '../../data/templates/RCPATH/rcpath_colorectal_further_investigations.json';
import RCPATH_PROSTATE_BX_JSON    from '../../data/templates/RCPATH/rcpath_prostate_biopsy.json';
import RCPATH_PROSTATE_RP_JSON    from '../../data/templates/RCPATH/rcpath_prostate_radical_prostatectomy.json';
import RCPATH_PROSTATE_TURP_JSON  from '../../data/templates/RCPATH/rcpath_prostate_turp_enucleation.json';

editorStore.set('rcpath_g148_breast_surgical_excision',       RCPATH_BREAST_JSON        as any);
editorStore.set('rcpath_colorectal_resection',                RCPATH_COLORECTAL_RES_JSON as any);
editorStore.set('rcpath_colorectal_local_excision',           RCPATH_COLORECTAL_LOC_JSON as any);
editorStore.set('rcpath_colorectal_further_investigations',   RCPATH_COLORECTAL_FI_JSON  as any);
editorStore.set('rcpath_prostate_biopsy',                     RCPATH_PROSTATE_BX_JSON   as any);
editorStore.set('rcpath_prostate_radical_prostatectomy',      RCPATH_PROSTATE_RP_JSON   as any);
editorStore.set('rcpath_prostate_turp_enucleation',           RCPATH_PROSTATE_TURP_JSON as any);
