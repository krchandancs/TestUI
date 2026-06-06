import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { Subspecialty } from '../../../contexts/useSubspecialties';

// Expanded interface to include our new "Three Pillars" + Toggle
interface Props {
  isOpen: boolean;
  onClose: () => void;
  subId: string | null;
  onSave: (id: string, updates: Partial<Subspecialty>) => void;
  onAdd: (sub: Omit<Subspecialty, 'id'>) => void;
  initialData?: Subspecialty;
}

export const SubspecialtyEditorModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  subId, 
  onSave, 
  onAdd, 
  initialData 
}) => {
  // Mock data - Replace these with your actual context hooks
  const mockSpecimens = [
    { id: 'spec_1', name: 'Appendix' },
    { id: 'spec_2', name: 'Colon Biopsy' },
    { id: 'spec_3', name: 'Skin Shave/Punch' },
    { id: 'spec_4', name: 'Breast Core Biopsy' }
  ];

  const mockUsers = [
    { id: 'user_1', name: 'Dr. Sarah Johnson', role: 'Pathologist' },
    { id: 'user_2', name: 'Dr. Marcus Webb', role: 'Pathologist' }
  ];

  const mockClients = [
    { id: 'client_1', name: 'Northside Medical Center' },
    { id: 'client_2', name: 'City General Hospital' },
    { id: 'client_3', name: 'Valley Health Clinic' }
  ];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isWorkgroup, setIsWorkgroup] = useState(false);
  const [selectedSpecimenIds, setSelectedSpecimenIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'specimens' | 'users' | 'clients'>('specimens');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setIsWorkgroup(initialData?.isWorkgroup || false);
      setSelectedSpecimenIds(initialData?.specimenIds || []);
      setSelectedUserIds(initialData?.userIds || []);
      setSelectedClientIds(initialData?.clientIds || []);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Subspecialty, 'id'> = { 
      name, 
      description, 
      isWorkgroup,
      specimenIds: selectedSpecimenIds, 
      userIds: selectedUserIds,
      clientIds: selectedClientIds,
      active: true,
    };
    
    if (subId) onSave(subId, payload);
    else onAdd(payload);
    onClose();
  };

  const toggleSelection = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
     <h1 className="text-5xl text-red-500 bg-white p-10 z-[9999]">THIS IS THE NEW FILE</h1> 

    <div className="bg-[#111827] ...">
      
    </div>
      <div className="bg-[#111827] border border-gray-800 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              {subId ? `Edit ${name}` : 'New Subspecialty'}
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Enable Workgroup</span>
              <button 
                type="button"
                onClick={() => setIsWorkgroup(!isWorkgroup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isWorkgroup ? 'bg-[#00A3C4]' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWorkgroup ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium ml-1">NAME</label>
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-[#00A3C4]" 
                  placeholder="e.g., Gastrointestinal" 
                  value={name} onChange={e => setName(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium ml-1">DESCRIPTION (OPTIONAL)</label>
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-[#00A3C4]" 
                  placeholder="Brief summary..." 
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Three Pillar Tabs */}
            <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/40">
              <div className="flex bg-gray-800/50 border-b border-gray-800 text-sm">
                <button 
                  type="button"
                  onClick={() => setActiveTab('specimens')}
                  className={`flex-1 px-4 py-3 transition-colors ${activeTab === 'specimens' ? 'text-[#00A3C4] border-b-2 border-[#00A3C4] bg-[#00A3C4]/5' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Specimens ({selectedSpecimenIds.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 px-4 py-3 transition-colors ${activeTab === 'users' ? 'text-[#00A3C4] border-b-2 border-[#00A3C4] bg-[#00A3C4]/5' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Physicians ({selectedUserIds.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className={`flex-1 px-4 py-3 transition-colors ${activeTab === 'clients' ? 'text-[#00A3C4] border-b-2 border-[#00A3C4] bg-[#00A3C4]/5' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Clients ({selectedClientIds.length})
                </button>
              </div>

              {/* Selection Area */}
              <div className="h-56 overflow-y-auto p-2">
                {activeTab === 'specimens' && mockSpecimens.map(s => (
                  <label key={s.id} className="flex items-center p-2.5 hover:bg-gray-800/60 rounded cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedSpecimenIds.includes(s.id)}
                      onChange={() => toggleSelection(s.id, setSelectedSpecimenIds)}
                      className="w-4 h-4 rounded border-gray-700 text-[#00A3C4] bg-gray-900 focus:ring-0"
                    />
                    <span className="ml-3 text-gray-300 text-sm group-hover:text-white transition-colors">{s.name}</span>
                  </label>
                ))}

                {activeTab === 'users' && mockUsers.map(u => (
                  <label key={u.id} className="flex items-center p-2.5 hover:bg-gray-800/60 rounded cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleSelection(u.id, setSelectedUserIds)}
                      className="w-4 h-4 rounded border-gray-700 text-[#00A3C4] bg-gray-900 focus:ring-0"
                    />
                    <span className="ml-3 text-gray-300 text-sm group-hover:text-white transition-colors">{u.name} <span className="text-gray-500 text-xs ml-2">— {u.role}</span></span>
                  </label>
                ))}

                {activeTab === 'clients' && mockClients.map(c => (
                  <label key={c.id} className="flex items-center p-2.5 hover:bg-gray-800/60 rounded cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedClientIds.includes(c.id)}
                      onChange={() => toggleSelection(c.id, setSelectedClientIds)}
                      className="w-4 h-4 rounded border-gray-700 text-[#00A3C4] bg-gray-900 focus:ring-0"
                    />
                    <span className="ml-3 text-gray-300 text-sm group-hover:text-white transition-colors">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {activeTab === 'clients' && selectedClientIds.length === 0 && (
              <p className="text-[10px] text-gray-500 italic mt-1 ml-1">* Leaving clients empty makes this a Global Subspecialty.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex justify-end space-x-3 bg-gray-900/20">
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white px-4 transition-colors">Cancel</button>
            <button type="submit" className="bg-[#00A3C4] hover:bg-[#008ba8] text-white px-8 py-2 rounded font-semibold transition-all">
              {subId ? 'Update' : 'Add'} Subspecialty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};