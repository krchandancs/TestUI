// src/components/Config/System/PerformanceTargetsSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Configuration screen for institution-wide performance targets.
// Lives at: Configuration → System → Performance Targets
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { mockPerformanceTargetService } from '../../../../services/performanceTargets/mockPerformanceTargetService';
import type { PerformanceTarget, TargetUnit, TargetPeriod } from '../../../../services/performanceTargets/IPerformanceTargetService';
import '../../../../pathscribe.css';

// ── Unit and period labels ────────────────────────────────────────────────────
const UNIT_LABELS: Record<TargetUnit, string> = {
  cases: 'cases', RVUs: 'RVUs', '%': '%', hours: 'h',
};
const PERIOD_LABELS: Record<TargetPeriod, string> = {
  daily: 'per day', weekly: 'per week', monthly: 'per month',
  quarterly: 'per quarter', annually: 'per year',
};

const UNIT_COLORS: Record<TargetUnit, string> = {
  cases: '#38bdf8', RVUs: '#f59e0b', '%': '#34d399', hours: '#c084fc',
};

// ── Inline edit row ───────────────────────────────────────────────────────────
const TargetRow: React.FC<{
  target: PerformanceTarget;
  onSave: (id: string, value: number) => void;
}> = ({ target, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(String(target.value));

  const commit = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) onSave(target.id, n);
    setEditing(false);
  };

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'1fr 120px 100px 80px 36px',
      gap:12, alignItems:'center', padding:'13px 18px',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Label + description */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:2 }}>
          {target.label}
          {target.system && <span style={{ marginLeft:8, fontSize:9, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'1px 5px' }}>system</span>}
        </div>
        <div style={{ fontSize:11, color:'#64748b' }}>{target.description}</div>
      </div>

      {/* Value — inline editable */}
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        {editing ? (
          <input
            autoFocus
            type="number" value={val} onChange={e => setVal(e.target.value)}
            onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{ width:70, background:'rgba(15,23,42,0.9)', border:'1px solid #0891b2', borderRadius:6, color:'#f1f5f9', fontSize:14, fontWeight:700, padding:'4px 8px', outline:'none' }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            title="Click to edit"
            style={{ fontSize:20, fontWeight:800, color: UNIT_COLORS[target.unit], cursor:'text' }}
          >{target.value}</span>
        )}
        <span style={{ fontSize:12, color:'#64748b' }}>{UNIT_LABELS[target.unit]}</span>
      </div>

      {/* Period */}
      <span style={{ fontSize:11, color:'#475569' }}>{PERIOD_LABELS[target.period]}</span>

      {/* Unit badge */}
      <span style={{ display:'inline-flex', justifyContent:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:`${UNIT_COLORS[target.unit]}18`, color: UNIT_COLORS[target.unit] }}>
        {target.unit}
      </span>

      {/* No delete — targets referenced in KPI calculations; edit value instead */}
      <div title={target.system ? 'System target — protected' : 'Custom target — edit value to update'} style={{ fontSize:14, color:'#334155', textAlign:'center' }}>
        {target.system ? '🔒' : '✏'}
      </div>
    </div>
  );
};

// ── Add target modal ──────────────────────────────────────────────────────────
const AddModal: React.FC<{
  onSave:  (t: Omit<PerformanceTarget, 'id'>) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [form, setForm] = useState<Omit<PerformanceTarget, 'id'>>({
    key: '', label: '', description: '', value: 100,
    unit: '%', period: 'monthly', system: false,
  });
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle: React.CSSProperties = {
    background:'rgba(15,23,42,0.7)', border:'1px solid rgba(148,163,184,0.25)',
    borderRadius:7, color:'#f1f5f9', fontSize:13, padding:'7px 10px',
    outline:'none', width:'100%', boxSizing:'border-box' as const,
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor:'pointer' };

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, width:480, maxWidth:'92vw', padding:28, display:'flex', flexDirection:'column', gap:16, boxShadow:'0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>Add Performance Target</span>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:7, color:'#64748b', cursor:'pointer', fontSize:18, padding:'3px 9px' }}>×</button>
        </div>
        {[
          { label:'Label', el: <input style={inputStyle} value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Cases per Quarter" /> },
          { label:'Description', el: <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief explanation shown in config" /> },
        ].map(({ label, el }) => (
          <div key={label}>
            <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'block', marginBottom:5 }}>{label}</label>
            {el}
          </div>
        ))}
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'block', marginBottom:5 }}>Target Value</label>
            <input style={inputStyle} type="number" value={form.value} onChange={e => set('value', +e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'block', marginBottom:5 }}>Unit</label>
            <select style={selectStyle} value={form.unit} onChange={e => set('unit', e.target.value as TargetUnit)}>
              <option value="cases">cases</option>
              <option value="RVUs">RVUs</option>
              <option value="%">%</option>
              <option value="hours">hours</option>
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' as const, letterSpacing:'0.5px', display:'block', marginBottom:5 }}>Period</label>
            <select style={selectStyle} value={form.period} onChange={e => set('period', e.target.value as TargetPeriod)}>
              {(['daily','weekly','monthly','quarterly','annually'] as TargetPeriod[]).map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:4 }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(148,163,184,0.3)', background:'transparent', color:'#64748b', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={() => onSave({ ...form, key: form.label.toLowerCase().replace(/\s+/g,'_') })} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#22c55e', color:'#022c22', fontWeight:700, cursor:'pointer', fontSize:13 }}>Save Target</button>
        </div>
      </div>
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────
const PerformanceTargetsSection: React.FC = () => {
  const [targets,  setTargets]  = useState<PerformanceTarget[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);


  const reload = useCallback(async () => {
    setLoading(true);
    const r = await mockPerformanceTargetService.getAll();
    if (r.ok) setTargets(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleSaveValue = async (id: string, value: number) => {
    await mockPerformanceTargetService.update(id, { value });
    reload();
  };

  const handleAdd = async (data: Omit<PerformanceTarget, 'id'>) => {
    await mockPerformanceTargetService.add(data);
    setShowAdd(false);
    reload();
  };

  // Performance targets are preserved for historical KPI accuracy — no hard delete

  // Group by unit for cleaner layout
  const groups: [string, PerformanceTarget[]][] = [
    ['Volume & Workload', targets.filter(t => ['cases','RVUs'].includes(t.unit))],
    ['Quality & Compliance', targets.filter(t => t.unit === '%')],
    ['Turnaround Time', targets.filter(t => t.unit === 'hours')],
  ].filter(([, items]) => (items as PerformanceTarget[]).length > 0) as [string, PerformanceTarget[]][];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>Performance Targets</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Institution-wide KPI benchmarks. Click a value to edit it inline. System targets cannot be deleted.</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#0891b2', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>+ Add Target</button>
      </div>

      {loading ? (
        <div style={{ padding:32, textAlign:'center', color:'#475569', fontSize:13 }}>Loading…</div>
      ) : groups.map(([groupLabel, items]) => (
        <div key={groupLabel} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' }}>
          {/* Group header */}
          <div style={{ padding:'9px 18px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase' as const, letterSpacing:'0.6px', color:'#475569' }}>{groupLabel}</span>
          </div>
          {/* Column labels */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px 80px 36px', gap:12, padding:'7px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            {['Metric','Target','Period','Unit',''].map(h => (
              <span key={h} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as const, color:'#334155', letterSpacing:'0.5px' }}>{h}</span>
            ))}
          </div>
          {(items as PerformanceTarget[]).map(t => (
            <TargetRow key={t.id} target={t} onSave={handleSaveValue} />
          ))}
        </div>
      ))}

      {showAdd && <AddModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}

      {/* Targets preserved for historical KPI accuracy */}
    </div>
  );
};

export default PerformanceTargetsSection;
