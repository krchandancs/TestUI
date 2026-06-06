import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { subspecialtyService } from "../services";

export interface Subspecialty {
  id: string;
  name: string;
  active: boolean;
  userIds: string[];      // physician IDs assigned to this subspecialty
  description?: string;   // optional description
  specimenIds?: string[]; // specimen types assigned to this subspecialty
}

interface SubspecialtyContextType {
  subspecialties: Subspecialty[];
  subspecialtyMap: Record<string, Subspecialty>;
  addSubspecialty:    (s: Omit<Subspecialty, "id">) => void;
  updateSubspecialty: (s: Subspecialty) => void;
  deleteSubspecialty: (id: string) => void;
}

const SubspecialtyContext = createContext<SubspecialtyContextType | undefined>(undefined);

export const SubspecialtyProvider = ({ children }: { children: ReactNode }) => {
  const [subspecialties, setSubspecialties] = useState<Subspecialty[]>([]);

  useEffect(() => {
    subspecialtyService.getAll().then(res => {
      if (res.ok) setSubspecialties(res.data.map(s => ({
        id: s.id, name: s.name, active: s.status === 'Active', userIds: s.userIds,
      })));
    });
  }, []);

  const addSubspecialty = async (s: Omit<Subspecialty, "id">) => {
    const res = await subspecialtyService.add({
      name: s.name, userIds: s.userIds, specimenIds: [],
      status: s.active ? 'Active' : 'Inactive',
    });
    if (res.ok) setSubspecialties(prev => [...prev, {
      id: res.data.id, name: res.data.name,
      active: res.data.status === 'Active', userIds: res.data.userIds,
    }]);
  };

  const updateSubspecialty = async (updated: Subspecialty) => {
    const res = await subspecialtyService.update(updated.id, {
      name: updated.name, userIds: updated.userIds,
      status: updated.active ? 'Active' : 'Inactive',
    });
    if (res.ok) setSubspecialties(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSubspecialty = async (id: string) => {
    const res = await subspecialtyService.deactivate(id);
    if (res.ok) setSubspecialties(prev => prev.filter(s => s.id !== id));
  };

  const subspecialtyMap = useMemo(() => {
    return Object.fromEntries(subspecialties.map((s) => [s.name.toLowerCase(), s]));
  }, [subspecialties]);

  return (
    <SubspecialtyContext.Provider value={{ subspecialties, subspecialtyMap, addSubspecialty, updateSubspecialty, deleteSubspecialty }}>
      {children}
    </SubspecialtyContext.Provider>
  );
};

export const useSubspecialties = () => {
  const context = useContext(SubspecialtyContext);
  if (!context) throw new Error("useSubspecialties must be used within a SubspecialtyProvider");
  return context;
};

