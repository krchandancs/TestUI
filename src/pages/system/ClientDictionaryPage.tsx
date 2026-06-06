/**
 * ClientDictionaryPage.tsx
 * Located at: src/pages/system/ClientDictionaryPage.tsx
 *
 * Admin config page for the Client Dictionary.
 * Route: /system/clients
 */

import { useState } from "react";
import '../../pathscribe.css';
import { useClientDictionary } from "../../contexts/useClientDictionary";
import { ClientEditorModal } from "../../components/system/clients/ClientEditorModal";
import { ClientTable } from "../../components/system/clients/ClientTable";

export const ClientDictionaryPage = () => {
  const { clients, addClient, updateClient } = useClientDictionary();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingClientId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (clientId: string) => {
    setEditingClientId(clientId);
    setIsEditorOpen(true);
  };

  return (
    <div className="config-section-container">
      <div className="config-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="config-section-title">Client Dictionary</h2>
            <p className="config-section-description">
              Manage client definitions, HL7 integration settings, and reporting preferences.
            </p>
          </div>
          <button className="config-primary-button" onClick={handleAdd}>
            + Add Client
          </button>
        </div>
      </div>

      <div className="config-section-body">
        <ClientTable
          clients={clients}
          onEdit={handleEdit}
          onToggleActive={(id, active) => updateClient(id, { active })}
        />
      </div>

      {isEditorOpen && (
        <ClientEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          clientId={editingClientId}
          addClient={addClient}
          updateClient={updateClient}
        />
      )}
    </div>
  );
};

