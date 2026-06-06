import React, { useState, useRef } from 'react';
import { VOICE_PROFILES, type VoiceProfileId } from '../../../constants/voiceProfiles';
import '../../../pathscribe.css';
import { useSubspecialties } from '../../../contexts/useSubspecialties';
import RoleDictionary, { Role, DEFAULT_ROLES } from './RoleDictionary';
import { userService } from '../../../services';
import {
  overlay, modalBox, modalHeaderStyle, modalFooterStyle,
  cancelButtonStyle, applyButtonStyle,
} from '../../Common/modalStyles';
import { ServiceResult } from '../../../services/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  credentials?: string;  // e.g. MD, FCAP / MBChB, FRCPath
  email: string;
  roles: string[];
  npi: string;           // US National Provider Identifier — used for HL7 matching
  gmcNumber?: string;    // UK General Medical Council number — used for HL7 matching
  license: string;
  phone: string;
  department: string;
  signatureUrl?: string;
  status: 'Active' | 'Inactive';
  voiceProfile?: string | null;
  canViewPediatric?: boolean;  // Option C: user-level pediatric qualification flag
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const roleStyle: Record<string, React.CSSProperties> = {
  Pathologist: { color: '#8AB4F8', background: 'rgba(138,180,248,0.15)', border: '1px solid rgba(138,180,248,0.25)' },
  Resident:    { color: '#81C995', background: 'rgba(129,201,149,0.15)', border: '1px solid rgba(129,201,149,0.25)' },
  Admin:       { color: '#FDD663', background: 'rgba(253,214,99,0.12)',  border: '1px solid rgba(253,214,99,0.25)'  },
};
const subBadge: React.CSSProperties = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 999,
  fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 2,
  background: 'rgba(0,163,196,0.1)', color: '#00A3C4',
  border: '1px solid rgba(0,163,196,0.25)',
};
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 };
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' };
const INPUT: React.CSSProperties = { padding: '9px 12px', fontSize: 13, color: '#e5e7eb', background: '#0f0f0f', border: '1px solid #374151', borderRadius: 7, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const ROW: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

function initials(u: StaffUser) { const parts = [u.firstName, (u as any).middleName, u.lastName].filter(Boolean); return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : (parts[0]?.[0] ?? '?').toUpperCase(); }
function fullName(u: StaffUser) { return [u.firstName, (u as any).middleName, u.lastName].filter(Boolean).join(' '); }

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, background: value ? '#22c55e' : '#374151', boxShadow: value ? '0 0 8px #22c55e55' : 'none' }}>
      <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: value ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? '#22c55e' : '#6b7280' }}>{value ? 'Active' : 'Inactive'}</span>
  </div>
);

// ─── Signature Upload ─────────────────────────────────────────────────────────
const SignatureUpload = ({ url, onChange }: { url?: string; onChange: (url: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {url ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '6px 12px', border: '1px solid #374151' }}>
            <img src={url} alt="Signature" style={{ maxHeight: 48, maxWidth: 200, display: 'block' }} />
          </div>
          <button onClick={() => onChange('')} style={{ fontSize: 11, color: '#ef4444', background: 'transparent', border: '1px solid #374151', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} style={{ border: '2px dashed #374151', borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#4b5563'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}>
          &#128444;&nbsp; Click to upload signature image
          <div style={{ fontSize: 11, marginTop: 4, color: '#4b5563' }}>PNG, JPG, SVG — transparent background recommended</div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
type Draft = { firstName: string; middleName: string; lastName: string; credentials: string; email: string; roles: string[]; npi: string; gmcNumber: string; license: string; phone: string; department: string; signatureUrl: string; active: boolean; voiceProfile: string; canViewPediatric: boolean;};
const emptyDraft: Draft = { firstName: '', middleName: '', lastName: '', credentials: '', email: '', roles: [], npi: '', gmcNumber: '', license: '', phone: '', department: '', signatureUrl: '', active: true, voiceProfile: '', canViewPediatric: false };

interface StaffModalProps {
  mode: 'add' | 'edit';
  user?: StaffUser;
  roles: Role[];
  onSave: (draft: Draft) => void;
  onClose: () => void;
}

const StaffModal: React.FC<StaffModalProps> = ({ mode, user, roles, onSave, onClose }) => {
  const [draft, setDraft] = useState<Draft>(
    user ? { firstName: user.firstName, middleName: (user as any).middleName || '', lastName: user.lastName, credentials: user.credentials || '', email: user.email, roles: [...user.roles], npi: user.npi, gmcNumber: user.gmcNumber || '', license: user.license, phone: user.phone, department: user.department, signatureUrl: user.signatureUrl || '', active: user.status === 'Active', voiceProfile: user.voiceProfile || '', canViewPediatric: user.canViewPediatric ?? false }
         : emptyDraft
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const set = (k: keyof Draft, v: any) => { setDraft(prev => ({ ...prev, [k]: v })); setErrors(prev => ({ ...prev, [k]: '' })); };

  const validate = () => {
    const e: typeof errors = {};
    if (!draft.firstName.trim()) e.firstName = 'Required';
    if (!draft.lastName.trim())  e.lastName  = 'Required';
    if (draft.roles.length === 0) e.roles = 'At least one role is required';
    if (draft.email.trim() && !/\S+@\S+\.\S+/.test(draft.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave(draft);
  };

  return (
    <div data-capture-hide="true" className="ps-conf-backdrop" onClick={onClose}>
      <div className="ps-conf-modal" onClick={e => e.stopPropagation()}>
        <div className="ps-conf-modal-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>{mode === 'add' ? 'Add Staff Member' : `Edit — ${[user?.firstName, (user as any)?.middleName, user?.lastName].filter(Boolean).join(' ')}`}</span>
          <button
            onClick={onClose}
            style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7,
              color:'#64748b', cursor:'pointer', fontSize:16, lineHeight:1, padding:'4px 9px',
              display:'flex', alignItems:'center', justifyContent:'center' }}
            aria-label="Close"
          >✕</button>
        </div>

        <div className="ps-conf-modal-body">

          {/* Row 1: First | Middle | Last */}
          <div className="ps-conf-form-row--3">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">First Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="ps-conf-input" style={{ borderColor: errors.firstName ? '#ef4444' : undefined }} value={draft.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
              {errors.firstName && <span style={{ fontSize: 11, color: '#ef4444' }} data-phi="name">{errors.firstName}</span>}
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Middle Name</label>
              <input className="ps-conf-input" value={draft.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Middle name" />
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="ps-conf-input" style={{ borderColor: errors.lastName ? '#ef4444' : undefined }} value={draft.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
              {errors.lastName && <span style={{ fontSize: 11, color: '#ef4444' }} data-phi="name">{errors.lastName}</span>}
            </div>
          </div>

          {/* Row 2: Email | Role */}
          <div className="ps-conf-form-row">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Email</label>
              <input className="ps-conf-input" style={{ borderColor: errors.email ? '#ef4444' : undefined }} value={draft.email} onChange={e => set('email', e.target.value)} placeholder="user@hospital.org" />
              {errors.email && <span style={{ fontSize: 11, color: '#ef4444' }}>{errors.email}</span>}
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Role <span style={{ color: '#ef4444' }}>*</span></label>
              {draft.roles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {draft.roles.map(rName => {
                    const roleObj = roles.find(x => x.name === rName);
                    const color = roleObj?.color ?? '#8AB4F8';
                    return (
                      <span key={rName} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>
                        {rName}
                        <span onClick={() => set('roles', draft.roles.filter(x => x !== rName))} style={{ cursor: 'pointer', fontSize: 12, lineHeight: 1, color, opacity: 0.7 }}>×</span>
                      </span>
                    );
                  })}
                </div>
              )}
              <select value="" onChange={e => { const val = e.target.value; if (val && !draft.roles.includes(val)) set('roles', [...draft.roles, val]); }}
                className="ps-conf-select" style={{ cursor: 'pointer' }}>
                <option value="" disabled>Select a role...</option>
                {roles.filter(r => r.name !== 'Physician' && !draft.roles.includes(r.name)).map(r => (
                  <option key={r.id} value={r.name} style={{ background: '#0f0f0f' }}>{r.name}</option>
                ))}
              </select>
              {errors.roles && <span style={{ fontSize: 11, color: '#ef4444' }}>{errors.roles}</span>}
            </div>
          </div>

          {/* Row 3: Phone | Department — moved up */}
          <div className="ps-conf-form-row">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Phone</label>
              <input className="ps-conf-input" value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="555-0100" />
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Department</label>
              <input className="ps-conf-input" value={draft.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Surgical Pathology" />
            </div>
          </div>

          {/* Row 4: Credentials (full width) */}
          <div className="ps-conf-form-field">
            <label className="ps-conf-label">Credentials <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(e.g. MD, FCAP)</span></label>
            <input className="ps-conf-input" value={draft.credentials} onChange={e => set('credentials', e.target.value)} placeholder="e.g. MD, FCAP / MBChB, FRCPath" />
          </div>

          {/* Row 5: NPI | GMC */}
          <div className="ps-conf-form-row">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">NPI Number <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(US)</span></label>
              <input className="ps-conf-input" value={draft.npi} onChange={e => set('npi', e.target.value)} placeholder="10-digit NPI" />
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">GMC Number <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(UK)</span></label>
              <input className="ps-conf-input" value={draft.gmcNumber} onChange={e => set('gmcNumber', e.target.value)} placeholder="7-digit GMC number" />
            </div>
          </div>

          {/* Row 6: License | Voice Profile — stray ▼ div removed */}
          <div className="ps-conf-form-row">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">License Number</label>
              <input className="ps-conf-input" value={draft.license} onChange={e => set('license', e.target.value)} placeholder="State license #" />
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Voice Profile</label>
              <select value={draft.voiceProfile} onChange={e => set('voiceProfile', e.target.value)} className="ps-conf-select">
                <option value="" style={{ background: '#0f0f0f' }}>System Default (Inherited)</option>
                {VOICE_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id} style={{ background: '#0f0f0f' }}>{profile.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 7: Pediatric Access */}
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 10,
            background: draft.canViewPediatric ? 'rgba(8,145,178,0.06)' : 'transparent',
            border: `1px solid ${draft.canViewPediatric ? 'rgba(8,145,178,0.25)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.canViewPediatric}
                onChange={e => setDraft(d => ({ ...d, canViewPediatric: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#0891b2', cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: draft.canViewPediatric ? '#38bdf8' : '#9ca3af' }}>Pediatric Access</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Qualifies this pathologist to report pediatric cases. Client-level authorization is also required per client.</div>
              </div>
            </label>
          </div>

          {/* Row 8: Status | Signature side by side */}
          <div className="ps-conf-form-row">
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Status</label>
              <Toggle value={draft.active} onChange={v => set('active', v)} />
            </div>
            <div className="ps-conf-form-field">
              <label className="ps-conf-label">Signature</label>
              <SignatureUpload url={draft.signatureUrl} onChange={url => set('signatureUrl', url)} />
            </div>
          </div>

        </div>

        <div className="ps-conf-modal-footer">
          <button className="ps-conf-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ps-conf-btn-primary" onClick={handleSave}>
            {mode === 'add' ? 'Add Staff Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main StaffTab ────────────────────────────────────────────────────────────
const StaffMembers: React.FC<{ roles: Role[] }> = ({ roles }) => {
  const { subspecialties } = useSubspecialties();
  const [users,       setUsers]     = useState<StaffUser[]>([]);
  const [loading,     setLoading]   = useState(true);
  const [search,      setSearch]    = useState('');
  const [roleFilter,  setRoleFilter] = useState('All');
  const [modal,       setModal]     = useState<{ mode: 'add' | 'edit'; user?: StaffUser } | null>(null);

React.useEffect(() => {
  // 1. Add the type here to fix "implicitly has an any type"
  userService.getAll().then((res: ServiceResult<StaffUser[]>) => {
    
    // 2. Use a type guard to handle the Union (Success vs Error)
    if ('ok' in res && res.ok) {
      setUsers(res.data || []);
    } else if ('error' in res) {
      console.error(res.error);
    }
    
    setLoading(false);
  });
}, []);

  const userSubsMap: Record<string, string[]> = {};
  subspecialties.forEach(sub => {
    sub.userIds.forEach(uid => {
      if (!userSubsMap[uid]) userSubsMap[uid] = [];
      userSubsMap[uid].push(sub.name);
    });
  });

  if (loading) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Loading staff...</div>
  );

  const filtered = users.filter(u => {
    const name = fullName(u).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (roleFilter === 'All' || u.roles.includes(roleFilter));
  });

  const handleSave = async (draft: Draft) => {
    const payload = {
      firstName: draft.firstName, lastName: draft.lastName, credentials: draft.credentials, email: draft.email,
      roles: draft.roles, npi: draft.npi, gmcNumber: draft.gmcNumber, license: draft.license, phone: draft.phone,
      canViewPediatric: draft.canViewPediatric,
      department: draft.department, signatureUrl: draft.signatureUrl,
      status: (draft.active ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
      voiceProfile: draft.voiceProfile === '' ? undefined : (draft.voiceProfile as VoiceProfileId),
    };
    if (modal?.mode === 'add') {
      const res = await userService.add(payload);
      if (res.ok) setUsers(prev => [...prev, res.data]);
    } else if (modal?.user) {
      const res = await userService.update(modal.user.id, payload);
      if (res.ok) setUsers(prev => prev.map(u => u.id === res.data.id ? res.data : u));
    }
    setModal(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>Staff</h2>
          <p style={{ fontSize: '14px', color: '#9AA0A6' }}>Manage pathologists, residents, and administrators.</p>
        </div>
        <button
          style={{ padding: '8px 16px', background: '#8AB4F8', color: '#0d1117', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6a9de0'}
          onMouseLeave={e => e.currentTarget.style.background = '#8AB4F8'}
          onClick={() => setModal({ mode: 'add' })}
        >+ Add Staff</button>
      </div>

      <div data-capture-hide="true" style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '14px', color: '#DEE4E7', outline: 'none' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          title="Filter by role"
          style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '14px', color: '#DEE4E7', outline: 'none', cursor: 'pointer' }}>
          <option value="All" style={{ background: '#1e293b' }}>All Roles</option>
          {roles.filter(r => r.name !== 'Physician').map(r => (
            <option key={r.id} value={r.name} style={{ background: '#1e293b' }}>{r.name}</option>
          ))}
        </select>
      </div>

      <div data-capture-hide="true" style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 480px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#0d1117' }}>
                {['Staff Member', 'Email', 'Role', 'Subspecialties', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const subs = userSubsMap[u.id] || [];
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(138,180,248,0.2)', border: '1.5px solid rgba(138,180,248,0.5)', color: '#8AB4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                          {initials(u)}
                        </div>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#DEE4E7' }} data-phi="name">{fullName(u)}</span>
                          {u.credentials && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>{u.credentials}</span>}
                          {u.canViewPediatric && (
                            <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: 8, padding: '1px 6px',
                              borderRadius: 4, background: 'rgba(8,145,178,0.1)', color: '#38bdf8',
                              border: '1px solid rgba(8,145,178,0.25)' }}>Peds</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9AA0A6' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, alignItems: 'center' }}>
                        {u.roles.slice(0, 2).map(r => {
                          const roleObj = roles.find(x => x.name === r);
                          const style = roleObj
                            ? { color: roleObj.color, background: `${roleObj.color}22`, border: `1px solid ${roleObj.color}44` }
                            : roleStyle[r] ?? roleStyle['Pathologist'];
                          return <span key={r} style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', ...style }}>{r}</span>;
                        })}
                        {u.roles.length > 2 && (
                          <span title={u.roles.slice(2).join(', ')} style={{ padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, color: '#6b7280', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'default', whiteSpace: 'nowrap' }}>
                            +{u.roles.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {subs.length === 0
                        ? <span style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>None</span>
                        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{subs.map(s => <span key={s} style={subBadge}>{s}</span>)}</div>
                      }
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.status === 'Active' ? '#22c55e' : '#4b5563', display: 'inline-block', flexShrink: 0, boxShadow: u.status === 'Active' ? '0 0 6px #22c55e99' : 'none' }} />
                        <span style={{ fontSize: '13px', color: u.status === 'Active' ? '#d1d5db' : '#6b7280' }}>{u.status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#DEE4E7' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onClick={() => setModal({ mode: 'edit', user: u })}
                      >Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <StaffModal mode={modal.mode} user={modal.user} roles={roles} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
};

// ─── Staff Shell (sub-tabs) ───────────────────────────────────────────────────
type StaffSubTab = 'members' | 'roles';

const StaffTab: React.FC = () => {
  const [subTab, setSubTab] = useState<StaffSubTab>('members');
  const [roles, setRoles] = React.useState<Role[]>(DEFAULT_ROLES);

  const tabStyle = (id: StaffSubTab): React.CSSProperties => ({
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: subTab === id ? 700 : 500,
    color: subTab === id ? '#8AB4F8' : '#6b7280',
    background: 'transparent',
    border: 'none',
    borderBottom: subTab === id ? '2px solid #8AB4F8' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1f2937', marginBottom: 0, paddingLeft: 24 }}>
        <button style={tabStyle('members')} onClick={() => setSubTab('members')}>Staff Members</button>
        <button style={tabStyle('roles')}   onClick={() => setSubTab('roles')}>Role Dictionary</button>
      </div>

      {subTab === 'members' && <StaffMembers roles={roles} />}
      {subTab === 'roles'   && <RoleDictionary onRolesChange={setRoles} />}
    </div>
  );
};

export default StaffTab;
