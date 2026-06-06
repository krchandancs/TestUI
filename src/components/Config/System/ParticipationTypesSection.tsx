// src/components/Config/System/ParticipationTypesSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// System-level master list of case participation types.
// Admins define types here; roles then select which types they can serve as.
// Follows the same pattern as ClientDictionary / SubspecialtiesSection.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import '../../../pathscribe.css';
import { overlay, modalBox, modalHeaderStyle, modalFooterStyle, cancelButtonStyle, applyButtonStyle } from '../../Common/modalStyles';
import { storageGet, storageSet } from '../../../services/mockStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParticipationType {
  id:                    string;
  label:                 string;
  abbreviation:          string;
  description:           string;
  canFinalize:           boolean;
  requiresCountersign:   boolean;
  canBeAssignedTemplate: boolean;
  canViewWholeCase:      boolean;
  /** Multiple people can hold this role on the same case simultaneously */
  allowsMultiple:        boolean;
  color:                 string;
  builtIn:               boolean;
  active:                boolean;
}

// ─── Built-in types — shipped with PathScribe ─────────────────────────────────

export const BUILT_IN_PARTICIPATION_TYPES: ParticipationType[] = [
  {
    id: 'primary', label: 'Primary Pathologist', abbreviation: 'Primary',
    description: 'Responsible pathologist with full case ownership and sign-out authority.',
    canFinalize: true, requiresCountersign: false,
    canBeAssignedTemplate: true, canViewWholeCase: true, allowsMultiple: false,
    color: '#8AB4F8', builtIn: true, active: true,
  },
  {
    id: 'consultant', label: 'Consultant', abbreviation: 'Consult',
    description: 'Subspecialty consultant contributing an opinion on specific specimens or findings.',
    canFinalize: false, requiresCountersign: false,
    canBeAssignedTemplate: true, canViewWholeCase: false, allowsMultiple: true,
    color: '#60a5fa', builtIn: true, active: true,
  },
  {
    id: 'second_opinion', label: 'Second Opinion', abbreviation: '2nd Op',
    description: 'Formal second opinion — can view the whole case but does not sign out.',
    canFinalize: false, requiresCountersign: false,
    canBeAssignedTemplate: true, canViewWholeCase: true, allowsMultiple: true,
    color: '#818cf8', builtIn: true, active: true,
  },
  {
    id: 'frozen_section', label: 'Frozen Section', abbreviation: 'Frozen',
    description: 'Intraoperative frozen section pathologist — report requires attending countersign.',
    canFinalize: false, requiresCountersign: true,
    canBeAssignedTemplate: true, canViewWholeCase: false, allowsMultiple: false,
    color: '#38bdf8', builtIn: true, active: true,
  },
  {
    id: 'grossing', label: 'Grossing Pathologist', abbreviation: 'Grossing',
    description: 'Performs macroscopic examination and specimen description. Work requires countersign.',
    canFinalize: false, requiresCountersign: true,
    canBeAssignedTemplate: false, canViewWholeCase: true, allowsMultiple: true,
    color: '#81C995', builtIn: true, active: true,
  },
  {
    id: 'preliminary_report', label: 'Preliminary Report', abbreviation: 'Prelim',
    description: 'Drafts the microscopic report under supervision. Requires attending countersign.',
    canFinalize: false, requiresCountersign: true,
    canBeAssignedTemplate: true, canViewWholeCase: true, allowsMultiple: true,
    color: '#4ade80', builtIn: true, active: true,
  },
  {
    id: 'observer', label: 'Observer', abbreviation: 'Observer',
    description: 'View-only access for training or audit purposes. No reporting capability.',
    canFinalize: false, requiresCountersign: false,
    canBeAssignedTemplate: false, canViewWholeCase: true, allowsMultiple: true,
    color: '#6b7280', builtIn: true, active: true,
  },
  {
    id: 'cytotechnologist', label: 'Cytotechnologist', abbreviation: 'CytoTech',
    description: 'Screens cytology slides and flags abnormals for pathologist review.',
    canFinalize: false, requiresCountersign: true,
    canBeAssignedTemplate: true, canViewWholeCase: false, allowsMultiple: true,
    color: '#f59e0b', builtIn: true, active: true,
  },
  {
    id: 'tumour_board', label: 'Tumour Board', abbreviation: 'MDT',
    description: 'Multidisciplinary team participant — view access for case discussion.',
    canFinalize: false, requiresCountersign: false,
    canBeAssignedTemplate: false, canViewWholeCase: true, allowsMultiple: true,
    color: '#8b5cf6', builtIn: true, active: true,
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pathscribe_participation_types';

export function loadParticipationTypes(): ParticipationType[] {
  const stored = storageGet<ParticipationType[]>(STORAGE_KEY, BUILT_IN_PARTICIPATION_TYPES);
  // Ensure built-ins are always present (migration guard)
  const ids = stored.map(t => t.id);
  const missing = BUILT_IN_PARTICIPATION_TYPES.filter(t => !ids.includes(t.id));
  // Migration: backfill allowsMultiple for types stored before this field existed
  const migrated = stored.map(t => ({ allowsMultiple: false, ...t }));
  return [...missing, ...migrated];
}

function saveParticipationTypes(types: ParticipationType[]) {
  storageSet(STORAGE_KEY, types);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  padding: '9px 12px', fontSize: 13, color: '#e5e7eb',
  background: '#0f0f0f', border: '1px solid #374151',
  borderRadius: 7, outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
};
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };

// ─── Attribute chip ───────────────────────────────────────────────────────────

const AttrChip: React.FC<{ label: string; value: boolean; onColor?: string }> = ({ label, value, onColor = '#22c55e' }) => (
  <span style={{
    fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
    background: value ? onColor + '18' : 'rgba(255,255,255,0.04)',
    color: value ? onColor : '#4b5563',
    border: `1px solid ${value ? onColor + '33' : 'rgba(255,255,255,0.06)'}`,
  }}>
    {value ? '✓' : '—'} {label}
  </span>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

type Draft = Omit<ParticipationType, 'id' | 'builtIn'>;
const emptyDraft: Draft = {
  label: '', abbreviation: '', description: '',
  canFinalize: false, requiresCountersign: false,
  canBeAssignedTemplate: true, canViewWholeCase: true, allowsMultiple: false,
  color: '#8AB4F8', active: true,
};

const TypeModal: React.FC<{
  mode: 'add' | 'edit';
  type?: ParticipationType;
  onSave: (draft: Draft) => void;
  onClose: () => void;
}> = ({ mode, type, onSave, onClose }) => {
  const [draft, setDraft] = useState<Draft>(
    type ? {
      label: type.label, abbreviation: type.abbreviation, description: type.description,
      canFinalize: type.canFinalize, requiresCountersign: type.requiresCountersign,
      canBeAssignedTemplate: type.canBeAssignedTemplate, canViewWholeCase: type.canViewWholeCase,
      allowsMultiple: type.allowsMultiple ?? false,
      color: type.color, active: type.active,
    } : { ...emptyDraft }
  );
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!draft.label.trim()) { setError('Label is required'); return; }
    if (!draft.abbreviation.trim()) { setError('Abbreviation is required'); return; }
    onSave(draft);
  };

  const isBuiltIn = type?.builtIn ?? false;

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...modalBox, maxWidth: 520, maxHeight: '92vh',
        padding: 0, display: 'flex', flexDirection: 'column',
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
      }}>
        {/* Header */}
        <div style={{ ...modalHeaderStyle, padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span>{mode === 'add' ? 'Add Participation Type' : `Edit — ${type?.label}`}</span>
          {isBuiltIn && (
            <span style={{ fontSize: 10, color: '#6b7280', padding: '2px 8px', borderRadius: 4, border: '1px solid #374151', marginLeft: 10 }}>built-in</span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

          {isBuiltIn && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(138,180,248,0.06)', border: '1px solid rgba(138,180,248,0.15)', fontSize: 12, color: '#8AB4F8' }}>
              ℹ Built-in types cannot be deleted but you can change their label, colour, and active status.
            </div>
          )}

          {/* Label + Abbreviation + Colour */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...FIELD, flex: 1 }}>
              <label style={LABEL}>Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={draft.label} onChange={e => { setDraft(d => ({ ...d, label: e.target.value })); setError(''); }}
                placeholder="e.g. Consultant" style={{ ...INPUT, borderColor: error && !draft.label ? '#ef4444' : '#374151' }} />
            </div>
            <div style={{ ...FIELD, width: 120 }}>
              <label style={LABEL}>Abbreviation <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={draft.abbreviation} onChange={e => { setDraft(d => ({ ...d, abbreviation: e.target.value })); setError(''); }}
                placeholder="e.g. Consult" style={{ ...INPUT, borderColor: error && !draft.abbreviation ? '#ef4444' : '#374151' }} />
            </div>
            <div style={{ ...FIELD, width: 48, alignItems: 'center' }}>
              <label style={{ ...LABEL, textAlign: 'center' }}>Colour</label>
              <input type="color" value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                style={{ width: 44, height: 38, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none' }} />
            </div>
          </div>

          {/* Preview chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Preview:</span>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: draft.color + '22', color: draft.color, border: `1px solid ${draft.color}44` }}>
              {draft.abbreviation || 'Abbrev'}
            </span>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: draft.color + '22', color: draft.color, border: `1px solid ${draft.color}44` }}>
              {draft.label || 'Label'}
            </span>
          </div>

          {/* Description */}
          <div style={FIELD}>
            <label style={LABEL}>Description</label>
            <input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe when this participation type applies…" style={INPUT} />
          </div>

          {/* Permission toggles */}
          <div style={FIELD}>
            <label style={LABEL}>Capabilities</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { key: 'canFinalize',           label: 'Can Finalise',          desc: 'Can sign out and finalise a case independently',                       disabled: isBuiltIn },
                { key: 'requiresCountersign',   label: 'Requires Countersign',  desc: 'Work must be reviewed and countersigned by a more senior participant',  disabled: isBuiltIn },
                { key: 'canBeAssignedTemplate', label: 'Template Assignment',   desc: 'Can be assigned a specific synoptic template on a case',                disabled: isBuiltIn },
                { key: 'canViewWholeCase',      label: 'Full Case View',        desc: 'Can view the entire case, not just assigned specimens or synoptics',     disabled: isBuiltIn },
                { key: 'allowsMultiple',        label: 'Multiple Participants', desc: 'Multiple people can hold this role on the same case simultaneously',    disabled: false },
              ] as const).map(({ key, label, desc, disabled }) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, cursor: disabled ? 'default' : 'pointer',
                  padding: '10px 12px', borderRadius: 8,
                  background: draft[key] ? 'rgba(138,180,248,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${draft[key] ? 'rgba(138,180,248,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: disabled ? 0.6 : 1,
                }}>
                  <input type="checkbox" checked={!!draft[key]} disabled={disabled}
                    onChange={e => !disabled && setDraft(d => ({ ...d, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#8AB4F8', cursor: disabled ? 'default' : 'pointer', marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => setDraft(d => ({ ...d, active: !d.active }))}
              style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, background: draft.active ? '#22c55e' : '#374151', boxShadow: draft.active ? '0 0 8px #22c55e55' : 'none' }}>
              <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: draft.active ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: draft.active ? '#22c55e' : '#6b7280' }}>{draft.active ? 'Active' : 'Inactive'}</span>
          </div>

          {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ ...modalFooterStyle, padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button style={cancelButtonStyle} onClick={onClose}>Cancel</button>
          <button style={applyButtonStyle} onClick={handleSave}>
            {mode === 'add' ? 'Add Type' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const ParticipationTypesSection: React.FC = () => {
  const [types,  setTypes]  = useState<ParticipationType[]>(loadParticipationTypes);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modal,  setModal]  = useState<{ mode: 'add' | 'edit'; type?: ParticipationType } | null>(null);

  const persist = (next: ParticipationType[]) => { setTypes(next); saveParticipationTypes(next); };

  const handleSave = (draft: Draft) => {
    if (modal?.mode === 'add') {
      const newType: ParticipationType = {
        ...draft,
        id: draft.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        builtIn: false,
      };
      persist([...types, newType]);
    } else if (modal?.type) {
      persist(types.map(t => t.id === modal.type!.id ? { ...t, ...draft } : t));
    }
    setModal(null);
  };

  const filtered = types.filter(t => {
    const matchSearch = !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? t.active : !t.active);
    return matchSearch && matchFilter;
  });

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Participation Types</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Define the types of participation a staff member can have on a case.
            Roles are then assigned which types they can serve as.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #1a6080, #0d4a63)', border: '1px solid #2a7a9a', borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,163,196,0.2)', whiteSpace: 'nowrap' }}
        >
          + Add Type
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search participation types…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 16px', fontSize: 13, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none' }} />
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{ padding: '9px 36px 9px 14px', fontSize: 13, fontWeight: 600, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Type', 'Description', 'Capabilities', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #111827' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Type chip */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: t.color + '22', color: t.color, border: `1px solid ${t.color}44` }}>
                        {t.abbreviation}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{t.label}</div>
                        {t.builtIn && <div style={{ fontSize: 10, color: '#4b5563' }}>built-in</div>}
                      </div>
                    </div>
                  </td>
                  {/* Description */}
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', maxWidth: 220 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description || '—'}
                    </span>
                  </td>
                  {/* Capabilities */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <AttrChip label="Finalise"       value={t.canFinalize}             onColor="#22c55e" />
                      <AttrChip label="Countersign"    value={t.requiresCountersign}     onColor="#f59e0b" />
                      <AttrChip label="Template"       value={t.canBeAssignedTemplate}   onColor="#8AB4F8" />
                      <AttrChip label="Full View"      value={t.canViewWholeCase}        onColor="#8AB4F8" />
                      <AttrChip label="Multi"          value={t.allowsMultiple ?? false} onColor="#a78bfa" />
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: t.active ? '#22c55e' : '#4b5563', boxShadow: t.active ? '0 0 6px #22c55e99' : 'none' }} />
                      <span style={{ fontSize: 13, color: t.active ? '#d1d5db' : '#6b7280' }}>{t.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  {/* Edit */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => setModal({ mode: 'edit', type: t })}
                      style={{ padding: '5px 16px', fontSize: 12, fontWeight: 600, color: '#e5e7eb', background: '#1c1c1c', border: '1px solid #374151', borderRadius: 7, cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#252525'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1c1c1c'; }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>No participation types match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer count */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#22c55e' }}>●</span> System Live Sync
        </div>
        <div>{types.filter(t => t.active).length} active · {types.length} total</div>
      </div>

      {modal && <TypeModal mode={modal.mode} type={modal.type} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
};

export default ParticipationTypesSection;
