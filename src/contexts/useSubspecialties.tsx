// src/contexts/useSubspecialties.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Subspecialty {
  id: string;
  name: string;
  active: boolean;
  userIds: string[];
  specimenIds: string[];
  clientIds: string[];    // New: Links to Client Dictionary
  isWorkgroup: boolean;   // New: Toggle for Consult/Referral routing
  description?: string;
  category?: string;
}

interface SubspecialtyContextType {
  subspecialties: Subspecialty[];
  addSubspecialty: (sub: Omit<Subspecialty, 'id'>) => void;
  updateSubspecialty: (sub: Subspecialty) => void;
  deleteSubspecialty: (id: string) => void;
}

const SubspecialtyContext = createContext<SubspecialtyContextType | undefined>(undefined);

export const SubspecialtyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initial state updated with new required fields to prevent TS2345
  const [subspecialties, setSubspecialties] = useState<Subspecialty[]>([
    {
      id: '1',
      name: 'Gastrointestinal',
      active: true,
      userIds: ['user_1'],
      specimenIds: ['spec_1', 'spec_2'],
      clientIds: [], // Global by default
      isWorkgroup: true,
      category: 'gi',
      description: 'Main GI biopsy pool'
    },
    {
      id: '2',
      name: 'Dermatopathology',
      active: true,
      userIds: ['user_2'],
      specimenIds: ['spec_3'],
      clientIds: ['client_1'], // Specific to a client
      isWorkgroup: false,
      category: 'derm'
    }
  ]);

  const addSubspecialty = (newSub: Omit<Subspecialty, 'id'>) => {
    const subWithId: Subspecialty = {
      ...newSub,
      id: Math.random().toString(36).substring(2, 9),
      // Ensure arrays exist even if modal sends null/undefined
      specimenIds: newSub.specimenIds || [],
      userIds: newSub.userIds || [],
      clientIds: newSub.clientIds || [],
      isWorkgroup: newSub.isWorkgroup || false,
    };
    setSubspecialties((prev) => [...prev, subWithId]);
  };

  const updateSubspecialty = (updatedSub: Subspecialty) => {
    setSubspecialties((prev) =>
      prev.map((sub) => (sub.id === updatedSub.id ? updatedSub : sub))
    );
  };

  const deleteSubspecialty = (id: string) => {
    setSubspecialties((prev) => prev.filter((sub) => sub.id !== id));
  };

  return (
    <SubspecialtyContext.Provider 
      value={{ 
        subspecialties, 
        addSubspecialty, 
        updateSubspecialty, 
        deleteSubspecialty 
      }}
    >
      {children}
    </SubspecialtyContext.Provider>
  );
};

export const useSubspecialties = () => {
  const context = useContext(SubspecialtyContext);
  if (!context) {
    throw new Error('useSubspecialties must be used within a SubspecialtyProvider');
  }
  return context;
};