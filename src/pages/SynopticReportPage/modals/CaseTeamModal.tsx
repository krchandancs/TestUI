// src/pages/SynopticReportPage/modals/CaseTeamModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Case Team modal — drag staff cards onto participation type drop zones.
// Left: participation type lanes (drop targets)
// Right: staff directory (draggable cards)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Case }    from '@/types/case/Case';

interface CaseParticipant {
  staffId: string;
  staffName: string;
  externalId?: string;
  externalIdType?: 'GMC' | 'NPI';
  source: 'system' | 'manual';
  participationTypeIds: string[];
  addedBy: string;
  addedAt: string;
  status: 'active' | 'removed';
}
import { mockCaseService }               from '@/services/cases/mockCaseService';
import { userService, roleService }      from '@/services';
import { loadParticipationTypes, ParticipationType } from '@/components/Config/System/ParticipationTypesSection';
import type { StaffUser }                from '@/services/users/IUserService';
import type { Role }                     from '@/services/roles/IRoleService';
import { useAuth }                       from '@/contexts/AuthContext';

// ─── Draggable staff card ─────────────────────────────────────────────────────

interface StaffCardProps {
  staff:       StaffUser;
  roles:       Role[];
  allTypes:    ParticipationType[];
  disabled?:   boolean;
  isDragging?: boolean;
}

const StaffCard: React.FC<StaffCardProps & { id: string }> = ({ id, staff, roles, allTypes, disabled, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, disabled });
  const staffRoles   = roles.filter(r => staff.roles.includes(r.name));
  const allowedTypeIds = new Set(staffRoles.flatMap(r => (r as any).participationTypeIds ?? []));
  const allowedTypes = allTypes.filter(t => allowedTypeIds.has(t.id));

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 12px',
        background: isDragging ? 'rgba(138,180,248,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isDragging ? 'rgba(138,180,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, cursor: disabled ? 'default' : 'grab',
        opacity: disabled ? 0.4 : 1,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        userSelect: 'none', touchAction: 'none',
        transition: isDragging ? 'none' : 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(138,180,248,0.15)', border: '1.5px solid rgba(138,180,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#8AB4F8',
        }}>
          {`${staff.firstName[0]}${staff.lastName[0]}`}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{staff.firstName} {staff.lastName}</div>
          <div style={{ fontSize: 11, color: '#cbd5e1' }}>{staff.roles.join(', ')} · {staff.department}</div>
        </div>
        {!disabled && <div style={{ fontSize: 16, color: '#374151', flexShrink: 0, cursor: 'grab' }}>⠿</div>}
        {disabled  && <span style={{ fontSize: 10, color: '#22c55e', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', flexShrink: 0 }}>on case</span>}
      </div>
      {allowedTypes.length > 0 && !disabled && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3, marginTop: 6 }}>
          {allowedTypes.map(t => (
            <span key={t.id} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: t.color + '18', color: t.color, border: `1px solid ${t.color}33` }}>
              {t.abbreviation}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Drop zone (participation type lane) ──────────────────────────────────────

interface DropZoneProps {
  type:          ParticipationType;
  participants:  CaseParticipant[];
  currentUserId: string;
  isOver:        boolean;
  onRemove:      (staffId: string, typeId: string) => void;
  onUndoRemove:  (staffId: string, typeId: string) => void;
  removedKeys:   Set<string>;
  onDelegate?:   () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  type, participants, currentUserId, isOver, onRemove, onUndoRemove, removedKeys, onDelegate,
}) => {
  const { setNodeRef } = useDroppable({ id: `type-${type.id}` });
  const inType = participants.filter(p => p.status === 'active' && p.participationTypeIds.includes(type.id));

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 10, padding: 12,
        background: isOver ? type.color + '12' : 'rgba(255,255,255,0.02)',
        border: `2px ${isOver ? 'solid' : 'dashed'} ${isOver ? type.color + '66' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.15s', minHeight: 80,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: type.color + '22', color: type.color, border: `1px solid ${type.color}44` }}>{type.abbreviation}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', flex: 1 }}>{type.label}</span>
        {type.requiresCountersign && <span style={{ fontSize: 10, color: '#f59e0b', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)' }}>Countersign req.</span>}
        {type.canFinalize        && <span style={{ fontSize: 10, color: '#22c55e', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.2)',   background: 'rgba(34,197,94,0.06)' }}>Can finalise</span>}
      </div>

      {inType.length === 0 && (
        <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, color: isOver ? type.color : '#475569', fontStyle: 'italic' }}>
          {isOver ? 'Drop to assign' : 'Drag staff here'}
        </div>
      )}

      <div className="ps-case-team-list">
        {inType.map(p => {
          const removeKey    = `${p.staffId}-${type.id}`;
          const isRemoved    = removedKeys.has(removeKey);
          const isSelf       = p.staffId === currentUserId;
          const isPrimary    = type.id === 'primary';
          const isOnlyPrimary = isPrimary && inType.length === 1;

          return (
            <div key={removeKey} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
              background: isRemoved ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isRemoved ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
              opacity: isRemoved ? 0.7 : 1, transition: 'all 0.2s',
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(138,180,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#8AB4F8' }}>
                {p.staffName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: 12, color: isRemoved ? '#8a9db5' : '#e5e7eb', flex: 1, textDecoration: isRemoved ? 'line-through' : 'none' }}>
                {p.staffName}
                {isSelf         && <span style={{ fontSize: 10, color: '#8AB4F8', marginLeft: 5 }}>(you)</span>}
                {p.source === 'system' && <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 5 }}>· auto</span>}
              </span>

              {isRemoved ? (
                <button onClick={() => onUndoRemove(p.staffId!, type.id)}
                  style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(138,180,248,0.3)', background: 'transparent', color: '#8AB4F8', cursor: 'pointer' }}>
                  Undo
                </button>
              ) : isSelf && isOnlyPrimary ? (
                <button onClick={() => onDelegate?.()}
                  title="Removing yourself from Primary requires Delegate — click to open"
                  style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', cursor: 'pointer', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Delegate
                </button>
              ) : (
                <button onClick={() => onRemove(p.staffId!, type.id)} title="Remove from this participation type"
                  style={{ padding: '3px 6px', borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Self-removal blocked modal ───────────────────────────────────────────────

const SelfRemoveBlockedModal: React.FC<{ onClose: () => void; onDelegate: () => void }> = ({ onClose, onDelegate }) => (
  <div className="ps-overlay" style={{ zIndex: 30000 }}>
    <div className="ps-modal-dark" style={{ width: 'min(460px, 90vw)' }}>
      <div className="ps-modal-dark-header">
        <span style={{ fontSize: 18 }}>⚠</span>
        <span className="ps-modal-dark-title">Cannot Remove Primary</span>
      </div>
      <p className="ps-modal-dark-body">
        Removing yourself from <strong style={{ color: '#e2e8f0' }}>Primary</strong> is not allowed while you are the sole primary pathologist on this case.
      </p>
      <p className="ps-modal-dark-hint">
        To transfer ownership of this case to another pathologist or pool, use <strong style={{ color: '#e2e8f0' }}>Delegate</strong>.
      </p>
      <div className="ps-modal-dark-footer">
        <button className="ps-btn-ghost-dark" onClick={onClose}>Cancel</button>
        <button onClick={onDelegate} style={{ padding: '8px 18px', background: '#0891B2', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Open Delegate →
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  caseData:    Case;
  onClose:     () => void;
  onUpdated:   (updated: Case) => void;
  onDelegate?: () => void;
}

export const CaseTeamModal: React.FC<Props> = ({ caseData, onClose, onUpdated, onDelegate }) => {
  const { user } = useAuth();
  const [staffList,    setStaffList]    = useState<StaffUser[]>([]);
  const [roles,        setRoles]        = useState<Role[]>([]);
  const [allTypes,     setAllTypes]     = useState<ParticipationType[]>([]);
  const [participants, setParticipants] = useState<CaseParticipant[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [overId,       setOverId]       = useState<string | null>(null);
  const [removedKeys,  setRemovedKeys]  = useState<Set<string>>(new Set());
  const [showSelfBlock,setShowSelfBlock]= useState(false);
  const undoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    Promise.all([userService.getAll(), roleService.getAll()]).then(([usersRes, rolesRes]) => {
      const users     = usersRes.ok ? usersRes.data : [];
      const rolesData = rolesRes.ok ? rolesRes.data : [];
      setStaffList(users);
      setRoles(rolesData);
      const types    = loadParticipationTypes().filter((t: ParticipationType) => t.active);
      setAllTypes(types);
      const existing: CaseParticipant[] = (caseData as any).participants ?? [];
      const assignedId = caseData.order?.assignedTo;
      if (assignedId && !existing.find(p => p.staffId === assignedId && p.status === 'active')) {
        const staffMember = users.find(u => u.id === assignedId);
        if (staffMember) {
          const autoP: CaseParticipant = {
            staffId: staffMember.id,
            staffName: `${staffMember.firstName} ${staffMember.lastName}`,
            externalId: (staffMember as any).gmcNumber || staffMember.npi || undefined,
            externalIdType: (staffMember as any).gmcNumber ? 'GMC' : staffMember.npi ? 'NPI' : undefined,
            source: 'system', participationTypeIds: ['primary'],
            addedBy: 'system', addedAt: caseData.createdAt, status: 'active',
          };
          const merged = [autoP, ...existing];
          setParticipants(merged);
          mockCaseService.updateCase(caseData.id, { participants: merged } as any);
        } else { setParticipants(existing); }
      } else { setParticipants(existing); }
      setLoading(false);
    });
    return () => { Object.values(undoTimers.current).forEach(clearTimeout); };
  }, []);

  const relevantTypeIds = useMemo(() => {
    const ids = new Set<string>();
    participants.filter(p => p.status === 'active').forEach(p => p.participationTypeIds.forEach((id: string) => ids.add(id)));
    staffList.filter(s => s.status === 'Active').forEach(s => {
      const staffRoles = roles.filter(r => s.roles.includes(r.name));
      staffRoles.flatMap(r => (r as any).participationTypeIds ?? []).forEach((id: string) => ids.add(id));
    });
    return ids;
  }, [staffList, roles, participants]);

  const visibleTypes  = useMemo(() => allTypes.filter(t => relevantTypeIds.has(t.id)), [allTypes, relevantTypeIds]);
  const filteredStaff = useMemo(() =>
    staffList
      .filter(s => s.status === 'Active')
      .filter(s => !search || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [staffList, search]
  );

  const activeParticipants = participants.filter(p => p.status === 'active');
  const staffOnCase        = new Set(activeParticipants.map(p => p.staffId));

  const handleDragStart = (event: DragStartEvent) => { setActiveId(String(event.active.id)); };
  const handleDragOver  = (event: any)             => { setOverId(event.over ? String(event.over.id) : null); };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null); setOverId(null);
    const { active, over } = event;
    if (!over) return;
    const staffId = String(active.id).replace('staff-', '');
    const typeId  = String(over.id).replace('type-', '');
    const staff   = staffList.find(s => s.id === staffId);
    const type    = allTypes.find(t => t.id === typeId);
    if (!staff || !type) return;
    const staffRoles = roles.filter(r => staff.roles.includes(r.name));
    const allowedIds = new Set(staffRoles.flatMap(r => (r as any).participationTypeIds ?? []));
    if (!allowedIds.has(typeId)) return;
    const alreadyAssigned = activeParticipants.find(p => p.staffId === staffId && p.participationTypeIds.includes(typeId));
    if (alreadyAssigned) return;

    let updated: CaseParticipant[];
    let newP: CaseParticipant | null = null;
    const existingP = activeParticipants.find(p => p.staffId === staffId);
    if (existingP) {
      updated = participants.map(p =>
        p.staffId === staffId && p.status === 'active'
          ? { ...p, participationTypeIds: [...p.participationTypeIds, typeId] } : p
      );
    } else {
      newP = {
        staffId: staff.id, staffName: `${staff.firstName} ${staff.lastName}`,
        externalId: (staff as any).gmcNumber || staff.npi || undefined,
        externalIdType: (staff as any).gmcNumber ? 'GMC' : staff.npi ? 'NPI' : undefined,
        source: 'manual', participationTypeIds: [typeId],
        addedBy: user?.id ?? 'unknown', addedAt: new Date().toISOString(), status: 'active',
      };
      updated = [...participants, newP];
    }
    setParticipants(updated);
    await mockCaseService.updateCase(caseData.id, { participants: updated } as any);
    onUpdated({ ...caseData, participants: updated } as any);
  };

  const handleRemove = (staffId: string, typeId: string) => {
    const isSelf        = staffId === user?.id;
    const isPrimary     = typeId === 'primary';
    const primaryCount  = activeParticipants.filter(p => p.participationTypeIds.includes('primary')).length;
    if (isSelf && isPrimary && primaryCount <= 1) { setShowSelfBlock(true); return; }

    const key = `${staffId}-${typeId}`;
    setRemovedKeys(prev => new Set(prev).add(key));
    undoTimers.current[key] = setTimeout(async () => {
      const updated = participants.map(p => {
        if (p.staffId !== staffId || p.status !== 'active') return p;
        const newTypes = p.participationTypeIds.filter((id: string) => id !== typeId);
        return newTypes.length === 0 ? { ...p, status: 'removed' as const } : { ...p, participationTypeIds: newTypes };
      });
      setParticipants(updated);
      setRemovedKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
      await mockCaseService.updateCase(caseData.id, { participants: updated } as any);
      onUpdated({ ...caseData, participants: updated } as any);
      delete undoTimers.current[key];
    }, 5000);
  };

  const handleUndoRemove = (staffId: string, typeId: string) => {
    const key = `${staffId}-${typeId}`;
    clearTimeout(undoTimers.current[key]);
    delete undoTimers.current[key];
    setRemovedKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
  };

  const draggingStaff = activeId ? staffList.find(s => `staff-${s.id}` === activeId) : null;

  return (
    <>
      {/* ── Modal shell uses fm-overlay + ps-research-modal pattern ── */}
      <div className="ps-overlay" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: 960, height: '88vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }} className="ps-research-modal">

          {/* Header */}
          <div className="ps-research-header">
            <div>
              <div className="fm-eyebrow">Case Team</div>
              <div className="fm-title-row">
                <h2 className="fm-title">{caseData.accession?.fullAccession ?? caseData.id}</h2>
              </div>
              <div style={{ fontSize: 12, color: '#8a9db5', marginTop: 2 }}>
                {caseData.patient ? `${caseData.patient.lastName}, ${caseData.patient.firstName}` : ''}
                {' · '}
                <span style={{ color: '#64748b' }}>Drag staff cards onto participation types to assign · Removing yourself from Primary requires </span>
                <span onClick={() => { onDelegate?.(); }} style={{ color: '#0891B2', cursor: 'pointer', textDecoration: 'underline' }}>Delegate</span>
              </div>
            </div>
            <button className="ps-research-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Body */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0, overflow: 'hidden' }}>

              {/* LEFT — drop zones */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="fm-eyebrow" style={{ marginBottom: 4 }}>Participation Types</div>
                {loading ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading…</div>
                ) : visibleTypes.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13, border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    No participation types configured. Set up types in System → Participation Types.
                  </div>
                ) : visibleTypes.map(type => (
                  <DropZone
                    key={type.id} type={type} participants={participants}
                    currentUserId={user?.id ?? ''} isOver={overId === `type-${type.id}`}
                    onRemove={handleRemove} onUndoRemove={handleUndoRemove}
                    removedKeys={removedKeys} onDelegate={() => { onClose(); onDelegate?.(); }}
                  />
                ))}
              </div>

              {/* RIGHT — staff directory */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 16px 10px', flexShrink: 0 }}>
                  <div className="fm-eyebrow" style={{ marginBottom: 8 }}>Staff Directory</div>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff…"
                    className="fm-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredStaff.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 12 }}>No staff found</div>
                  ) : filteredStaff.map(s => {
                    const isOnCase = staffOnCase.has(s.id);
                    return (
                      <StaffCard
                        key={s.id} id={`staff-${s.id}`} staff={s} roles={roles} allTypes={allTypes}
                        disabled={isOnCase} isDragging={activeId === `staff-${s.id}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {draggingStaff && (
                <div style={{ padding: '10px 14px', background: '#1e293b', border: '2px solid #8AB4F8', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', cursor: 'grabbing', opacity: 0.95 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(138,180,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#8AB4F8' }}>
                      {`${draggingStaff.firstName[0]}${draggingStaff.lastName[0]}`}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{draggingStaff.firstName} {draggingStaff.lastName}</div>
                      <div style={{ fontSize: 11, color: '#cbd5e1' }}>{draggingStaff.roles.join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Footer */}
          <div className="fm-footer">
            <span className="fm-footer-status">
              {activeParticipants.length} team member{activeParticipants.length !== 1 ? 's' : ''} · Changes save automatically
            </span>
            <button className="fm-btn-cancel" onClick={onClose}>Close</button>
          </div>

        </div>
      </div>

      {showSelfBlock && (
        <SelfRemoveBlockedModal
          onClose={() => setShowSelfBlock(false)}
          onDelegate={() => { setShowSelfBlock(false); onClose(); onDelegate?.(); }}
        />
      )}
    </>
  );
};

export default CaseTeamModal;
