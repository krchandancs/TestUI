import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { macroService } from '../../../services';
import PathScribeEditor, { Macro } from '../../Editor/PathScribeEditor';

interface MacroPanelProps {
  approvedFonts: string[];
}

const MacroPanel: React.FC<MacroPanelProps> = ({ approvedFonts }) => {
  const [macros,        setMacros]        = useState<Macro[]>([]);
  const [loadingMacros, setLoadingMacros] = useState(true);

  useEffect(() => {
    macroService.getAll().then(res => {
      if (res.ok) {
        setMacros(res.data
          .filter(m => m.status === 'Active')
          .map(m => ({ id: m.id, trigger: m.shortcut, name: m.name, content: m.content }))
        );
      }
      setLoadingMacros(false);
    });
  }, []);

    const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [trigger, setTrigger] = useState('');
  const [macroName, setMacroName] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const selectedMacro = macros.find(m => m.id === selectedMacroId) ?? null;

  const handleSelectMacro = (id: string) => {
    const macro = macros.find(m => m.id === id);
    if (!macro) return;
    setSelectedMacroId(id);
    setTrigger(macro.trigger);
    setMacroName(macro.name);
    setEditorContent(macro.content);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedMacroId(null);
    setTrigger('');
    setMacroName('');
    setEditorContent('');
  };

  const handleSave = async () => {
    if (!trigger.trim() || !macroName.trim()) {
      alert('Please enter both a trigger shortcut and a macro name.');
      return;
    }
    if (!trigger.startsWith(';')) {
      alert('Trigger must start with ";" (e.g. ;gs)');
      return;
    }

    if (selectedMacroId) {
      const res = await macroService.update(selectedMacroId, {
        shortcut: trigger.trim(), name: macroName.trim(), content: editorContent,
      });
      if (res.ok) {
        setMacros(prev => prev.map(m =>
          m.id === selectedMacroId
            ? { ...m, trigger: trigger.trim(), name: macroName.trim(), content: editorContent }
            : m
        ));
      }
    } else {
      const res = await macroService.add({
        name: macroName.trim(), shortcut: trigger.trim(), content: editorContent,
        category: 'Custom', subspecialtyIds: [], snomedCodes: [], icdCodes: [],
        createdBy: 'current-user', status: 'Active',
      });
      if (res.ok) {
        const newMacro: Macro = { id: res.data.id, trigger: res.data.shortcut, name: res.data.name, content: res.data.content };
        setMacros(prev => [...prev, newMacro]);
        setSelectedMacroId(res.data.id);
        setIsCreatingNew(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedMacroId) return;
    if (!confirm(`Delete macro "${selectedMacro?.name}"?`)) return;
    const res = await macroService.deactivate(selectedMacroId);
    if (res.ok) {
      setMacros(prev => prev.filter(m => m.id !== selectedMacroId));
      setSelectedMacroId(null);
      setTrigger('');
      setMacroName('');
      setEditorContent('');
      setIsCreatingNew(false);
    }
  };

  const isDirty = selectedMacro
    ? trigger !== selectedMacro.trigger || macroName !== selectedMacro.name || editorContent !== selectedMacro.content
    : isCreatingNew;

  if (loadingMacros) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ps-conf-text-3)', fontSize: 14 }}>Loading macros...</div>
  );

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(var(--app-height, 100vh) - 280px)', minHeight: '560px' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="ps-conf-card" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ps-conf-text)', margin: 0 }}>My Macros</h3>
          <button
            onClick={handleCreateNew}
            style={{ padding: '5px 12px', background: 'var(--ps-conf-teal)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0e7490'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-conf-teal)'}
          >
            + New
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--ps-conf-text-dim)', padding: '8px 10px', background: 'rgba(8,145,178,0.08)', borderRadius: '6px', lineHeight: '1.5' }}>
          💡 Type a trigger shortcut while editing and press Space to auto-expand.
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {macros.map(macro => (
            <button
              key={macro.id}
              onClick={() => handleSelectMacro(macro.id)}
              style={{
                padding: '11px 12px',
                background: selectedMacroId === macro.id ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedMacroId === macro.id ? '#0891B2' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: selectedMacroId === macro.id ? '#38bdf8' : '#cbd5e1',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{macro.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--ps-conf-text-3)', fontFamily: 'monospace' }}>{macro.trigger}</div>
            </button>
          ))}

          {macros.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--ps-conf-text-dim)', fontSize: '13px', padding: '24px 0' }}>
              No macros yet.<br />Click + New to create one.
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        minWidth: 0,
      }}>
        {selectedMacroId || isCreatingNew ? (
          <>
            {/* Header row */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--ps-conf-text-2)', marginBottom: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Macro Name
                </label>
                <input
                  value={macroName}
                  onChange={e => setMacroName(e.target.value)}
                  placeholder="e.g., Gross Standard"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ width: '180px' }}>
                <label style={{ display: 'block', color: 'var(--ps-conf-text-2)', marginBottom: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Trigger Shortcut
                </label>
                <input
                  value={trigger}
                  onChange={e => setTrigger(e.target.value)}
                  placeholder=";gs"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--ps-conf-teal-light)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, overflow: 'hidden', borderRadius: '12px' }}>
            <PathScribeEditor
                key={selectedMacroId ?? 'new'}
                content={editorContent}
                onChange={setEditorContent}
                approvedFonts={approvedFonts}
                macros={macros}
                minHeight="350px"
                placeholder="Write your macro template here ..."
                showRulerDefault={false}
            />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
              {selectedMacroId && (
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '9px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.5)',
                    borderRadius: '8px',
                    color: 'var(--ps-conf-red)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty}
                style={{
                  padding: '9px 24px',
                  background: isDirty ? '#0891B2' : 'var(--ps-conf-border)',
                  border: 'none',
                  borderRadius: '8px',
                  color: isDirty ? '#fff' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDirty ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (isDirty) e.currentTarget.style.background = '#0e7490'; }}
                onMouseLeave={e => { if (isDirty) e.currentTarget.style.background = 'var(--ps-conf-teal)'; }}
              >
                {selectedMacroId ? 'Save Changes' : 'Create Macro'}
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ps-conf-text-3)',
            gap: '16px',
          }}
          className="ps-conf-card">
            <div style={{ fontSize: '56px' }}>⚡</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ps-conf-text-2)' }}>No Macro Selected</div>
            <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '360px', lineHeight: '1.7', color: 'var(--ps-conf-text-dim)' }}>
              Select a macro from the list to edit it, or click <strong style={{ color: '#0891B2' }}>+ New</strong> to create your first macro template.
            </div>
            <button
              onClick={handleCreateNew}
              style={{ padding: '10px 24px', background: 'var(--ps-conf-teal)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
            >
              + Create New Macro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroPanel;
