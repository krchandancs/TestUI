/**
 * DelegationTypeSection.tsx
 * System › Delegation Types
 * System types: toggle only. Custom types: full CRUD.
 */
import React, { useState, useEffect, useCallback } from 'react';
import '../../../pathscribe.css';
import { mockDelegationTypeService } from '../../../services/delegationTypes/mockDelegationTypeService';
import type { DelegationType } from '../../../services/delegationTypes/IDelegationTypeService';

const PRESET_COLORS = [
  '#0891B2','#6366f1','#f59e0b','#10b981',
  '#8b5cf6','#64748b','#ef4444','#38bdf8',
  '#34d399','#fb923c','#f87171','#e879f9',
];

function generateId(label: string): string {
  return label.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,24);
}

const BLANK = (): DelegationType => ({
  id:'', label:'', description:'', active:true,
  color: PRESET_COLORS[0], transfersOwnership:false,
  requiresNote:false, multiAssign:false,
  isSystem:false, sortOrder:999, cptHint:undefined,
});

const Toggle: React.FC<{checked:boolean; onChange:(v:boolean)=>void; label?:string; disabled?:boolean}> =
({ checked, onChange, label, disabled=false }) => (
  <label style={{display:'flex',alignItems:'center',gap:8,cursor:disabled?'not-allowed':'pointer',userSelect:'none',opacity:disabled?0.4:1}}>
    <div onClick={()=>!disabled&&onChange(!checked)} style={{width:36,height:20,borderRadius:10,position:'relative',flexShrink:0,background:checked?'rgba(138,180,248,0.6)':'rgba(100,116,139,0.3)',transition:'background 0.2s',cursor:disabled?'not-allowed':'pointer'}}>
      <div style={{position:'absolute',top:3,left:checked?18:3,width:14,height:14,borderRadius:'50%',background:checked?'#e0f2fe':'#94a3b8',transition:'left 0.2s'}}/>
    </div>
    {label&&<span style={{fontSize:12,color:'#cbd5e1'}}>{label}</span>}
  </label>
);

interface FormProps { initial:DelegationType|null; existingIds:string[]; onSave:(dt:DelegationType)=>void; onCancel:()=>void; }

const Form: React.FC<FormProps> = ({ initial, existingIds, onSave, onCancel }) => {
  const isNew = initial===null;
  const [form, setForm] = useState<DelegationType>(initial??BLANK());
  const [idTouched, setIdTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Partial<Record<keyof DelegationType,string>>>({});

  useEffect(()=>{
    if(isNew&&!idTouched&&form.label) setForm(f=>({...f,id:generateId(f.label)}));
  },[form.label,idTouched,isNew]);

  const set = <K extends keyof DelegationType>(k:K,v:DelegationType[K]) => setForm(f=>({...f,[k]:v}));

  const validate = () => {
    const e: Partial<Record<keyof DelegationType,string>> = {};
    if(!form.label.trim()) e.label='Required';
    if(!form.id.trim()) e.id='Required';
    if(!form.description.trim()) e.description='Required';
    if(isNew&&existingIds.includes(form.id)) e.id='ID already exists';
    setErrors(e); return Object.keys(e).length===0;
  };

  const inp = (err?:boolean): React.CSSProperties => ({padding:'7px 10px',borderRadius:6,fontSize:13,width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.05)',color:'#e2e8f0',outline:'none',fontFamily:'inherit',border:err?'1px solid #f87171':'1px solid rgba(255,255,255,0.1)'});
  const lbl: React.CSSProperties = {fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4,display:'block'};

  return (
    <div style={{background:'rgba(138,180,248,0.04)',border:'1px solid rgba(138,180,248,0.2)',borderRadius:10,padding:20,display:'flex',flexDirection:'column',gap:14}}>
      <div style={{fontSize:13,fontWeight:700,color:'#8AB4F8'}}>{isNew?'+ New Delegation Type':`Editing — ${initial!.label}`}</div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <label style={lbl}>Label</label>
          <input value={form.label} placeholder="e.g. Consult Request" onChange={e=>set('label',e.target.value)} style={inp(!!errors.label)}/>
          {errors.label&&<span style={{fontSize:11,color:'#f87171'}}>{errors.label}</span>}
        </div>
        <div>
          <label style={lbl}>ID {isNew&&<span style={{fontWeight:400,textTransform:'none',color:'#475569'}}>(auto-derived)</span>}</label>
          <input value={form.id} disabled={!isNew} placeholder="CONSULT_REQUEST" onChange={e=>{setIdTouched(true);set('id',e.target.value.toUpperCase());}} style={{...inp(!!errors.id),fontFamily:'monospace',opacity:isNew?1:0.5}}/>
          {errors.id&&<span style={{fontSize:11,color:'#f87171'}}>{errors.id}</span>}
        </div>
      </div>

      <div>
        <label style={lbl}>Description</label>
        <textarea value={form.description} rows={2} placeholder="Shown to staff during delegation…" onChange={e=>set('description',e.target.value)} style={{...inp(!!errors.description),resize:'vertical'}}/>
        {errors.description&&<span style={{fontSize:11,color:'#f87171'}}>{errors.description}</span>}
      </div>

      <div>
        <label style={lbl}>CPT Hint <span style={{fontWeight:400,textTransform:'none',color:'#475569'}}>(optional)</span></label>
        <input value={form.cptHint??''} placeholder="e.g. 88321–88325" onChange={e=>set('cptHint',e.target.value||undefined)} style={inp()}/>
      </div>

      <div>
        <label style={lbl}>Accent Color</label>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {PRESET_COLORS.map(c=>(
            <div key={c} onClick={()=>set('color',c)} style={{width:22,height:22,borderRadius:'50%',background:c,cursor:'pointer',flexShrink:0,outline:form.color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:2,transition:'outline 0.15s'}}/>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:4}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:form.color,border:'1px solid rgba(255,255,255,0.15)',flexShrink:0}}/>
            <input value={form.color} onChange={e=>set('color',e.target.value)} placeholder="#38bdf8" style={{width:80,padding:'3px 7px',borderRadius:6,fontSize:12,fontFamily:'monospace',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',outline:'none'}}/>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
        <Toggle checked={form.active} onChange={v=>set('active',v)} label="Active"/>
        <Toggle checked={!!form.transfersOwnership} onChange={v=>set('transfersOwnership',v)} label="Transfers Ownership"/>
        <Toggle checked={!!form.requiresNote} onChange={v=>set('requiresNote',v)} label="Requires Note"/>
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
        <button onClick={onCancel} style={{padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#94a3b8'}}>Cancel</button>
        <button onClick={()=>validate()&&onSave({...form,cptHint:form.cptHint?.trim()||undefined})} style={{padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',background:'rgba(138,180,248,0.15)',border:'1px solid rgba(138,180,248,0.3)',color:'#8AB4F8'}}>{isNew?'Create':'Save Changes'}</button>
      </div>
    </div>
  );
};

interface RowProps { dt:DelegationType; editingAny:boolean; onToggle:(dt:DelegationType)=>void; onEdit:(dt:DelegationType)=>void; onDeleteRequest:(id:string)=>void; deleteConfirm:string|null; onDeleteConfirm:(id:string)=>void; onDeleteCancel:()=>void; }

const Row: React.FC<RowProps> = ({ dt, editingAny, onToggle, onEdit, onDeleteRequest, deleteConfirm, onDeleteConfirm, onDeleteCancel }) => (
  <div style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:8,background:dt.active?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.01)',border:'1px solid rgba(255,255,255,0.07)',opacity:dt.active?1:0.5,transition:'opacity 0.2s'}}>
    <div style={{width:10,height:10,borderRadius:'50%',background:dt.color,flexShrink:0}}/>
    <span style={{fontSize:10,fontWeight:700,fontFamily:'monospace',padding:'2px 8px',borderRadius:4,flexShrink:0,minWidth:90,textAlign:'center',background:dt.color+'22',color:dt.color,border:`1px solid ${dt.color}44`}}>{dt.id}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{dt.label}</span>
        {dt.isSystem&&<span title="System type — cannot be deleted" style={{fontSize:10,color:'#475569',fontWeight:600}}>🔒 system</span>}
        {dt.transfersOwnership&&<span style={{fontSize:10,color:'#f59e0b',fontWeight:600}}>transfers ownership</span>}
        {dt.requiresNote&&<span style={{fontSize:10,color:'#94a3b8'}}>requires note</span>}
        {dt.cptHint&&<span style={{fontSize:10,color:'#64748b'}}>CPT {dt.cptHint}</span>}
      </div>
      <div style={{fontSize:12,color:'#64748b',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dt.description}</div>
    </div>
    <Toggle checked={dt.active} onChange={()=>onToggle(dt)} label={dt.active?'Active':'Inactive'}/>
    {!dt.isSystem&&(
      <button onClick={()=>onEdit(dt)} disabled={editingAny} style={{padding:'5px 12px',borderRadius:6,fontSize:11,fontWeight:600,cursor:editingAny?'not-allowed':'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',flexShrink:0,opacity:editingAny?0.4:1}}>Edit</button>
    )}
    {!dt.isSystem&&(
      deleteConfirm===dt.id?(
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:11,color:'#f87171'}}>Delete?</span>
          <button onClick={()=>onDeleteConfirm(dt.id)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer',background:'rgba(248,113,113,0.15)',border:'1px solid rgba(248,113,113,0.3)',color:'#f87171'}}>Yes</button>
          <button onClick={onDeleteCancel} style={{padding:'4px 10px',borderRadius:6,fontSize:11,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b'}}>No</button>
        </div>
      ):(
        <button onClick={()=>onDeleteRequest(dt.id)} disabled={editingAny} style={{padding:'5px 10px',borderRadius:6,fontSize:11,cursor:editingAny?'not-allowed':'pointer',background:'transparent',border:'1px solid transparent',color:'#475569',flexShrink:0,opacity:editingAny?0.4:1}}>✕</button>
      )
    )}
  </div>
);

const DelegationTypeSection: React.FC = () => {
  const [types, setTypes]               = useState<DelegationType[]>([]);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState<DelegationType|'new'|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    const result = await mockDelegationTypeService.getAll();
    if (result.ok) setTypes(result.data);
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const handleToggle  = async(dt:DelegationType)=>{ await mockDelegationTypeService.update(dt.id, { active: !dt.active }); await load(); };
  const handleSave = async(dt:DelegationType)=>{
    if (editing === 'new') {
      const { id, isSystem, ...rest } = dt;
      await mockDelegationTypeService.add(rest);
    } else {
      await mockDelegationTypeService.update(dt.id, dt);
    }
    setEditing(null);
    await load();
  };
  const handleDelete  = async(id:string)=>{ await mockDelegationTypeService.remove(id); setDeleteConfirm(null); await load(); };

  const editingAny  = editing!==null;
  const systemTypes = types.filter(t=>t.isSystem);
  const customTypes = types.filter(t=>!t.isSystem);
  const existingIds = types.map(t=>t.id);

  const groupLabel = (text:string) => (
    <div style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{text}</div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h2 style={{fontSize:16,fontWeight:700,color:'#f1f5f9',margin:0}}>Delegation Types</h2>
          <p style={{fontSize:13,color:'#64748b',margin:'4px 0 0'}}>System types can be enabled or disabled. Custom types are fully editable.</p>
        </div>
        {!editingAny&&(
          <button onClick={()=>setEditing('new')} style={{padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',background:'rgba(138,180,248,0.15)',border:'1px solid rgba(138,180,248,0.3)',color:'#8AB4F8',whiteSpace:'nowrap'}}>+ New Type</button>
        )}
      </div>

      {editing==='new'&&(
        <Form initial={null} existingIds={existingIds} onSave={handleSave} onCancel={()=>setEditing(null)}/>
      )}

      {loading ? <div style={{fontSize:13,color:'#475569'}}>Loading…</div> : (
        <>
          <div>
            {groupLabel('System Types')}
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {systemTypes.map(dt=>(
                <Row key={dt.id} dt={dt} editingAny={editingAny} onToggle={handleToggle}
                  onEdit={()=>{}} onDeleteRequest={()=>{}}
                  deleteConfirm={null} onDeleteConfirm={()=>{}} onDeleteCancel={()=>{}}/>
              ))}
            </div>
          </div>

          <div>
            {groupLabel('Custom Types')}
            {customTypes.length===0?(
              <div style={{fontSize:13,color:'#334155',padding:'12px 0'}}>No custom types yet — create one above.</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {customTypes.map(dt=>{
                  if(editing!==null&&editing!=='new'&&(editing as DelegationType).id===dt.id){
                    return <Form key={dt.id} initial={dt} existingIds={existingIds} onSave={handleSave} onCancel={()=>setEditing(null)}/>;
                  }
                  return (
                    <Row key={dt.id} dt={dt} editingAny={editingAny} onToggle={handleToggle}
                      onEdit={d=>setEditing(d)} onDeleteRequest={id=>setDeleteConfirm(id)}
                      deleteConfirm={deleteConfirm} onDeleteConfirm={handleDelete} onDeleteCancel={()=>setDeleteConfirm(null)}/>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DelegationTypeSection;
