// src/components/Config/System/ClientSLASection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Configuration screen for per-client TAT SLA targets.
// Lives at: Configuration → System → Client SLA Targets
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { mockClientSLAService } from '../../../../services/clientSLA/mockClientSLAService';
import type { ClientSLA } from '../../../../services/clientSLA/IClientSLAService';
import '../../../../pathscribe.css';

// ── Small helpers ─────────────────────────────────────────────────────────────
const EMPTY: Omit<ClientSLA, 'id'> = {
  clientCode: '', clientName: '', firstTouchTargetHrs: 4, totalTatTargetHrs: 24,
  statFirstTouchTargetHrs: undefined, statTotalTatTargetHrs: undefined,
  active: true, notes: '',
};

const Field: React.FC<{ label: string; children: React.ReactNode; half?: boolean }> = ({ label, children, half }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, flex: half ? '0 0 calc(50% - 6px)' : 1 }}>
    <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</label>
    {children}
  </div>
);

const input = (extra?: React.CSSProperties): React.CSSProperties => ({
  background:'rgba(15,23,42,0.7)', border:'1px solid rgba(148,163,184,0.25)',
  borderRadius:7, color:'#f1f5f9', fontSize:13, padding:'7px 10px', outline:'none',
  width:'100%', boxSizing:'border-box' as const, ...extra,
});

// ── Modal ─────────────────────────────────────────────────────────────────────
const SLAModal: React.FC<{
  initial: Partial<ClientSLA> | null;
  onSave:  (data: Omit<ClientSLA, 'id'>) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<ClientSLA, 'id'>>({ ...EMPTY, ...initial });
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16,
        width:560, maxWidth:'92vw', padding:28, display:'flex', flexDirection:'column', gap:18,
        boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>
            {initial?.id ? 'Edit Client SLA' : 'Add Client SLA'}
          </span>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:7, color:'#64748b', cursor:'pointer', fontSize:18, padding:'3px 9px' }}>×</button>
        </div>

        {/* Row 1 */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Field label="Client Code" half>
            <input style={input()} value={form.clientCode}
              onChange={e => set('clientCode', e.target.value.toUpperCase())} maxLength={6} placeholder="e.g. MGH" />
          </Field>
          <Field label="Client Name" half>
            <input style={input()} value={form.clientName}
              onChange={e => set('clientName', e.target.value)} placeholder="Full institution name" />
          </Field>
        </div>

        {/* Row 2 — Routine targets */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:'#0891b2', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Routine TAT Targets</p>
          <div style={{ display:'flex', gap:12 }}>
            <Field label="First Touch (hours)" half>
              <input style={input()} type="number" min={1} max={96} value={form.firstTouchTargetHrs}
                onChange={e => set('firstTouchTargetHrs', +e.target.value)} />
            </Field>
            <Field label="Total TAT (hours)" half>
              <input style={input()} type="number" min={1} max={240} value={form.totalTatTargetHrs}
                onChange={e => set('totalTatTargetHrs', +e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Row 3 — STAT overrides */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>STAT Priority Overrides (optional)</p>
          <div style={{ display:'flex', gap:12 }}>
            <Field label="STAT First Touch (hours)" half>
              <input style={input()} type="number" min={0} max={96} placeholder="—"
                value={form.statFirstTouchTargetHrs ?? ''}
                onChange={e => set('statFirstTouchTargetHrs', e.target.value ? +e.target.value : undefined)} />
            </Field>
            <Field label="STAT Total TAT (hours)" half>
              <input style={input()} type="number" min={0} max={240} placeholder="—"
                value={form.statTotalTatTargetHrs ?? ''}
                onChange={e => set('statTotalTatTargetHrs', e.target.value ? +e.target.value : undefined)} />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <Field label="Notes">
          <textarea style={{ ...input(), minHeight:64, resize:'vertical' as const }}
            value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
            placeholder="Optional — e.g. contract review date, escalation contact" />
        </Field>

        {/* Active toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
          <span style={{ fontSize:13, color:'#e2e8f0' }}>SLA active — enforce in TAT reporting</span>
        </label>

        {/* Actions */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:4 }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(148,163,184,0.3)', background:'transparent', color:'#64748b', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#22c55e', color:'#022c22', fontWeight:700, cursor:'pointer', fontSize:13 }}>Save SLA</button>
        </div>
      </div>
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────
const ClientSLASection: React.FC = () => {
  const [slas,     setSlas]     = useState<ClientSLA[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Partial<ClientSLA> | null | 'new'>(null);


  const reload = useCallback(async () => {
    setLoading(true);
    const r = await mockClientSLAService.getAll();
    if (r.ok) setSlas(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async (data: Omit<ClientSLA, 'id'>) => {
    if (editing === 'new') {
      await mockClientSLAService.add(data);
    } else if (editing && 'id' in editing && editing.id) {
      await mockClientSLAService.update(editing.id, data);
    }
    setEditing(null);
    reload();
  };

  const handleToggleActive = async (sla: ClientSLA) => {
    await mockClientSLAService.update(sla.id, { ...sla, active: !sla.active });
    reload();
  };

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display:'grid', gridTemplateColumns:'70px 1fr 80px 80px 80px 80px 48px 48px',
    gap:12, alignItems:'center', padding:'10px 16px',
    borderBottom:'1px solid rgba(255,255,255,0.05)',
    opacity: active ? 1 : 0.5,
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>Client SLA Targets</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>TAT agreements per submitting client — used in TAT Performance reporting.</div>
        </div>
        <button onClick={() => setEditing('new')} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#0891b2', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          + Add SLA
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' }}>
        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 80px 80px 80px 80px 48px 48px', gap:12, padding:'9px 16px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          {['Code','Name','1st Touch','Total TAT','STAT 1st','STAT Tot','Active',''].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:800, textTransform:'uppercase' as const, color:'#475569', letterSpacing:'0.5px' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:24, textAlign:'center', color:'#475569', fontSize:13 }}>Loading…</div>
        ) : slas.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'#475569', fontSize:13 }}>No SLAs configured. Click + Add SLA to begin.</div>
        ) : slas.map(sla => (
          <div key={sla.id} style={rowStyle(sla.active)}>
            <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#7dd3fc', background:'rgba(8,145,178,0.12)', borderRadius:5, padding:'2px 7px' }}>{sla.clientCode}</span>
            <div>
              <div style={{ fontSize:13, color:'#e2e8f0' }}>{sla.clientName}</div>
              {sla.notes && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sla.notes}</div>}
            </div>
            <span style={{ fontSize:13, color:'#94a3b8' }}>{sla.firstTouchTargetHrs}h</span>
            <span style={{ fontSize:13, color:'#94a3b8' }}>{sla.totalTatTargetHrs}h</span>
            <span style={{ fontSize:13, color:'#f59e0b' }}>{sla.statFirstTouchTargetHrs ? `${sla.statFirstTouchTargetHrs}h` : '—'}</span>
            <span style={{ fontSize:13, color:'#f59e0b' }}>{sla.statTotalTatTargetHrs   ? `${sla.statTotalTatTargetHrs}h`   : '—'}</span>
            <span style={{ fontSize:11, color: sla.active ? '#34d399' : '#ef4444' }}>{sla.active ? 'Yes' : 'No'}</span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => setEditing(sla)} title="Edit" style={{ background:'transparent', border:'1px solid rgba(148,163,184,0.2)', borderRadius:6, color:'#94a3b8', cursor:'pointer', fontSize:12, padding:'3px 7px' }}>✏</button>
              <button
                onClick={() => handleToggleActive(sla)}
                title={sla.active ? 'Deactivate SLA' : 'Activate SLA'}
                style={{ background:'transparent', borderRadius:6, cursor:'pointer', fontSize:11, padding:'3px 7px', fontWeight:600,
                  border: sla.active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                  color:  sla.active ? '#f87171' : '#34d399',
                }}
              >{sla.active ? 'Off' : 'On'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {editing !== null && (
        <SLAModal
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* SLA records are deactivated, not deleted — preserves TAT reporting history */}
    </div>
  );
};

export default ClientSLASection;
