import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Plus, Search, Upload, Loader2 } from 'lucide-react';
import { VoiceMacro } from '../../types/voiceMacros';
import { MockVoiceMacroService } from '../../services/voicemacro/mockVoiceService';
import { usepathscribeSpeech }   from '../../hooks/usepathscribeSpeech';

// Initialize the service instance
const macroService = new MockVoiceMacroService();

const SpeechConfigTab: React.FC = () => {
  // --- State ---
  const [voiceMacros, setVoiceMacros] = useState<VoiceMacro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Hook into the Voice Engine here
  const { isListening, transcript, startListening } = usepathscribeSpeech();
  
  // Hover states for UI feedback
  const [hoveredEditId, setHoveredEditId] = useState<string | null>(null);
  const [hoveredTrashId, setHoveredTrashId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const loadMacros = async () => {
      try {
        const data = await macroService.getMacros();
        setVoiceMacros(data);
      } catch (error) {
        console.error("Failed to fetch macros:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMacros();
  }, []);

  // --- Handlers ---
  const handleAddMacro = async () => {
    const newMacroData = { spoken: "", written: "", isActive: true };
    try {
      const id = await macroService.addMacro(newMacroData);
      const newMacro = { ...newMacroData, id };
      setVoiceMacros(prev => [newMacro, ...prev]);
      setEditingId(id);
    } catch (error) {
      console.error("Error adding macro:", error);
    }
  };

  const handleSave = async (id: string) => {
    const macro = voiceMacros.find(m => m.id === id);
    if (macro) {
      try {
        await macroService.updateMacro(id, macro);
        setEditingId(null);
      } catch (error) {
        console.error("Error updating macro:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await macroService.deleteMacro(id);
      setVoiceMacros(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Error deleting macro:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const rows = content.split('\n').filter(row => row.trim() !== '');
        const newMacrosRaw = rows.map(row => {
          const [spoken, written] = row.split(',').map(s => s.trim());
          return { spoken: spoken || "New Macro", written: written || "", isActive: true };
        });
        
        await macroService.bulkImport(newMacrosRaw);
        const refreshedData = await macroService.getMacros();
        setVoiceMacros(refreshedData);
      } catch (err) {
        alert("Check your file format. Use a CSV with: name, resulting text");
      }
    };
    reader.readAsText(file);
  };

  // --- Filtering Logic ---
  const filteredMacros = useMemo(() => {
    return voiceMacros.filter(m => {
      const matchesSearch = m.spoken.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.written.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : 
                            statusFilter === "active" ? m.isActive : !m.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [voiceMacros, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
        <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
        <span>Loading voice macros...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px', color: '#fff' }}>
      {/* CSS Pulse Animation */}
      <style>
        {`
          @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}
      </style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Voice & Speech Macros</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage custom shorthand and voice triggers.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Transcript Feedback */}
          {transcript && (
            <div style={{ 
              padding: '6px 12px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.2)', 
              borderRadius: '6px', 
              color: '#22c55e', 
              fontSize: '13px',
              marginRight: '8px'
            }}>
              Heard: <strong>"{transcript}"</strong>
            </div>
          )}

          {/* Test Voice Button */}
          <button 
            onClick={startListening}
            style={{ 
              background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'rgba(8, 145, 178, 0.1)', 
              color: isListening ? '#ef4444' : '#0891B2', 
              border: `1px solid ${isListening ? '#ef4444' : '#0891B2'}`, 
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600
            }}
          >
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: isListening ? '#ef4444' : '#0891B2',
              animation: isListening ? 'pulse-red 1.5s infinite' : 'none'
            }} />
            {isListening ? "Listening..." : "Test Voice"}
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" style={{ display: 'none' }} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', 
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 
            }}
          >
            <Upload size={16} /> Bulk Import
          </button>
          <button 
            onClick={handleAddMacro}
            style={{ background: '#0891B2', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}
          >
            <Plus size={16} /> Add Macro
          </button>
        </div>
      </div>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input 
            type="text" 
            placeholder="Search macros..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', height: '32px', paddingLeft: '36px', 
              background: '#090e1a', border: '1px solid #1e293b', 
              borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' 
            }}
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ 
            height: '32px', background: '#090e1a', border: '1px solid #1e293b', 
            borderRadius: '4px', color: '#cbd5e1', padding: '0 12px', 
            fontSize: '12px', cursor: 'pointer', outline: 'none', minWidth: '120px'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e293b' }}>
            <th style={{ width: '25%', textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
            <th style={{ width: '45%', textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resulting Text</th>
            <th style={{ width: '15%', textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
            <th style={{ width: '15%', textAlign: 'center', padding: '12px 16px', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMacros.map((macro) => {
            const isEditing = editingId === macro.id;
            return (
              <tr key={macro.id} style={{ borderBottom: '1px solid #0f172a', height: '60px' }}>
                <td style={{ padding: '0 16px' }}>
                  {isEditing ? (
                    <input 
                      autoFocus
                      value={macro.spoken} 
                      onChange={(e) => setVoiceMacros(prev => prev.map(m => m.id === macro.id ? {...m, spoken: e.target.value} : m))}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{macro.spoken}</span>
                  )}
                </td>
                <td style={{ padding: '0 16px' }}>
                  {isEditing ? (
                    <input 
                      value={macro.written} 
                      onChange={(e) => setVoiceMacros(prev => prev.map(m => m.id === macro.id ? {...m, written: e.target.value} : m))}
                      style={{ width: '100%', background: '#020617', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{macro.written}</span>
                  )}
                </td>
                <td style={{ padding: '0 16px' }}>
                  <button 
                    disabled={!isEditing}
                    onClick={() => setVoiceMacros(prev => prev.map(m => m.id === macro.id ? {...m, isActive: !m.isActive} : m))}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', 
                      background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent', 
                      border: isEditing ? '1px solid #1e293b' : '1px solid transparent',
                      padding: '4px 8px', borderRadius: '4px', color: macro.isActive ? '#22c55e' : '#94a3b8',
                      cursor: isEditing ? 'pointer' : 'default',
                      width: 'fit-content'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: macro.isActive ? '#22c55e' : '#475569' }} />
                    {macro.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={{ padding: '0 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                    {isEditing ? (
                      <button 
                        onClick={() => handleSave(macro.id)}
                        style={{ background: '#0891B2', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setEditingId(macro.id)}
                          onMouseEnter={() => setHoveredEditId(macro.id)}
                          onMouseLeave={() => setHoveredEditId(null)}
                          style={{ 
                            background: hoveredEditId === macro.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: '#fff', border: '1px solid rgba(255,255,255,0.3)', 
                            padding: '4px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(macro.id)}
                          onMouseEnter={() => setHoveredTrashId(macro.id)}
                          onMouseLeave={() => setHoveredTrashId(null)}
                          style={{ 
                            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                            color: hoveredTrashId === macro.id ? '#ef4444' : '#94a3b8', opacity: hoveredTrashId === macro.id ? 1 : 0.65
                          }}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SpeechConfigTab;
