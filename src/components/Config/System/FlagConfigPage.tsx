import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import '../../../pathscribe.css';
import { Flag, TagClass, DataSourceType } from '../../../services/flags/IFlagService';
import { IconKey } from '../../../types/smarttag.types';
import { flagService } from '../../../services';
import { COMP_AUDIT } from '../../../constants/computationalActions';
import { useAuditLog } from '../../Audit/useAuditLog';
import AutoCreatedBanner from '../../Flags/AutoCreatedBanner';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Informational',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const ICON_KEY_OPTIONS: IconKey[] = [
  'ihc', 'fish', 'molecular', 'flow-cytometry',
  'cytogenetics', 'micro', 'coag', 'generic-lab',
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        background: value ? 'var(--ps-conf-green)' : 'var(--ps-conf-text-dim)',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        left: value ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? 'var(--ps-conf-green)' : 'var(--ps-conf-text-3)' }}>
      {value ? 'Active' : 'Inactive'}
    </span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const FlagConfigPage: React.FC = () => {
  const { log } = useAuditLog();
  const modalRef = useRef<HTMLDivElement>(null);
  const [flags,         setFlags]         = useState<Flag[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [editingFlag,   setEditingFlag]   = useState<Flag | null>(null);
  useFocusTrap(modalRef, showModal);

  // Available protocols for the defaultProtocolIds picker
  const [availableProtocols, setAvailableProtocols] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    import('@/services/templates/templateService').then(m =>
      m.listTemplates('published').then((templates: any[]) =>
        setAvailableProtocols(templates.map(t => ({ id: t.id, name: t.name })))
      )
    ).catch(() => {});
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name,          setName]          = useState('');
  const [description,   setDescription]   = useState('');
  const [level,         setLevel]         = useState<'Case' | 'Specimen'>('Case');
  const [lisCode,       setLisCode]       = useState('');
  const [active,        setActive]        = useState(true);
  const [severity,      setSeverity]      = useState<1|2|3|4|5>(1);
  const [tagClass,      setTagClass]      = useState<TagClass>('ADMINISTRATIVE');

  // Computational fields
  const [iconKey,          setIconKey]          = useState<IconKey>('generic-lab');
  const [dataSourceType,   setDataSourceType]   = useState<DataSourceType>('lis');
  const [defaultProtocolIds, setDefaultProtocolIds] = useState<string[]>([]);
  const [protocolSearch,   setProtocolSearch]   = useState('');
  const [endpoint,      setEndpoint]      = useState('');
  const [sourceId,      setSourceId]      = useState('');
  const [resultPath,    setResultPath]    = useState('');
  const [pollInterval,  setPollInterval]  = useState('');

  // ── Filter state ──────────────────────────────────────────────────────────
  const [errors,        setErrors]        = useState<{ name?: string; endpoint?: string; sourceId?: string }>({});
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'All' | 'Active' | 'Inactive'>('All');
  const [levelFilter,   setLevelFilter]   = useState<'All' | 'Case' | 'Specimen'>('All');
  const [classFilter,   setClassFilter]   = useState<'All' | TagClass>('All');
  const [reviewingAutoCreated, setReviewingAutoCreated] = useState(false);

  useEffect(() => { loadFlags(); }, []);

  const loadFlags = async () => {
    setLoading(true);
    const res = await flagService.getAll();
    if (res.ok) setFlags(res.data);
    setLoading(false);
  };

  // ── Auto-created flags ────────────────────────────────────────────────────

  const autoCreatedFlags = flags.filter(f => f.autoCreated && f.status === 'Active');

  const handleReviewAutoCreated = () => {
    setReviewingAutoCreated(true);
    setSearch('');
    setStatusFilter('All');
    setLevelFilter('All');
    setClassFilter('All');
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setName(''); setDescription(''); setLevel('Case'); setLisCode('');
    setActive(true); setSeverity(1); setTagClass('ADMINISTRATIVE');
    setIconKey('generic-lab'); setEndpoint(''); setSourceId('');
    setDataSourceType('lis'); setDefaultProtocolIds([]); setProtocolSearch('');
    setResultPath(''); setPollInterval(''); setErrors({});
  };

  const openAddModal = () => {
    setEditingFlag(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (flag: Flag) => {
    setEditingFlag(flag);
    setName(flag.name);
    setDescription(flag.description ?? '');
    setLevel(flag.level);
    setLisCode(flag.lisCode);
    setActive(flag.status === 'Active');
    setSeverity(flag.severity);
    setTagClass(flag.tagClass);
    setIconKey(flag.iconKey ?? 'generic-lab');
    setDataSourceType((flag as any).dataSourceType ?? 'lis');
    setDefaultProtocolIds(flag.defaultProtocolIds ?? []);
    setEndpoint(flag.dataSource?.endpoint ?? '');
    setSourceId(flag.dataSource?.sourceId ?? '');
    setResultPath(flag.dataSource?.resultPath ?? '');
    setPollInterval(flag.dataSource?.pollIntervalMs?.toString() ?? '');
    setErrors({});
    setShowModal(true);
  };

  const requestSave = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (tagClass === 'COMPUTATIONAL') {
      if (dataSourceType !== 'pathscribe') {
        if (!endpoint.trim()) e.endpoint = `Endpoint is required for ${dataSourceType === 'lis' ? 'LIS' : 'AI Extraction'} source type`;
        if (!sourceId.trim()) e.sourceId = 'Source ID is required for Computational flags';
      }
    }
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setShowModal(false);
    setShowConfirm(true);
  };

  const buildPayload = (): Omit<Flag, 'id'> => {
    const base = {
      name, description, level, lisCode, severity,
      status: (active ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
      tagClass,
      autoCreated: false,
    };

    if (tagClass === 'COMPUTATIONAL') {
      return {
        ...base,
        iconKey,
        dataSourceType,
        defaultProtocolIds: defaultProtocolIds.length > 0 ? defaultProtocolIds : undefined,
        dataSource: {
          sourceId,
          endpoint,
          resultPath: resultPath.trim() || undefined,
          pollIntervalMs: pollInterval ? parseInt(pollInterval, 10) : undefined,
        },
      };
    }

    return base;
  };

  const confirmSave = async () => {
    const payload = buildPayload();

    if (editingFlag) {
      const res = await flagService.update(editingFlag.id, payload);
      if (res.ok) {
        setFlags(prev => prev.map(f => f.id === res.data.id ? res.data : f));
        // Audit: track changes
        const changes: string[] = [];
        if (name        !== editingFlag.name)                         changes.push('name');
        if (description !== (editingFlag.description ?? ''))          changes.push('description');
        if (tagClass    !== editingFlag.tagClass)                     changes.push('tagClass');
        if (lisCode     !== (editingFlag.lisCode ?? ''))              changes.push('lisCode');
        if (dataSourceType !== (editingFlag as any).dataSourceType)   changes.push('dataSourceType');
        if (sourceId    !== ((editingFlag as any).dataSource?.sourceId ?? ''))  changes.push('sourceId');
        if (endpoint    !== ((editingFlag as any).dataSource?.endpoint ?? ''))  changes.push('endpoint');
        const prevProtos  = ((editingFlag as any).defaultProtocolIds ?? []) as string[];
        const addedProtos   = defaultProtocolIds.filter(id => !prevProtos.includes(id));
        const removedProtos = prevProtos.filter(id => !defaultProtocolIds.includes(id));
        if (addedProtos.length > 0 || removedProtos.length > 0) changes.push('defaultProtocols');

        if (!active && editingFlag.status === 'Active' && editingFlag.tagClass === 'COMPUTATIONAL') {
          log(COMP_AUDIT.CONFIG_FLAG_DEACTIVATED, { flagId: editingFlag.id, flagName: editingFlag.name });
        }
        if (changes.length > 0) {
          log(COMP_AUDIT.CONFIG_FLAG_UPDATED, { flagId: editingFlag.id, changes });
        }
        addedProtos.forEach(id   => log(COMP_AUDIT.CONFIG_PROTOCOL_LINKED,   { flagId: editingFlag.id, protocolId: id }));
        removedProtos.forEach(id => log(COMP_AUDIT.CONFIG_PROTOCOL_UNLINKED, { flagId: editingFlag.id, protocolId: id }));
      }
    } else {
      const res = await flagService.add(payload);
      if (res.ok) {
        setFlags(prev => [...prev, res.data]);
        // Audit: new flag
        if (tagClass === 'COMPUTATIONAL') {
          log(COMP_AUDIT.CONFIG_FLAG_CREATED, {
            flagId: res.data.id, flagName: name, dataSourceType, lisCode
          });
          defaultProtocolIds.forEach(id => log(COMP_AUDIT.CONFIG_PROTOCOL_LINKED, {
            flagId: res.data.id, protocolId: id
          }));
        }
      }
    }
    setShowConfirm(false);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = flags.filter(f => {
    if (reviewingAutoCreated) return !!f.autoCreated;
    const matchSearch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.lisCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' ? f.status === 'Active' : f.status === 'Inactive');
    const matchLevel  = levelFilter === 'All' || f.level === levelFilter;
    const matchClass  = classFilter === 'All' || f.tagClass === classFilter;
    return matchSearch && matchStatus && matchLevel && matchClass;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Auto-created banner ── */}
      {autoCreatedFlags.length > 0 && (
        <AutoCreatedBanner flags={autoCreatedFlags} onReview={handleReviewAutoCreated} />
      )}

      {reviewingAutoCreated && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--ps-conf-text-3)' }}>
            Showing {autoCreatedFlags.length} auto-created flag{autoCreatedFlags.length !== 1 ? 's' : ''} pending review
          </span>
          <button className="ps-conf-btn-secondary" onClick={() => setReviewingAutoCreated(false)}>
            Clear filter
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ps-conf-section-header">
        <div>
          <h3 className="ps-conf-section-title">Case &amp; Specimen Flags</h3>
          <p className="ps-conf-section-subtitle">Manage administrative and computational flags used in case workflows</p>
        </div>
        <button className="ps-conf-btn-primary" onClick={openAddModal}>+ Add Flag</button>
      </div>

      {/* ── Filters ── */}
      {!reviewingAutoCreated && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search flags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-conf-search"
            style={{ flex: 1, minWidth: 180 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="ps-conf-select">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)} className="ps-conf-select">
            <option value="All">All Levels</option>
            <option value="Case">Case</option>
            <option value="Specimen">Specimen</option>
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value as any)} className="ps-conf-select">
            <option value="All">All Types</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="COMPUTATIONAL">Computational</option>
          </select>
        </div>
      )}

      {/* ── Table ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="ps-conf-th">Name</th>
            <th className="ps-conf-th">Type</th>
            <th className="ps-conf-th">Level</th>
            <th className="ps-conf-th">LIS Code</th>
            <th className="ps-conf-th">Severity</th>
            <th className="ps-conf-th">Status</th>
            <th className="ps-conf-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(flag => (
            <tr key={flag.id}>
              <td className="ps-conf-td">
                {flag.name}
                {flag.autoCreated && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 600,
                    background: 'var(--ps-conf-amber-bg, #fef9e7)',
                    color: 'var(--ps-conf-amber, #b7791f)',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    LIS import
                  </span>
                )}
              </td>
              <td className="ps-conf-td">
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: flag.tagClass === 'COMPUTATIONAL' ? 'var(--ps-conf-teal)' : 'var(--ps-conf-text-3)',
                }}>
                  {flag.tagClass === 'COMPUTATIONAL' ? 'Computational' : 'Administrative'}
                </span>
              </td>
              <td className="ps-conf-td" style={{ color: 'var(--ps-conf-text-3)' }}>{flag.level}</td>
              <td className="ps-conf-td" style={{ color: 'var(--ps-conf-text-3)' }}>{flag.lisCode}</td>
              <td className="ps-conf-td" style={{ color: 'var(--ps-conf-text-3)' }}>
                {SEVERITY_LABELS[flag.severity]} ({flag.severity})
              </td>
              <td className="ps-conf-td">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                    background: flag.status === 'Active' ? 'var(--ps-conf-green)' : 'var(--ps-conf-text-dim)',
                  }} />
                  <span style={{ fontSize: 13, color: flag.status === 'Active' ? 'var(--ps-conf-text)' : 'var(--ps-conf-text-3)' }}>
                    {flag.status}
                  </span>
                </div>
              </td>
              <td className="ps-conf-td">
                <button className="ps-conf-btn-row" onClick={() => openEditModal(flag)}>Edit</button>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && (
            <tr>
              <td className="ps-conf-td" style={{ color: 'var(--ps-conf-text-3)' }} colSpan={7}>
                No flags found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="ps-conf-backdrop">
          <div className="ps-conf-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="flag-modal-title" style={{ maxWidth: tagClass === 'COMPUTATIONAL' ? 1060 : 560, width: '100%', transition: 'max-width 0.2s ease', padding: '24px' }}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--ps-conf-border)' }}>
              <span id="flag-modal-title">{editingFlag ? 'Edit Flag' : 'Create Flag'}</span>
            </h3>

            {/* Tag class toggle */}
            <label className="ps-conf-label">Type</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {(['ADMINISTRATIVE', 'COMPUTATIONAL'] as TagClass[]).map(tc => (
                <label
                  key={tc}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    border: `1.5px solid ${tagClass === tc ? 'var(--ps-conf-teal)' : 'var(--ps-conf-border)'}`,
                    color: tagClass === tc ? 'var(--ps-conf-teal)' : 'var(--ps-conf-text-3)',
                    background: tagClass === tc ? 'var(--ps-conf-teal-bg, rgba(56,189,248,0.06))' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    checked={tagClass === tc}
                    onChange={() => setTagClass(tc)}
                    style={{ display: 'none' }}
                  />
                  {tc === 'ADMINISTRATIVE' ? 'Administrative' : 'Computational'}
                </label>
              ))}
            </div>

            {/* Two-column layout: left = common fields, right = computational (conditional) */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

              {/* LEFT PANEL */}
              <div style={{ flex: '0 0 460px', minWidth: 0 }}>
                <label className="ps-conf-label">Name <span style={{ color: 'var(--ps-conf-red)' }}>*</span></label>
                <input value={name} onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                  className="ps-conf-input" placeholder="Flag name"
                  style={{ marginBottom: errors.name ? 4 : 16, borderColor: errors.name ? 'var(--ps-conf-red)' : undefined }} />
                {errors.name && <div style={{ fontSize: 11, color: 'var(--ps-conf-red)', marginBottom: 12 }}>{errors.name}</div>}

                <label className="ps-conf-label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  className="ps-conf-input" placeholder="Brief description of this flag"
                  style={{ height: 70, resize: 'vertical', marginBottom: 16 }} />

                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label className="ps-conf-label">Level</label>
                    <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                      {(['Case', 'Specimen'] as const).map(l => (
                        <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="radio" checked={level === l} onChange={() => setLevel(l)} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="ps-conf-label">Severity</label>
                    <select value={severity} onChange={e => setSeverity(Number(e.target.value) as 1|2|3|4|5)} className="ps-conf-input" style={{ marginBottom: 0 }}>
                      {Object.entries(SEVERITY_LABELS).map(([v, l]) => <option key={v} value={v}>{v} — {l}</option>)}
                    </select>
                  </div>
                </div>

                <label className="ps-conf-label">LIS Code</label>
                <input value={lisCode} onChange={e => setLisCode(e.target.value)}
                  className="ps-conf-input" placeholder="e.g. STAT, MAL, IHC"
                  style={{ marginBottom: 16 }} />
              </div>

              {/* RIGHT PANEL — only shown for COMPUTATIONAL */}
              {tagClass === 'COMPUTATIONAL' && (
                <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--ps-conf-border)', paddingLeft: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ps-conf-teal)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Computational settings
                  </div>

                  {/* Icon + Source type side by side */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: '0 0 140px' }}>
                      <label className="ps-conf-label">Icon</label>
                      <select className="ps-conf-input" style={{ marginBottom: 0 }} value={iconKey} onChange={e => setIconKey(e.target.value as IconKey)}>
                        {ICON_KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="ps-conf-label">Data source type</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {([
                          { value: 'lis'        as DataSourceType, label: 'LIS',        hint: 'Direct REST call to LIS' },
                          { value: 'ai-extract' as DataSourceType, label: 'AI Extract', hint: 'AI proxy parses LIS text' },
                          { value: 'pathscribe' as DataSourceType, label: 'PS Entry',   hint: 'Captured in synoptic' },
                        ]).map(opt => (
                          <label key={opt.value} title={opt.hint}
                            className="comp-source-radio"
                            data-selected={dataSourceType === opt.value ? 'true' : 'false'}>
                            <input type="radio" className="ps-radio-hidden" checked={dataSourceType === opt.value}
                              onChange={() => setDataSourceType(opt.value)} />
                            <span className="comp-source-radio-label">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PathScribe entry info OR endpoint fields */}
                  {dataSourceType === 'pathscribe' ? (
                    <div style={{ padding: '10px 12px', borderRadius: 6, marginBottom: 8, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 12, color: 'var(--ps-conf-text-3)', lineHeight: 1.6 }}>
                      Result captured in the synoptic checklist. No LIS endpoint required.
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <div style={{ flex: '0 0 130px' }}>
                          <label className="ps-conf-label">Source ID <span style={{ color: 'var(--ps-conf-red)' }}>*</span></label>
                          <input value={sourceId} onChange={e => { setSourceId(e.target.value); setErrors(prev => ({ ...prev, sourceId: '' })); }}
                            className="ps-conf-input" placeholder="e.g. her2-ihc"
                            style={{ marginBottom: 0, borderColor: errors.sourceId ? 'var(--ps-conf-red)' : undefined }} />
                          {errors.sourceId && <div style={{ fontSize: 10, color: 'var(--ps-conf-red)', marginTop: 2 }}>{errors.sourceId}</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="ps-conf-label">
                            {dataSourceType === 'ai-extract' ? 'AI Endpoint' : 'API Endpoint'}
                            <span style={{ color: 'var(--ps-conf-red)' }}> *</span>
                          </label>
                          <input value={endpoint} onChange={e => { setEndpoint(e.target.value); setErrors(prev => ({ ...prev, endpoint: '' })); }}
                            className="ps-conf-input"
                            placeholder={dataSourceType === 'ai-extract' ? '/api/extract/ihc' : '/api/results/ihc/her2'}
                            style={{ marginBottom: 0, borderColor: errors.endpoint ? 'var(--ps-conf-red)' : undefined }} />
                          {errors.endpoint && <div style={{ fontSize: 10, color: 'var(--ps-conf-red)', marginTop: 2 }}>{errors.endpoint}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label className="ps-conf-label" style={{ fontSize: 10 }}>Result path (optional)</label>
                          <input value={resultPath} onChange={e => setResultPath(e.target.value)}
                            className="ps-conf-input" placeholder="results.her2" style={{ marginBottom: 0 }} />
                        </div>
                        <div style={{ flex: '0 0 120px' }}>
                          <label className="ps-conf-label" style={{ fontSize: 10 }}>Poll ms (optional)</label>
                          <input type="number" value={pollInterval} onChange={e => setPollInterval(e.target.value)}
                            className="ps-conf-input" placeholder="30000" style={{ marginBottom: 0 }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Default protocols */}
                  <div style={{ marginTop: 10 }}>
                    <label className="ps-conf-label">
                      Default protocols <span style={{ color: 'var(--ps-conf-text-3)', fontWeight: 400 }}>(suggested when ordered)</span>
                    </label>
                    <div style={{ position: 'relative', marginBottom: 6 }}>
                      <input type="text" placeholder="Search protocols..." value={protocolSearch}
                        onChange={e => setProtocolSearch(e.target.value)}
                        className="ps-conf-input"
                        style={{ marginBottom: 0, paddingLeft: 28, fontSize: 12 }} />
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                        style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ps-conf-text-3)', pointerEvents: 'none' }}>
                        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--ps-conf-border)', borderRadius: 6, padding: 6, maxHeight: 100, overflowY: 'auto' }}>
                      {availableProtocols.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--ps-conf-text-3)', padding: '4px 2px' }}>No published protocols available</div>
                      )}
                      {availableProtocols
                        .filter(p => !protocolSearch || p.name.toLowerCase().includes(protocolSearch.toLowerCase()))
                        .map(p => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', cursor: 'pointer', fontSize: 12, color: defaultProtocolIds.includes(p.id) ? 'var(--ps-conf-teal)' : 'var(--ps-conf-text)' }}>
                            <input type="checkbox" checked={defaultProtocolIds.includes(p.id)}
                              onChange={e => setDefaultProtocolIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                              style={{ accentColor: 'var(--ps-conf-teal)' }} />
                            {p.name}
                          </label>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

            </div>
            <label className="ps-conf-label" style={{ marginTop: 16 }}>Status</label>
            <Toggle value={active} onChange={setActive} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, gap: 10, borderTop: '1px solid var(--ps-conf-border)' }}>
              <button className="ps-conf-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="ps-conf-btn-primary" onClick={requestSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <div className="ps-conf-backdrop">
          <div className="ps-conf-modal" style={{ width: 420 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
              {editingFlag ? 'Save Changes' : 'Create Flag'}
            </h2>
            <div style={{ height: 1, background: 'var(--ps-conf-border)', marginBottom: 16 }} />
            <p style={{ marginBottom: 24, color: 'var(--ps-conf-text-3)', fontSize: 14 }}>
              Are you sure you want to apply these changes?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="ps-conf-btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="ps-conf-btn-primary" onClick={confirmSave}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlagConfigPage;
