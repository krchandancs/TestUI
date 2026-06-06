import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { physicianService, clientService } from '../../../services';
import {
  overlay, modalBox, modalHeaderStyle, modalFooterStyle,
  cancelButtonStyle, applyButtonStyle,
} from '../../Common/modalStyles';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Physician {
  id: string;
  firstName: string;
  lastName: string;
  npi: string;
  specialty: string;
  phone: string;
  fax: string;
  email: string;
  preferredContact: 'Email' | 'Fax' | 'Phone';
  clientIds: string[];
  status: 'Active' | 'Inactive';
}

// Clients loaded via clientService in PhysiciansSection

// Physicians loaded via physicianService in PhysiciansSection

// ─── Styles ───────────────────────────────────────────────────────────────────
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 };
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' };
const INPUT: React.CSSProperties = { padding: '9px 12px', fontSize: 13, color: '#e5e7eb', background: '#0f0f0f', border: '1px solid #374151', borderRadius: 7, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const SELECT: React.CSSProperties = { ...INPUT, cursor: 'pointer', appearance: 'none' };
const ROW2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const clientBadge: React.CSSProperties = { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 2, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' };

function initials(p: Physician) { return (p.firstName[0] + p.lastName[0]).toUpperCase(); }
function fullName(p: Physician) { return `${p.firstName} ${p.lastName}`; }

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, background: value ? '#22c55e' : '#374151', boxShadow: value ? '0 0 8px #22c55e55' : 'none' }}>
      <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: value ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? '#22c55e' : '#6b7280' }}>{value ? 'Active' : 'Inactive'}</span>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
type Draft = Omit<Physician, 'id'> & { active: boolean };

const emptyDraft: Draft = {
  firstName: '', lastName: '', npi: '', specialty: '', phone: '', fax: '',
  email: '', preferredContact: 'Email', clientIds: [], status: 'Active', active: true,
};

interface PhysicianModalProps {
  mode: 'add' | 'edit';
  physician?: Physician;
  clients: { id: string; name: string }[];
  onSave: (draft: Draft) => void;
  onClose: () => void;
}

const PhysicianModal: React.FC<PhysicianModalProps> = ({ mode, physician, clients, onSave, onClose }) => {
  const [draft, setDraft] = useState<Draft>(
    physician
      ? { ...physician, active: physician.status === 'Active' }
      : emptyDraft
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [clientSearch, setClientSearch] = useState('');

  const set = (k: keyof Draft, v: any) => { setDraft(prev => ({ ...prev, [k]: v })); setErrors(prev => ({ ...prev, [k]: '' })); };

  const toggleClient = (id: string) => {
    setDraft(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(id) ? prev.clientIds.filter(x => x !== id) : [...prev.clientIds, id],
    }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!draft.firstName.trim()) e.firstName = 'Required';
    if (!draft.lastName.trim())  e.lastName  = 'Required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave(draft);
  };

  const filteredClients = clients.filter(c =>
    !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div style={overlay}>
      <div style={{ ...modalBox, maxWidth: 620, maxHeight: '95vh', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...modalHeaderStyle, padding: '20px 24px 0', flexShrink: 0 }}>
          {mode === 'add' ? 'Add Physician' : `Edit — Dr. ${physician?.firstName} ${physician?.lastName}`}
        </div>

        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Name */}
          <div style={ROW2}>
            <div style={FIELD}>
              <label style={LABEL}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input data-phi="name" style={{ ...INPUT, borderColor: errors.firstName ? '#ef4444' : '#374151' }} value={draft.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
              {errors.firstName && <span style={{ fontSize: 11, color: '#ef4444' }} data-phi="name">{errors.firstName}</span>}
            </div>
            <div style={FIELD}>
              <label style={LABEL}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input data-phi="name" style={{ ...INPUT, borderColor: errors.lastName ? '#ef4444' : '#374151' }} value={draft.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
              {errors.lastName && <span style={{ fontSize: 11, color: '#ef4444' }} data-phi="name">{errors.lastName}</span>}
            </div>
          </div>

          {/* NPI + Specialty */}
          <div style={ROW2}>
            <div style={FIELD}>
              <label style={LABEL}>NPI Number</label>
              <input style={INPUT} value={draft.npi} onChange={e => set('npi', e.target.value)} placeholder="10-digit NPI" />
            </div>
            <div style={FIELD}>
              <label style={LABEL}>Specialty</label>
              <input style={INPUT} value={draft.specialty} onChange={e => set('specialty', e.target.value)} placeholder="e.g. Gastroenterology" />
            </div>
          </div>

          {/* Phone + Fax */}
          <div style={ROW2}>
            <div style={FIELD}>
              <label style={LABEL}>Phone</label>
              <input style={INPUT} value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="555-0100" />
            </div>
            <div style={FIELD}>
              <label style={LABEL}>Fax</label>
              <input style={INPUT} value={draft.fax} onChange={e => set('fax', e.target.value)} placeholder="555-0101" />
            </div>
          </div>

          {/* Email + Preferred Contact */}
          <div style={ROW2}>
            <div style={FIELD}>
              <label style={LABEL}>Email</label>
              <input style={INPUT} value={draft.email} onChange={e => set('email', e.target.value)} placeholder="dr@clinic.org" />
            </div>
            <div style={FIELD}>
              <label style={LABEL}>Preferred Contact</label>
              <select style={SELECT} value={draft.preferredContact} onChange={e => set('preferredContact', e.target.value)}>
                <option value="Email" style={{ background: '#0f0f0f' }}>Email</option>
                <option value="Fax"   style={{ background: '#0f0f0f' }}>Fax</option>
                <option value="Phone" style={{ background: '#0f0f0f' }}>Phone</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div style={FIELD}>
            <label style={LABEL}>Status</label>
            <Toggle value={draft.active} onChange={v => set('active', v)} />
          </div>

          {/* Client Affiliations */}
          <div style={FIELD}>
            <label style={LABEL}>Client Affiliations</label>
            <div style={{ border: '1px solid #1f2937', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 10px', background: '#0a0a0a', borderBottom: '1px solid #1f2937' }}>
                <input
                  type="text" placeholder="Search clients..." value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  style={{ ...INPUT, background: 'transparent', border: 'none', padding: '4px 0', fontSize: 12 }}
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', padding: '6px 10px' }}>
                {filteredClients.length === 0
                  ? <div style={{ fontSize: 12, color: '#4b5563', padding: '8px 0' }}>No clients match.</div>
                  : filteredClients.map(c => {
                      const checked = draft.clientIds.includes(c.id);
                      return (
                        <div key={c.id} onClick={() => toggleClient(c.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: checked ? 'rgba(139,92,246,0.06)' : 'transparent', border: `1px solid ${checked ? 'rgba(139,92,246,0.2)' : 'transparent'}` }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? '#a78bfa' : '#374151'}`, background: checked ? '#a78bfa' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13, color: '#f9fafb' }}>{c.name}</span>
                        </div>
                      );
                    })
                }
              </div>
            </div>
            {draft.clientIds.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {draft.clientIds.map(id => {
                  const c = clients.find(x => x.id === id);
                  return c ? <span key={id} style={clientBadge}>{c.name}</span> : null;
                })}
              </div>
            )}
          </div>

        </div>

        <div style={{ ...modalFooterStyle, padding: '12px 24px', borderTop: '1px solid #1f2937', flexShrink: 0 }}>
          <button style={cancelButtonStyle} onClick={onClose}>Cancel</button>
          <button style={applyButtonStyle} onClick={handleSave}>
            {mode === 'add' ? 'Add Physician' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main PhysiciansSection ───────────────────────────────────────────────────
const PhysiciansSection: React.FC = () => {
  const [physicians,   setPhysicians]   = useState<Physician[]>([]);
  const [clients,      setClients]      = useState<{ id: string; name: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [modal,        setModal]        = useState<{ mode: 'add' | 'edit'; physician?: Physician } | null>(null);

  useEffect(() => {
    Promise.all([
      physicianService.getAll(),
      clientService.getAll(),
    ]).then(([physRes, clientRes]) => {
      if (physRes.ok)   setPhysicians(physRes.data as any);
      if (clientRes.ok) setClients(clientRes.data.map(c => ({ id: c.id, name: c.name })));
      setLoading(false);
    });
  }, []);

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;
  const selectSt: React.CSSProperties = { padding: '9px 36px 9px 14px', fontSize: 13, fontWeight: 600, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

  const filtered = physicians.filter(p => {
    const matchSearch = !search || fullName(p).toLowerCase().includes(search.toLowerCase()) || p.npi.includes(search) || p.specialty.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (draft: Draft) => {
    const payload = { ...draft, status: (draft.active ? 'Active' : 'Inactive') as 'Active' | 'Inactive' };
    if (modal?.mode === 'add') {
      const res = await physicianService.add({ ...payload, autoCreated: false });
      if (res.ok) setPhysicians((prev: any) => [...prev, res.data]);
    } else if (modal?.physician) {
      const res = await physicianService.update(modal.physician.id, payload);
      if (res.ok) setPhysicians((prev: any) => prev.map((p: any) => p.id === res.data.id ? res.data : p));
    }
    setModal(null);
  };

  if (loading) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Loading physicians...</div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>Physicians</h3>
          <p style={{ fontSize: 13, color: '#9AA0A6', marginTop: 4, marginBottom: 0 }}>Manage ordering and submitting physicians and their client affiliations.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          style={{ padding: '8px 16px', background: '#8AB4F8', color: '#0d1117', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6a9de0'}
          onMouseLeave={e => e.currentTarget.style.background = '#8AB4F8'}
        >+ Add Physician</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input type="text" placeholder="Search by name, NPI, or specialty..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 16px', fontSize: 13, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={selectSt}>
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 480px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#0d1117' }}>
                {['Physician', 'Specialty', 'Contact', 'Clients', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(167,139,250,0.2)', border: '1.5px solid rgba(167,139,250,0.5)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {initials(p)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#DEE4E7' }} data-phi="name">Dr. {fullName(p)}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>NPI: {p.npi || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#9AA0A6' }}>{p.specialty || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, color: '#9AA0A6', lineHeight: 1.6 }} data-phi="email">{p.preferredContact === 'Email' && <div>✉ {p.email || '—'}</div>}
                      {p.preferredContact === 'Fax'   && <div>📠 {p.fax || '—'}</div>}
                      {p.preferredContact === 'Phone' && <div data-phi="phone">📞 {p.phone || '—'}</div>}
                      <div style={{ fontSize: 11, color: '#4b5563' }}>via {p.preferredContact}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.clientIds.length === 0
                      ? <span style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>None</span>
                      : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {p.clientIds.map(id => {
                            const c = clients.find(x => x.id === id);
                            return c ? <span key={id} style={clientBadge}>{c.name}</span> : null;
                          })}
                        </div>
                    }
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.status === 'Active' ? '#22c55e' : '#4b5563', display: 'inline-block', flexShrink: 0, boxShadow: p.status === 'Active' ? '0 0 6px #22c55e99' : 'none' }} />
                      <span style={{ fontSize: 13, color: p.status === 'Active' ? '#d1d5db' : '#6b7280' }}>{p.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setModal({ mode: 'edit', physician: p })}
                      style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#DEE4E7' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>No physicians match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <PhysicianModal mode={modal.mode} physician={modal.physician} clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
};

export default PhysiciansSection;
