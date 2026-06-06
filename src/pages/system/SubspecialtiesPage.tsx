// src/pages/system/SubspecialtiesPage.tsx
import { useState } from "react";
// Import the actual Type from your context file
import { useSubspecialties, Subspecialty } from "../../contexts/useSubspecialties"; 
import { SubspecialtyTable } from "../../components/system/subspecialties/SubspecialtyTable";
import { SubspecialtyEditorModal } from "../../components/system/subspecialties/SubspecialtyEditorModal";

export const SubspecialtiesPage = () => {
  const { 
    subspecialties, 
    addSubspecialty, 
    updateSubspecialty, 
    deleteSubspecialty 
  } = useSubspecialties();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Find the actual subspecialty object if we are editing
  const editingData = subspecialties.find(s => s.id === editingSubId);

  const handleAdd = () => {
    setEditingSubId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingSubId(id);
    setIsEditorOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Subspecialties</h2>
          <p className="text-gray-400 mt-1">
            Manage clinical divisions, assigned staff, and institutional workgroups.
          </p>
        </div>

        <button 
          className="bg-[#00A3C4] hover:bg-[#008ba8] text-white px-4 py-2 rounded font-medium transition-colors"
          onClick={handleAdd}
        >
          + Add Subspecialty
        </button>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-lg overflow-hidden">
        <SubspecialtyTable
          data={subspecialties}
          onEdit={handleEdit}
          onDelete={deleteSubspecialty}
        />
      </div>

      <SubspecialtyEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSubId(null);
        }}
        subId={editingSubId}
        initialData={editingData} // Pass the full object to the modal
        onSave={(id, updates) => {
          updateSubspecialty({ id, ...updates } as Subspecialty);
          setIsEditorOpen(false);
        }}
        onAdd={(newSub) => {
          addSubspecialty(newSub);
          setIsEditorOpen(false);
        }}
      />
    </div>
  );
};