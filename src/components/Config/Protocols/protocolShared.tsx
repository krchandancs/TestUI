/**
 * protocolShared.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared data registry, types, style maps, and micro-components used by
 * ActiveProtocolsSection, ReviewQueueSection, and AllProtocolsSection.
 *
 * TODO: Replace PROTOCOL_REGISTRY with a useProtocols() hook once the
 * data layer (API / context) is wired up.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import '../../../pathscribe.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LifecycleState =
  | 'draft'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'published';

export interface Protocol {
  id:           string;
  name:         string;
  category:     string;
  version:      string;
  source:       'CAP' | 'RCPath' | 'ICCR' | 'Custom';
  type:         string;
  status:       LifecycleState;
  fields:       number;
  snomedPct:    number;
  icdPct:       number;
  lastModified: string;
  owner:        string;
  reviewNote?:  string;
  reviewedBy?:  string;   // who requested changes or approved
  reviewedAt?:  string;   // ISO timestamp of last review action
}

// ─── Data registry ────────────────────────────────────────────────────────────
// Single source of truth for all protocol/template state.
// templateService mutates this array directly during the mock phase.
// Replace with a useProtocols() hook backed by API once the backend is ready.
//
// localStorage bridge: on module load we merge any saved protocol overrides
// back into the registry so that lifecycle transitions survive page reloads.
// Key: ps_registry_overrides_v1  Value: Record<id, Partial<Protocol>>

const REGISTRY_STORE_KEY = 'ps_registry_overrides_v1';

export function loadRegistryOverrides(): Record<string, Partial<Protocol>> {
  try {
    const raw = localStorage.getItem(REGISTRY_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveRegistryOverride(patch: Partial<Protocol> & { id: string }): void {
  try {
    const overrides = loadRegistryOverrides();
    overrides[patch.id] = { ...(overrides[patch.id] ?? {}), ...patch };
    localStorage.setItem(REGISTRY_STORE_KEY, JSON.stringify(overrides));
  } catch { /* storage unavailable */ }
}

export let PROTOCOL_REGISTRY: Protocol[] = [
  {
    // CAP v4.10.0.0 — 6 sections, 35 fields (real eCC JSON)
    id: 'breast_invasive', name: 'CAP Breast Invasive Carcinoma — Resection',
    category: 'BREAST', version: '4.10.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 35, snomedPct: 89, icdPct: 84,
    lastModified: '2026-03-30', owner: 'Dr. A. Mensah',
  },
  {
    // CAP v4.3.0.2 — 6 sections, 20 fields (real eCC JSON)
    id: 'breast_dcis_resection', name: 'CAP Breast DCIS — Resection',
    category: 'BREAST', version: '4.3.0.2', source: 'CAP', type: 'Base template',
    status: 'published', fields: 20, snomedPct: 88, icdPct: 82,
    lastModified: '2026-03-30', owner: 'Dr. A. Mensah',
  },
  {
    // CAP v4.4.0.1 (September 2025) — 9 sections, 46 fields (real eCC JSON)
    id: 'colon_resection', name: 'CAP Colon & Rectum Carcinoma — Resection',
    category: 'COLON', version: '4.4.0.1', source: 'CAP', type: 'Base template',
    status: 'published', fields: 46, snomedPct: 91, icdPct: 88,
    lastModified: '2026-03-30', owner: 'Dr. K. Patel',
    reviewedBy: 'Dr. A. Mensah', reviewedAt: '2026-03-30T00:00:00Z',
  },
  {
    // CAP v4.2.0.0 — 9 sections, 34 fields (real eCC JSON)
    id: 'lung_adeno', name: 'CAP Lung — Resection',
    category: 'LUNG', version: '4.2.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 34, snomedPct: 78, icdPct: 70,
    lastModified: '2026-03-30', owner: 'Dr. M. Chen',
    reviewedBy: 'Dr. K. Patel', reviewedAt: '2026-03-30T00:00:00Z',
  },
  {
    // CAP v1.1.0.0 — 9 sections, 34 fields (real eCC JSON)
    id: 'prostate_needle_biopsy', name: 'CAP Prostate — Needle Biopsy',
    category: 'PROSTATE', version: '1.1.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 34, snomedPct: 82, icdPct: 75,
    lastModified: '2026-03-30', owner: 'Dr. R. Singh',
  },
  {
    // CAP v4.3.0.0 — 7 sections, 29 fields (official eCC Word doc)
    id: 'prostate_resection', name: 'CAP Prostate Gland — Radical Prostatectomy',
    category: 'PROSTATE', version: '4.3.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 29, snomedPct: 84, icdPct: 78,
    lastModified: '2026-04-17', owner: 'Dr. S. Johnson',
  },
  {
    // CAP v5.1.0.0 — 7 sections, 31 fields (official eCC Word doc)
    id: 'lung_resection', name: 'CAP Lung — Resection (All Types)',
    category: 'LUNG', version: '5.1.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 31, snomedPct: 82, icdPct: 75,
    lastModified: '2026-04-17', owner: 'Dr. S. Johnson',
  },
  {
    // CAP v1.1.0.0 — 5 sections, 17 fields (real eCC JSON)
    id: 'skin_melanoma_bx', name: 'CAP Melanoma of the Skin — Biopsy/Excision',
    category: 'SKIN', version: '1.1.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 22, snomedPct: 80, icdPct: 72,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'liver_biopsy_medical', name: 'Liver Biopsy — Medical (Native)',
    category: 'LIVER', version: '1.0.1', source: 'Custom', type: 'Non-cancer / Custom',
    status: 'in_review', fields: 18, snomedPct: 72, icdPct: 60,
    lastModified: '2025-12-01', owner: 'Dr. L. Okonkwo',
    reviewNote: 'Awaiting clinical sign-off from hepatopathology',
  },
  {
    id: 'lung_small_cell', name: 'Lung — Small Cell Carcinoma',
    category: 'LUNG', version: '2.0.0', source: 'CAP', type: 'Base template',
    status: 'needs_changes', fields: 41, snomedPct: 68, icdPct: 55,
    lastModified: '2025-11-25', owner: 'Dr. M. Chen',
    reviewNote: 'SNOMED coding incomplete — 12 answer options uncoded. Return to author.',
    reviewedBy: 'Dr. A. Mensah', reviewedAt: '2025-11-27T09:15:00Z',
  },
  {
    id: 'placenta_term', name: 'Placenta — Term Delivery',
    category: 'PLACENTA', version: '1.0.0', source: 'Custom', type: 'Non-cancer / Custom',
    status: 'in_review', fields: 24, snomedPct: 40, icdPct: 20,
    lastModified: '2025-12-03', owner: 'Dr. S. Torres',
    reviewNote: 'First submission — please review section structure and SNOMED coverage.',
  },
  {
    id: 'renal_transplant_biopsy', name: 'Renal Biopsy — Transplant',
    category: 'KIDNEY', version: '0.9.0', source: 'Custom', type: 'Non-cancer / Custom',
    status: 'draft', fields: 21, snomedPct: 33, icdPct: 15,
    lastModified: '2025-12-04', owner: 'Dr. J. Williams',
  },
  // ── RCPath Templates (UK) ──────────────────────────────────────────────
  {
    id: 'rcpath_g148_breast_surgical_excision',
    name: 'RCPath Breast Disease — Surgical Excision (G148)',
    category: 'BREAST', version: 'G148-2024-11', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 52, snomedPct: 88, icdPct: 80,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_colorectal_resection',
    name: 'RCPath Colorectal Carcinoma — Resection (Appendix F)',
    category: 'COLON', version: 'v4-TNM9', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 56, snomedPct: 91, icdPct: 88,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_colorectal_local_excision',
    name: 'RCPath Colorectal Carcinoma — Local Excision (Appendix D)',
    category: 'COLON', version: 'v4-TNM9', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 38, snomedPct: 88, icdPct: 85,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_colorectal_further_investigations',
    name: 'RCPath Colorectal — Further Investigations (Appendix E)',
    category: 'COLON', version: 'v4-2024', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 18, snomedPct: 82, icdPct: 75,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_prostate_biopsy',
    name: 'RCPath Prostate — Needle Biopsy',
    category: 'PROSTATE', version: 'v5-2024', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 32, snomedPct: 85, icdPct: 78,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_prostate_radical_prostatectomy',
    name: 'RCPath Prostate — Radical Prostatectomy',
    category: 'PROSTATE', version: 'v5-2024', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 44, snomedPct: 87, icdPct: 80,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  {
    id: 'rcpath_prostate_turp_enucleation',
    name: 'RCPath Prostate — TURP / Enucleation',
    category: 'PROSTATE', version: 'v5-2024', source: 'RCPath', type: 'Base template',
    status: 'published', fields: 22, snomedPct: 80, icdPct: 72,
    lastModified: '2026-04-10', owner: 'Dr. S. Johnson',
  },
  // ── Kidney ──────────────────────────────────────────────────────────────────
  {
    id: 'kidney_resection', name: 'CAP Kidney — Renal Cell Carcinoma Resection',
    category: 'KIDNEY', version: '4.2.1.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 35, snomedPct: 0, icdPct: 0,
    lastModified: '2026-04-18', owner: 'System',
  },
  {
    id: 'kidney_biopsy', name: 'CAP Kidney — Renal Cell Carcinoma Biopsy',
    category: 'KIDNEY', version: '4.2.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 10, snomedPct: 0, icdPct: 0,
    lastModified: '2026-04-18', owner: 'System',
  },
  {
    id: 'wilms_resection', name: 'CAP Kidney — Wilms & Pediatric Renal Tumors Resection',
    category: 'KIDNEY', version: '4.4.0.0', source: 'CAP', type: 'Base template',
    status: 'published', fields: 42, snomedPct: 0, icdPct: 0,
    lastModified: '2026-04-18', owner: 'System',
  },
  {
    id: 'wilms_biopsy', name: 'CAP Kidney — Wilms & Pediatric Renal Tumors Biopsy',
    category: 'KIDNEY', version: '5.0.0.1', source: 'CAP', type: 'Base template',
    status: 'published', fields: 8, snomedPct: 0, icdPct: 0,
    lastModified: '2026-04-18', owner: 'System',
  },
];

// Hydrate from localStorage on module load — merges saved overrides so that
// transitions made in previous sessions are reflected immediately on reload.
// This is the mock-phase bridge; remove when the backend API is wired in.
{
  const overrides = loadRegistryOverrides();
  PROTOCOL_REGISTRY = PROTOCOL_REGISTRY.map(p =>
    overrides[p.id] ? { ...p, ...overrides[p.id] } : p
  );
  // Also restore any entries that were created at runtime (not in mock array)
  Object.values(overrides).forEach(o => {
    if (o.id && !PROTOCOL_REGISTRY.find(p => p.id === o.id)) {
      PROTOCOL_REGISTRY.push(o as Protocol);
    }
  });
}

// ─── Registry subscriber ──────────────────────────────────────────────────────
// Allows components to re-render when templateService mutates PROTOCOL_REGISTRY.
// Call notifyRegistryChanged() after any mutation in templateService.

type RegistryListener = () => void;
const registryListeners = new Set<RegistryListener>();

export function subscribeToRegistry(fn: RegistryListener): () => void {
  registryListeners.add(fn);
  return () => registryListeners.delete(fn);
}

export function notifyRegistryChanged(): void {
  registryListeners.forEach(fn => fn());
}

// useProtocols — drop-in hook that re-renders when the registry changes.
// Stores a snapshot of the filtered array in state so React sees a new
// reference on every mutation and re-renders reliably.
// Replace body with a real API fetch when backend is ready.
export function useProtocols(
  filter?: (p: Protocol) => boolean
): Protocol[] {
  const snapshot = () => filter ? PROTOCOL_REGISTRY.filter(filter) : [...PROTOCOL_REGISTRY];

  const [protocols, setProtocols] = React.useState<Protocol[]>(snapshot);

  React.useEffect(() => {
    // Refresh immediately in case registry changed before mount
    setProtocols(snapshot());
    // Subscribe for future changes
    return subscribeToRegistry(() => setProtocols(snapshot()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return protocols;
}



export const LIFECYCLE_STYLES: Record<LifecycleState, { bg: string; color: string; border: string }> = {
  draft:         { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)'  },
  in_review:     { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'   },
  needs_changes: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'    },
  approved:      { bg: 'rgba(16,185,129,0.15)',  color: '#10B981', border: 'rgba(16,185,129,0.3)'   },
  published:     { bg: 'rgba(8,145,178,0.15)',   color: '#38bdf8', border: 'rgba(8,145,178,0.3)'    },
};

export const SOURCE_STYLES: Record<string, { color: string; bg: string }> = {
  CAP:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  RCPath: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  ICCR:   { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)'  },
  Custom: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
};

export const CATEGORY_COLORS: Record<string, string> = {
  BREAST:   '#e879f9',
  COLON:    '#2dd4bf',
  PROSTATE: '#60a5fa',
  LUNG:     '#fbbf24',
  LIVER:    '#4ade80',
  PLACENTA: '#f472b6',
  KIDNEY:   '#818cf8',
};

export const LIFECYCLE_ORDER: LifecycleState[] = ['draft', 'in_review', 'approved', 'published'];

// ─── Shared micro-components ──────────────────────────────────────────────────

export const LifecycleBadge: React.FC<{ state: LifecycleState }> = ({ state }) => {
  const s = LIFECYCLE_STYLES[state];
  const label = state === 'needs_changes' ? 'Needs Changes' : state.replace('_', ' ');
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
};

export const CoverageBar: React.FC<{ pct: number; label: string }> = ({ pct, label }) => {
  const color = pct >= 85 ? '#10B981' : pct >= 65 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
};

// ─── UploadProtocolModal ──────────────────────────────────────────────────────
// Direct upload modal — no intermediary root step.
// Reached by clicking "Upload Protocol" button in any section header.

type GoverningBody = 'CAP' | 'RCPath' | 'ICCR' | 'RCPA' | 'Other';

const GOVERNING_BODIES: { id: GoverningBody; label: string; desc: string }[] = [
  { id: 'CAP',    label: 'CAP',    desc: 'College of American Pathologists' },
  { id: 'RCPath', label: 'RCPath', desc: 'Royal College of Pathologists (UK)' },
  { id: 'ICCR',   label: 'ICCR',   desc: 'International Collaboration on Cancer Reporting' },
  { id: 'RCPA',   label: 'RCPA',   desc: 'Royal College of Pathologists of Australasia' },
  { id: 'Other',  label: 'Other',  desc: 'Custom or unlisted governing body' },
];

export const UploadProtocolModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [govBody,  setGovBody]  = React.useState<GoverningBody>('CAP');
  const [file,     setFile]     = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '500px', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Upload Protocol</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manual upload — fallback if nightly sync misses an update</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Governing body */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Governing Body</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GOVERNING_BODIES.map(gb => (
                <button
                  key={gb.id} onClick={() => setGovBody(gb.id)} title={gb.desc}
                  style={{ padding: '5px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.12s', background: govBody === gb.id ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.04)', color: govBody === gb.id ? '#0891B2' : '#64748b', border: `1px solid ${govBody === gb.id ? 'rgba(8,145,178,0.4)' : '#334155'}` }}
                >
                  {gb.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px' }}>{GOVERNING_BODIES.find(g => g.id === govBody)?.desc}</div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('ps-upload-input')?.click()}
            style={{ border: `2px dashed ${dragging ? '#0891B2' : file ? 'rgba(16,185,129,0.5)' : '#334155'}`, borderRadius: '10px', padding: '28px', textAlign: 'center', background: dragging ? 'rgba(8,145,178,0.05)' : file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s', cursor: 'pointer' }}
          >
            <input id="ps-upload-input" type="file" accept=".json,.xml,.xlsx" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>✅</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>{file.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>📤</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Drop {govBody} protocol file here</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>JSON, XML or XLSX · or click to browse</div>
              </>
            )}
          </div>

          {/* Warning */}
          <div style={{ padding: '10px 13px', borderRadius: '7px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>ℹ️ Review required — </span>
            uploaded protocols go to the Review Queue and must pass verification before being published.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button
              disabled={!file} onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${file ? 'rgba(8,145,178,0.4)' : '#334155'}`, background: file ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.04)', color: file ? '#0891B2' : '#334155', fontSize: '13px', fontWeight: 600, cursor: file ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              Upload to Review Queue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── BuildCustomiseModal ──────────────────────────────────────────────────────
// Reached by clicking "Build / Customise" button.
// Offers: Start from Scratch OR pick an existing template.

export const BuildCustomiseModal: React.FC<{
  onClose:             () => void;
  onBuildBlank:        () => void;
  onBuildFromTemplate: (templateId: string) => void;
}> = ({ onClose, onBuildBlank, onBuildFromTemplate }) => {
  const [selectedTpl, setSelectedTpl] = React.useState<string | null>(null);
  const [search,      setSearch]      = React.useState('');
  const publishedTemplates = PROTOCOL_REGISTRY.filter(p => p.status === 'published');
  const filtered = search.trim()
    ? publishedTemplates.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.source.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : publishedTemplates;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '500px', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Build / Customise</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Start blank or base it on an existing template</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Blank */}
          <div
            onClick={onBuildBlank}
            style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid #334155', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#a78bfa')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🧩</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Start from Scratch</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Blank template — define your own sections, fields, and coding</div>
            </div>
            <span style={{ color: '#475569', fontSize: '18px' }}>›</span>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
            <span style={{ fontSize: '11px', color: '#475569' }}>or base it on</span>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          </div>

          {/* Template picker */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Existing Template</div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#475569', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name, source, or category…"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedTpl(null); }}
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '7px', border: '1px solid #334155', background: 'rgba(255,255,255,0.04)', color: '#f1f5f9', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#0891B2'}
                onBlur={e => e.currentTarget.style.borderColor = '#334155'}
                autoFocus={false}
              />
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>
                  No templates match "{search}"
                </div>
              )}
              {filtered.map(p => {
                const srcStyle = SOURCE_STYLES[p.source] ?? SOURCE_STYLES.Custom;
                const selected = selectedTpl === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedTpl(selected ? null : p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: selected ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected ? 'rgba(8,145,178,0.35)' : '#334155'}`, cursor: 'pointer', transition: 'all 0.12s' }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: srcStyle.bg, color: srcStyle.color, fontFamily: 'monospace' }}>{p.source}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }} data-phi="name">{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>{p.version} · {p.fields} fields</div>
                    </div>
                    {selected && <span style={{ color: '#0891B2', fontSize: '16px' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            {selectedTpl && (
              <button
                onClick={() => onBuildFromTemplate(selectedTpl)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid rgba(8,145,178,0.4)', background: 'rgba(8,145,178,0.15)', color: '#0891B2', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              >
                Customise This Template →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Keep AddToLibraryModal as alias for backward compatibility
export const AddToLibraryModal = BuildCustomiseModal;
export const ImportModal       = BuildCustomiseModal;
