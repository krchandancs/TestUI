// src/components/Config/Users/RoleDictionary.tsx
// Two-panel layout: category groups left, permissions/clients/cheat-sheet right
// Matches FlagManager design language using pathscribe.css classes

import React, { useState, useEffect, useMemo } from 'react';
import '../../../pathscribe.css';
import {
  ACTION_GROUPS, DEFAULT_ROLE_PERMISSIONS,
  ActionId, PermissionSet,
} from '../../../constants/systemActions';
import { loadParticipationTypes } from '../System/ParticipationTypesSection';
import { roleService, auditService } from '../../../services';
import {
  overlay, modalBox, modalHeaderStyle, modalFooterStyle,
  cancelButtonStyle, applyButtonStyle,
} from '../../Common/modalStyles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  caseAccess: boolean;
  canViewPediatric: boolean;
  configAccess: boolean;
  permissions: PermissionSet;
  builtIn: boolean;
  clientIds?: string[];
  participationTypeIds: string[];
}

export const DEFAULT_PARTICIPATION: Record<string, string[]> = {
  pathologist: ['primary', 'consultant', 'second_opinion', 'frozen_section'],
  resident:    ['grossing', 'preliminary_report', 'observer'],
  admin:       [],
  physician:   [],
};

export const DEFAULT_ROLES: Role[] = [
  { id: 'pathologist', name: 'Pathologist', description: 'Licensed pathologist with full clinical case access and sign-out authority.',   color: '#8AB4F8', caseAccess: true,  configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Pathologist'],canViewPediatric: false, builtIn: true, participationTypeIds: DEFAULT_PARTICIPATION['pathologist'] },
  { id: 'resident',    name: 'Resident',    description: 'Pathology resident with case access and co-sign capability.',                    color: '#81C995', caseAccess: true,  configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Resident'], canViewPediatric: false,   builtIn: true, participationTypeIds: DEFAULT_PARTICIPATION['resident']    },
  { id: 'admin',       name: 'Admin',       description: 'System administrator with configuration access but no clinical case access.',    color: '#FDD663', caseAccess: false, configAccess: true,  permissions: DEFAULT_ROLE_PERMISSIONS['Admin'], canViewPediatric: false,      builtIn: true, participationTypeIds: []                                        },
  { id: 'physician',   name: 'Physician',   description: 'External ordering physician. Directory only — no app access.',                   color: '#C084FC', caseAccess: false, configAccess: false, permissions: DEFAULT_ROLE_PERMISSIONS['Physician'],canViewPediatric: false,   builtIn: true, participationTypeIds: []                                        },
];

// Mock client list — replace with clientService.getAll() when wired
const MOCK_CLIENTS = [
  { id: 'client_hosp_001', name: 'Phoenix Memorial Hospital' },
  { id: 'client_hosp_002', name: 'Desert Valley Medical Center' },
  { id: 'client_hosp_003', name: 'Scottsdale Regional Health' },
  { id: 'client_hosp_004', name: 'Mesa General Hospital' },
  { id: 'client_lab_001',  name: 'Southwest Reference Laboratory' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  padding: '9px 12px', fontSize: 13, color: '#e5e7eb',
  background: '#0f0f0f', border: '1px solid #374151',
  borderRadius: 7, outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TriState = 'all' | 'some' | 'none';

function groupTriState(groupIds: ActionId[], permissions: PermissionSet): TriState {
  const granted = groupIds.filter(id => permissions[id]).length;
  if (granted === 0) return 'none';
  if (granted === groupIds.length) return 'all';
  return 'some';
}

// ─── TriCheckbox ──────────────────────────────────────────────────────────────
const TriCheckbox: React.FC<{ state: TriState; onClick: (e: React.MouseEvent) => void; size?: number }> = ({ state, onClick, size = 16 }) => (
  <div
    onClick={onClick}
    style={{
      width: size, height: size, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${state === 'none' ? '#374151' : '#8AB4F8'}`,
      background: state === 'all' ? '#8AB4F8' : state === 'some' ? 'rgba(138,180,248,0.2)' : 'transparent',
      transition: 'all 0.15s',
    }}
  >
    {state === 'all'  && <span style={{ color: '#0d1117', fontSize: size * 0.6, fontWeight: 900 }}>✓</span>}
    {state === 'some' && <span style={{ color: '#8AB4F8', fontSize: size * 0.75, fontWeight: 900, lineHeight: 1 }}>—</span>}
  </div>
);

// ─── RoleModal ────────────────────────────────────────────────────────────────
const RoleModal: React.FC<{
  mode: 'add' | 'edit';
  role?: Role;
  onSave: (draft: Omit<Role, 'id'>) => void;
  onClose: () => void;
}> = ({ mode, role, onSave, onClose }) => {
  const [draft, setDraft] = useState<Omit<Role, 'id'>>({
    name: role?.name ?? '',
    description: role?.description ?? '',
    color: role?.color ?? '#8AB4F8',
    caseAccess: role?.caseAccess ?? false,
    canViewPediatric: (role as any)?.canViewPediatric ?? false,
    configAccess: role?.configAccess ?? false,
    permissions: role?.permissions ?? {},
    builtIn: role?.builtIn ?? false,
    clientIds: role?.clientIds ?? [],
    participationTypeIds: role?.participationTypeIds ?? [],
  });


  const [activeTab,       setActiveTab]       = useState<'permissions' | 'clients' | 'participation' | 'cheatsheet'>('permissions');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(ACTION_GROUPS[0].id);
  const [search,          setSearch]          = useState('');
  const [cheatSearch,     setCheatSearch]     = useState('');

  const allClients = !draft.clientIds || draft.clientIds.length === 0;

  const selectedGroup = ACTION_GROUPS.find(g => g.id === selectedGroupId) ?? ACTION_GROUPS[0];
  const groupIds = selectedGroup.actions.map(a => a.id);
  const groupState = groupTriState(groupIds, draft.permissions);

  const filteredActions = search
    ? selectedGroup.actions.filter(a =>
        a.label.toLowerCase().includes(search.toLowerCase()) ||
        (a.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : selectedGroup.actions;

  const toggleGroupAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = groupState !== 'all';
    const next = { ...draft.permissions };
    groupIds.forEach(id => { next[id] = newVal; });
    setDraft(d => ({ ...d, permissions: next }));
  };

  const toggleAction = (id: ActionId) => {
    setDraft(d => ({ ...d, permissions: { ...d.permissions, [id]: !d.permissions[id] } }));
  };

  const toggleClient = (clientId: string) => {
    const current = draft.clientIds ?? [];
    const next = current.includes(clientId)
      ? current.filter(c => c !== clientId)
      : [...current, clientId];
    setDraft(d => ({ ...d, clientIds: next }));
  };

  // Cheat sheet — all actions across all groups filtered by search
  const cheatActions = useMemo(() => {
    const all = ACTION_GROUPS.flatMap(g => g.actions.map(a => ({ ...a, groupTitle: g.title })));
    if (!cheatSearch) return all;
    const q = cheatSearch.toLowerCase();
    return all.filter(a =>
      a.label.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.groupTitle.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }, [cheatSearch]);

  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
  };

  const permCount = Object.values(draft.permissions).filter(Boolean).length;
  const totalActions = ACTION_GROUPS.reduce((n, g) => n + g.actions.length, 0);

  return (
    <div data-capture-hide="true" style={{ ...overlay, alignItems: 'flex-start', overflowY: 'auto', padding: '32px 0' }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...modalBox,
          width: 'min(1080px, 96vw)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0d1117',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ ...modalHeaderStyle, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
              {mode === 'add' ? 'New Role' : 'Edit Role'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Role name"
                style={{ ...INPUT, width: 200, fontSize: 16, fontWeight: 700, padding: '6px 10px' }}
              />
              <input
                type="color"
                value={draft.color}
                onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none' }}
                title="Badge colour"
              />
              <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, fontWeight: 700, background: draft.color + '22', color: draft.color, border: `1px solid ${draft.color}44` }}>
                {draft.name || 'Preview'}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{permCount} / {totalActions} actions granted</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Description + access toggles */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Role description"
            style={{ ...INPUT, flex: 1, minWidth: 200 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
            <input type="checkbox" checked={draft.caseAccess} onChange={e => setDraft(d => ({ ...d, caseAccess: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#8AB4F8', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Case Access</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
            <input type="checkbox" checked={draft.configAccess} onChange={e => setDraft(d => ({ ...d, configAccess: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#8AB4F8', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Config Access</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0,
            padding: '4px 10px', borderRadius: 6,
            background: (draft as any).canViewPediatric ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${(draft as any).canViewPediatric ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.12)'}`,
          }}>
            <input type="checkbox"
              checked={(draft as any).canViewPediatric ?? false}
              onChange={e => setDraft(d => ({ ...d, canViewPediatric: e.target.checked } as any))}
              style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: (draft as any).canViewPediatric ? '#f59e0b' : '#9ca3af', fontWeight: 600 }}>
              Pediatric Access
            </span>
          </label>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, padding: '0 24px' }}>
          {([
            { id: 'permissions',   label: `Permissions (${permCount})` },
            { id: 'clients',       label: `Client Access (${allClients ? 'All' : (draft.clientIds?.length ?? 0)})` },
            { id: 'participation', label: `Case Participation (${draft.participationTypeIds?.length ?? 0})` },
            { id: 'cheatsheet',    label: 'Action Reference' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#8AB4F8' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #8AB4F8' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* ── PERMISSIONS TAB ── */}
          {activeTab === 'permissions' && (
            <>
              {/* Left — category list */}
              <div style={{
                width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
                overflowY: 'auto', background: 'rgba(255,255,255,0.01)', padding: '10px 0',
              }}>
                {ACTION_GROUPS.map(g => {
                  const gIds = g.actions.map(a => a.id);
                  const granted = gIds.filter(id => draft.permissions[id]).length;
                  const isActive = g.id === selectedGroupId;
                  const ts = groupTriState(gIds, draft.permissions);
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 16px', cursor: 'pointer',
                        background: isActive ? 'rgba(138,180,248,0.08)' : 'transparent',
                        borderLeft: `3px solid ${isActive ? '#8AB4F8' : 'transparent'}`,
                        transition: 'all 0.1s',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#e5e7eb' : '#9ca3af' }}>
                        {g.title}
                      </span>
                      {/* Mini progress */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, minWidth: 28, textAlign: 'right',
                        color: ts === 'all' ? '#22c55e' : ts === 'some' ? '#8AB4F8' : '#374151',
                      }}>
                        {granted}/{gIds.length}
                      </span>
                      <div style={{ width: 28, height: 3, background: '#1f2937', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', borderRadius: 999, transition: 'width 0.3s',
                          width: `${Math.round(granted / gIds.length * 100)}%`,
                          background: ts === 'all' ? '#22c55e' : '#8AB4F8',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right — action list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Group header + search */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <TriCheckbox state={groupState} onClick={toggleGroupAll} size={18} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', flex: 1 }}>{selectedGroup.title}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    {groupIds.filter(id => draft.permissions[id]).length} / {groupIds.length} granted
                  </span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter actions…"
                    style={{ ...INPUT, width: 180, fontSize: 12, padding: '6px 10px' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                  {filteredActions.map(action => {
                    const granted = !!draft.permissions[action.id];
                    return (
                      <div
                        key={action.id}
                        onClick={() => toggleAction(action.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 10px', borderRadius: 8, cursor: 'pointer',
                          marginBottom: 2,
                          background: granted ? 'rgba(138,180,248,0.06)' : 'transparent',
                          border: `1px solid ${granted ? 'rgba(138,180,248,0.15)' : 'transparent'}`,
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { if (!granted) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (!granted) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                          border: `2px solid ${granted ? '#8AB4F8' : '#374151'}`,
                          background: granted ? '#8AB4F8' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {granted && <span style={{ color: '#0d1117', fontSize: 10, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: granted ? '#e5e7eb' : '#9ca3af' }}>
                              {action.label}
                            </span>
                            {action.prebuilt && (
                              <span style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', border: '1px solid #374151', borderRadius: 4, padding: '1px 5px' }}>future</span>
                            )}
                            {action.shortcutable && (
                              <span style={{ fontSize: 9, color: '#1d4ed8', background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: 4, padding: '1px 5px' }}>shortcutable</span>
                            )}
                          </div>
                          {action.description && (
                            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, lineHeight: 1.4 }}>
                              {action.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredActions.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#374151', fontSize: 13 }}>
                      No actions match "{search}"
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── CLIENT ACCESS TAB ── */}
          {activeTab === 'clients' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
                Control which hospital clients this role can access. Set to <strong style={{ color: '#e5e7eb' }}>All Clients</strong> for enterprise-wide access, or restrict to specific hospitals for multi-site deployments.
              </p>

              {/* All clients toggle */}
              <div
                onClick={() => setDraft(d => ({ ...d, clientIds: allClients ? [MOCK_CLIENTS[0].id] : [] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer', marginBottom: 16,
                  background: allClients ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${allClients ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${allClients ? '#22c55e' : '#374151'}`,
                  background: allClients ? '#22c55e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {allClients && <span style={{ color: '#0d1117', fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: allClients ? '#22c55e' : '#e5e7eb' }}>All Clients</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>This role has access to cases and data from all hospital clients</div>
                </div>
              </div>

              {/* Individual clients */}
              {!allClients && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Select Specific Clients
                  </div>
                  {MOCK_CLIENTS.map(client => {
                    const selected = (draft.clientIds ?? []).includes(client.id);
                    return (
                      <div
                        key={client.id}
                        onClick={() => toggleClient(client.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          background: selected ? 'rgba(138,180,248,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selected ? 'rgba(138,180,248,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.12s',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${selected ? '#8AB4F8' : '#374151'}`,
                          background: selected ? '#8AB4F8' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <span style={{ color: '#0d1117', fontSize: 9, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#e5e7eb' : '#9ca3af' }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>{client.id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!allClients && (draft.clientIds ?? []).length === 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                  ⚠ No clients selected — this role will have no data access. Select at least one client or switch to All Clients.
                </div>
              )}
            </div>
          )}

          {/* ── CASE PARTICIPATION TAB ── */}
          {activeTab === 'participation' && (() => {
            const allTypes = loadParticipationTypes().filter(t => t.active);
            const selectedIds = draft.participationTypeIds ?? [];
            const toggle = (id: string) => setDraft(d => ({
              ...d,
              participationTypeIds: selectedIds.includes(id)
                ? selectedIds.filter(x => x !== id)
                : [...selectedIds, id],
            }));
            return (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 1.6 }}>
                  Select which participation types staff with this role can serve as on a case.
                  Participation types are defined in <strong style={{ color: '#e5e7eb' }}>System → Participation Types</strong>.
                </p>
                {!draft.caseAccess && (
                  <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 12 }}>
                    ⚠ This role has no Case Access — participation types will have no effect until Case Access is enabled.
                  </div>
                )}
                {allTypes.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
                    No active participation types defined yet.<br />
                    <span style={{ color: '#6b7280' }}>Go to System → Participation Types to add some.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                    {allTypes.map(t => {
                      const selected = selectedIds.includes(t.id);
                      return (
                        <div key={t.id} onClick={() => toggle(t.id)} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px',
                          borderRadius: 10, cursor: 'pointer', transition: 'all 0.12s',
                          background: selected ? 'rgba(138,180,248,0.06)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${selected ? 'rgba(138,180,248,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                          onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        >
                          {/* Checkbox */}
                          <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2, border: `2px solid ${selected ? '#8AB4F8' : '#374151'}`, background: selected ? '#8AB4F8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {selected && <span style={{ color: '#0d1117', fontSize: 10, fontWeight: 900 }}>✓</span>}
                          </div>
                          {/* Chip */}
                          <div style={{ paddingTop: 1 }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.color + '22', color: t.color, border: `1px solid ${t.color}44`, whiteSpace: 'nowrap' }}>
                              {t.abbreviation}
                            </span>
                          </div>
                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#e5e7eb' : '#9ca3af', marginBottom: 4 }}>{t.label}</div>
                            {t.description && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{t.description}</div>}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {[
                                { label: 'Can Finalise',       value: t.canFinalize,           onColor: '#22c55e' },
                                { label: 'Countersign Req.',   value: t.requiresCountersign,   onColor: '#f59e0b' },
                                { label: 'Template Assign.',   value: t.canBeAssignedTemplate, onColor: '#8AB4F8' },
                                { label: 'Full Case View',     value: t.canViewWholeCase,      onColor: '#8AB4F8' },
                              ].map(attr => (
                                <span key={attr.label} style={{
                                  fontSize: 10, padding: '1px 7px', borderRadius: 5, fontWeight: 600,
                                  background: attr.value ? attr.onColor + '18' : 'rgba(255,255,255,0.04)',
                                  color: attr.value ? attr.onColor : '#4b5563',
                                  border: `1px solid ${attr.value ? attr.onColor + '33' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                  {attr.value ? '✓' : '—'} {attr.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ marginTop: 16, fontSize: 12, color: '#4b5563' }}>
                  {selectedIds.length} of {allTypes.length} participation types selected for this role
                </div>
              </div>
            );
          })()}

          {/* ── CHEAT SHEET TAB ── */}
          {activeTab === 'cheatsheet' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <input
                  autoFocus
                  value={cheatSearch}
                  onChange={e => setCheatSearch(e.target.value)}
                  placeholder="Search actions by name, description, category, or ID…"
                  style={{ ...INPUT, fontSize: 13 }}
                />
                <div style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>
                  {cheatActions.length} of {ACTION_GROUPS.reduce((n, g) => n + g.actions.length, 0)} actions shown
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {cheatActions.map(action => {
                  const granted = !!draft.permissions[action.id];
                  return (
                    <div key={action.id} style={{
                      padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                      background: granted ? 'rgba(138,180,248,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${granted ? 'rgba(138,180,248,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: action.description ? 4 : 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                          {action.groupTitle}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: granted ? '#e5e7eb' : '#9ca3af', flex: 1 }}>
                          {action.label}
                        </span>
                        {granted && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 4, padding: '1px 7px', flexShrink: 0 }}>
                            ✓ Granted
                          </span>
                        )}
                        {action.prebuilt && (
                          <span style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', border: '1px solid #1f2937', borderRadius: 4, padding: '1px 5px' }}>future</span>
                        )}
                        {action.shortcutable && (
                          <span style={{ fontSize: 9, color: '#1d4ed8', background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)', borderRadius: 4, padding: '1px 5px' }}>shortcutable</span>
                        )}
                      </div>
                      {action.description && (
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, paddingLeft: 0 }}>
                          {action.description}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#374151', marginTop: 4, fontFamily: 'monospace' }}>
                        {action.id} · {action.internalKey}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ ...modalFooterStyle, padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#4b5563' }}>
            {permCount} permissions · {allClients ? 'All clients' : `${(draft.clientIds ?? []).length} client(s)`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={cancelButtonStyle} onClick={onClose}>Cancel</button>
            <button style={{ ...applyButtonStyle, opacity: !draft.name.trim() ? 0.5 : 1 }} onClick={handleSave}>
              {mode === 'add' ? 'Add Role' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main RoleDictionary ──────────────────────────────────────────────────────
const RoleDictionary: React.FC<{ onRolesChange?: (roles: Role[]) => void }> = ({ onRolesChange }) => {
  const [roles,   setRoles]   = useState<Role[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState<{ mode: 'add' | 'edit'; role?: Role } | null>(null);

  useEffect(() => {
    roleService.getAll().then(res => {
      if (res.ok) {
        const mapped = res.data.map(r => ({
          ...r,
          canViewPediatric: (r as any).canViewPediatric ?? false,
          participationTypeIds: r.participationTypeIds ?? [],
        })) as Role[];
        setRoles(mapped); onRolesChange?.(mapped);
      }
      else { onRolesChange?.(DEFAULT_ROLES); }
      setLoading(false);
    });
  }, []);

  const filtered = roles.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (draft: Omit<Role, 'id'>) => {
    if (modal?.mode === 'add') {
      const res = await roleService.add({ ...draft, builtIn: false });
      if (res.ok) {
        const next = [...roles, res.data as Role];
        setRoles(next); onRolesChange?.(next);
      }
    } else if (modal?.role) {
      const res = await roleService.update(modal.role.id, draft);
      if (res.ok) {
        const next = roles.map(r => r.id === res.data.id ? res.data as unknown as Role : r);
        setRoles(next);
        onRolesChange?.(next);
        // Audit: log if Pediatric Access permission changed
        const prevPed = (modal.role as any)?.canViewPediatric ?? false;
        const newPed  = (draft as any)?.canViewPediatric ?? false;
        if (prevPed !== newPed) {
          auditService.logEvent({
            type: 'system',
            event: newPed ? 'Pediatric Access Granted' : 'Pediatric Access Revoked',
            detail: `Pediatric Access ${newPed ? 'enabled' : 'disabled'} on role "${draft.name}" by administrator.`,
            user: 'System Admin',
            caseId: null,
            confidence: null,
          }).catch(() => {});
        }
      }
    }
    setModal(null);
  };

  const totalActions = ACTION_GROUPS.reduce((n, g) => n + g.actions.length, 0);
  const permCount = (r: Role) => Object.values(r.permissions).filter(Boolean).length;

  if (loading) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Loading roles…</div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Role Dictionary</h2>
          <p style={{ fontSize: 14, color: '#9AA0A6' }}>Define roles, permissions, and client access scopes.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          style={{ padding: '8px 16px', background: '#8AB4F8', color: '#0d1117', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6a9de0'}
          onMouseLeave={e => e.currentTarget.style.background = '#8AB4F8'}
        >+ Add Role</button>
      </div>

      <input type="text" placeholder="Search roles…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ padding: '9px 12px', fontSize: 13, color: '#e5e7eb', background: '#0f0f0f', border: '1px solid #374151', borderRadius: 7, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 16 }} />

      <div style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1117' }}>
              {['Role', 'Description', 'Case Access', 'Config Access', 'Clients', 'Permissions', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((role, i) => {
              const allClients = !role.clientIds || role.clientIds.length === 0;
              const pct = Math.round(permCount(role) / totalActions * 100);
              return (
                <tr key={role.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}44` }}>{role.name}</span>
                      {role.builtIn && <span style={{ fontSize: 10, color: '#4b5563' }}>built-in</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#9AA0A6', maxWidth: 220 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{role.description}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: role.caseAccess ? '#22c55e' : '#374151' }}>{role.caseAccess ? '✓ Yes' : '— No'}</span>
                    {(role as any).canViewPediatric && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        Peds
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: role.configAccess ? '#22c55e' : '#374151' }}>{role.configAccess ? '✓ Yes' : '— No'}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, color: allClients ? '#22c55e' : '#8AB4F8', fontWeight: 600 }}>
                      {allClients ? '🌐 All' : `${role.clientIds?.length} client${(role.clientIds?.length ?? 0) !== 1 ? 's' : ''}`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 80, height: 4, background: '#1f2937', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: role.color, width: `${pct}%`, borderRadius: 999, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{permCount(role)}/{totalActions}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setModal({ mode: 'edit', role })}
                      style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#DEE4E7' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && <RoleModal mode={modal.mode} role={modal.role} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
};

export default RoleDictionary;
