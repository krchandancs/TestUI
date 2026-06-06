// src/components/Config/System/RoutingRulesSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin UI for configuring specimen → subspecialty pool routing rules.
// Rules are keyword-based: if a specimen description contains any keyword,
// the case routes to the mapped subspecialty pool.
//
// Built-in rules ship with PathScribe (cannot be deleted, can be disabled).
// Custom rules can be added, edited, and deleted.
// Priority controls which rule wins when multiple match.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import {
  RoutingRule, loadRoutingRules, saveRoutingRules,
  testSpecimenRouting, BUILT_IN_ROUTING_RULES,
} from '../../../services/cases/caseRoutingService';
import { subspecialtyService } from '../../../services';
import { Subspecialty } from '../../../services/subspecialties/ISubspecialtyService';
import { overlay, modalBox, modalHeaderStyle, modalFooterStyle, cancelButtonStyle, applyButtonStyle } from '../../Common/modalStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, color: '#e5e7eb',
  background: '#0f0f0f', border: '1px solid #374151',
  borderRadius: 7, outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 5, display: 'block',
};

// ─── Rule Modal ───────────────────────────────────────────────────────────────

const RuleModal: React.FC<{
  mode:   'add' | 'edit';
  rule?:  RoutingRule;
  pools:  Subspecialty[];
  allRules: RoutingRule[];
  onSave: (rule: Omit<RoutingRule, 'id' | 'builtIn'>) => void;
  onClose: () => void;
}> = ({ mode, rule, pools, allRules, onSave, onClose }) => {
  const [subspecialtyId, setSubspecialtyId] = useState(rule?.subspecialtyId ?? (pools[0]?.id ?? ''));
  const [keywords,       setKeywords]       = useState<string[]>(rule?.keywords ?? []);
  const [keywordInput,   setKeywordInput]   = useState('');
  const [priority,       setPriority]       = useState(rule?.priority ?? 100);
  const [active,         setActive]         = useState(rule?.active ?? true);
  const [note,           setNote]           = useState(rule?.note ?? '');
  const [error,          setError]          = useState('');

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw) return;
    if (keywords.includes(kw)) { setError(`"${kw}" already in list`); return; }
    setKeywords(prev => [...prev, kw]);
    setKeywordInput('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
  };

  const handleSave = () => {
    if (!subspecialtyId) { setError('Select a pool'); return; }
    if (keywords.length === 0) { setError('Add at least one keyword'); return; }
    // Guard against duplicate priority levels
    const conflict = allRules.find(r => r.priority === priority && r.id !== rule?.id);
    if (conflict) {
      setError(`Priority ${priority} is already used by another rule — choose a different value`);
      return;
    }
    onSave({ subspecialtyId, keywords, priority, active, note: note.trim() || undefined });
  };

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...modalBox, maxWidth: 560, maxHeight: '92vh',
        padding: 0, display: 'flex', flexDirection: 'column',
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
      }}>
        <div style={{ ...modalHeaderStyle, padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {mode === 'add' ? 'Add Routing Rule' : `Edit Rule`}
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

          {/* Pool */}
          <div>
            <label style={LABEL}>Route to Pool <span style={{ color: '#ef4444' }}>*</span></label>
            {pools.length === 0 ? (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: '#fbbf24' }}>
                ⚠ No active pools. Enable "Pool / Workgroup" on a Subspecialty first.
              </div>
            ) : (
              <select value={subspecialtyId} onChange={e => setSubspecialtyId(e.target.value)}
                style={{ ...INPUT, appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32, cursor: 'pointer' }}>
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {/* Keywords */}
          <div>
            <label style={LABEL}>Keywords <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              If a specimen description contains any of these words, the case routes to the pool above. Case-insensitive, partial match.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type keyword and press Enter or Add"
                style={{ ...INPUT, flex: 1 }}
              />
              <button onClick={addKeyword}
                style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid rgba(138,180,248,0.3)', background: 'rgba(138,180,248,0.1)', color: '#8AB4F8', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Add
              </button>
            </div>
            {keywords.length === 0 ? (
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: 12, color: '#4b5563', textAlign: 'center' }}>
                No keywords yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {keywords.map(kw => (
                  <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(138,180,248,0.1)', color: '#8AB4F8', border: '1px solid rgba(138,180,248,0.2)' }}>
                    {kw}
                    <span onClick={() => setKeywords(prev => prev.filter(k => k !== kw))}
                      style={{ cursor: 'pointer', fontSize: 13, opacity: 0.6, lineHeight: 1 }}>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label style={LABEL}>Priority</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="number" min={1} max={999} value={priority}
                onChange={e => setPriority(parseInt(e.target.value) || 1)}
                style={{ ...INPUT, width: 100 }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Lower number = checked first. Built-in rules use 10–60. Custom rules default to 100.
              </span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={LABEL}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Added for thyroid specimens pending thoracic subspecialty setup"
              style={INPUT} />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={() => setActive(v => !v)}
              style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, background: active ? '#22c55e' : '#374151', boxShadow: active ? '0 0 8px #22c55e55' : 'none' }}>
              <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: active ? 23 : 3 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#22c55e' : '#6b7280' }}>{active ? 'Active' : 'Inactive'}</span>
          </div>

          {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
        </div>

        <div style={{ ...modalFooterStyle, padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button style={cancelButtonStyle} onClick={onClose}>Cancel</button>
          <button style={{ ...applyButtonStyle, opacity: keywords.length === 0 || !subspecialtyId ? 0.5 : 1 }} onClick={handleSave}>
            {mode === 'add' ? 'Add Rule' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const RoutingRulesSection: React.FC = () => {
  const [rules,       setRules]       = useState<RoutingRule[]>(loadRoutingRules);
  const [pools,       setPools]       = useState<Subspecialty[]>([]);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState<'all' | 'active' | 'inactive' | 'custom'>('all');
  const [modal,       setModal]       = useState<{ mode: 'add' | 'edit'; rule?: RoutingRule } | null>(null);
  const [testInput,   setTestInput]   = useState('');
  const [testResult,  setTestResult]  = useState<ReturnType<typeof testSpecimenRouting> | null>(null);

  useEffect(() => {
    subspecialtyService.getAll().then(res => {
      if (res.ok) setPools(res.data.filter((s: Subspecialty) => s.active && s.isWorkgroup));
    });
  }, []);

  const persist = (next: RoutingRule[]) => { setRules(next); saveRoutingRules(next); };

  const handleSave = (draft: Omit<RoutingRule, 'id' | 'builtIn'>) => {
    if (modal?.mode === 'add') {
      const newRule: RoutingRule = { ...draft, id: 'rule-custom-' + Date.now(), builtIn: false };
      persist([...rules, newRule].sort((a, b) => a.priority - b.priority));
    } else if (modal?.rule) {
      persist(rules.map(r => r.id === modal.rule!.id ? { ...r, ...draft } : r).sort((a, b) => a.priority - b.priority));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    // Safety guard — built-in rules cannot be deleted even if called programmatically
    if (BUILT_IN_ROUTING_RULES.some(r => r.id === id)) return;
    if (!window.confirm('Delete this routing rule?')) return;
    persist(rules.filter(r => r.id !== id));
  };

  const handleToggle = (id: string) => {
    persist(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleTest = () => {
    if (!testInput.trim()) return;
    setTestResult(testSpecimenRouting(testInput));
  };

  const filtered = rules.filter(r => {
    const matchSearch = !search ||
      r.keywords.some(k => k.includes(search.toLowerCase())) ||
      (r.note ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? r.active :
      filter === 'inactive' ? !r.active :
      filter === 'custom'   ? !r.builtIn : true;
    return matchSearch && matchFilter;
  });

  const poolName = (id: string) => pools.find(p => p.id === id)?.name ?? id;
  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', paddingRight: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Routing Rules</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Keyword rules that map specimen descriptions to subspecialty pools.
            Rules are checked in priority order — first match wins.
          </p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #1a6080, #0d4a63)', border: '1px solid #2a7a9a', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Add Rule
        </button>
      </div>

      {/* Test specimen description */}
      <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(138,180,248,0.04)', border: '1px solid rgba(138,180,248,0.12)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8AB4F8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Test Routing
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={testInput}
            onChange={e => { setTestInput(e.target.value); setTestResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
            placeholder="Enter a specimen description to test routing…"
            style={{ ...INPUT, flex: 1 }}
          />
          <button onClick={handleTest}
            style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: '#8AB4F8', color: '#0d1117', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Test
          </button>
        </div>
        {testResult && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: testResult.matched ? 'rgba(34,197,94,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${testResult.matched ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
            {testResult.matched ? (
              <div style={{ fontSize: 13, color: '#22c55e' }}>
                ✓ Routes to <strong>{poolName(testResult.subspecialtyId!)}</strong> pool
                {testResult.rule && (
                  <span style={{ color: '#4b5563', fontSize: 12, marginLeft: 8 }}>
                    via rule "{testResult.rule.note ?? testResult.rule.id}" (priority {testResult.rule.priority})
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#fbbf24' }}>
                ⚠ No matching rule — would route to fallback pool
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input type="text" placeholder="Search keywords or notes…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 16px', fontSize: 13, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none' }} />
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{ padding: '9px 36px 9px 14px', fontSize: 13, color: '#d1d5db', background: '#0f0f0f', border: '1px solid #1f2937', borderRadius: 8, outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="custom">Custom only</option>
        </select>
      </div>

      {/* Rules table */}
      <div style={{ border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Pri.', 'Routes to Pool', 'Keywords', 'Note', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rule, i) => (
                <tr key={rule.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #111827' : 'none', opacity: rule.active ? 1 : 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Priority */}
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, color: '#6b7280', width: 50 }}>
                    {rule.priority}
                  </td>
                  {/* Pool */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{poolName(rule.subspecialtyId)}</div>
                    {rule.builtIn && <div style={{ fontSize: 10, color: '#4b5563' }}>built-in</div>}
                  </td>
                  {/* Keywords */}
                  <td style={{ padding: '12px 14px', maxWidth: 360 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {rule.keywords.slice(0, 8).map(kw => (
                        <span key={kw} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: 'rgba(138,180,248,0.08)', color: '#8AB4F8', border: '1px solid rgba(138,180,248,0.15)' }}>{kw}</span>
                      ))}
                      {rule.keywords.length > 8 && (
                        <span style={{ fontSize: 11, color: '#4b5563', padding: '1px 7px' }}>+{rule.keywords.length - 8} more</span>
                      )}
                    </div>
                  </td>
                  {/* Note */}
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', maxWidth: 180 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rule.note ?? '—'}
                    </span>
                  </td>
                  {/* Toggle */}
                  <td style={{ padding: '12px 14px' }}>
                    <div onClick={() => handleToggle(rule.id)}
                      style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: rule.active ? '#22c55e' : '#374151', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: rule.active ? 18 : 2 }} />
                    </div>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setModal({ mode: 'edit', rule })}
                      style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#e5e7eb', background: '#1c1c1c', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer', marginRight: 6 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#252525'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1c1c1c'}>
                      Edit
                    </button>
                    {!rule.builtIn && (
                      <button onClick={() => handleDelete(rule.id)}
                        style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>No rules match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer count */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#22c55e' }}>●</span> Changes save automatically
        </div>
        <div>{rules.filter(r => r.active).length} active · {rules.length} total · {rules.filter(r => !r.builtIn).length} custom</div>
      </div>

      {modal && (
        <RuleModal
          mode={modal.mode}
          rule={modal.rule}
          pools={pools}
          allRules={rules}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default RoutingRulesSection;
