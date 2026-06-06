import { createContext, useContext, useState, ReactNode } from "react";

export interface Specimen {
  id: string;
  name: string;
  description: string;
  specimenCode?: string;
  subspecialtyId: string;
  subspecialtyName: string;
  active: boolean;
  version: number;
  updatedBy: string;
  updatedAt: string;
}

interface SpecimenContextType {
  specimens: Specimen[];
  addSpecimen: (specimen: Specimen) => void;
  updateSpecimen: (specimen: Specimen) => void;
}

const SpecimenContext = createContext<SpecimenContextType | undefined>(undefined);

export const SpecimenProvider = ({ children }: { children: ReactNode }) => {
  const now = new Date().toISOString();

  const [specimens, setSpecimens] = useState<Specimen[]>([
    {
      id: "sp-1",
      name: "Appendix",
      description: "Appendix tissue",
      specimenCode: "GI-APP",
      subspecialtyId: "gi",
      subspecialtyName: "GI",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-2",
      name: "Colon Biopsy",
      description: "Biopsy of colon tissue",
      specimenCode: "GI-COL-BX",
      subspecialtyId: "gi",
      subspecialtyName: "GI",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-3",
      name: "Skin Shave/Punch",
      description: "Shave or punch biopsy of skin",
      specimenCode: "DERM-SKN-BX",
      subspecialtyId: "derm",
      subspecialtyName: "Dermatology",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-4",
      name: "Breast Core Biopsy",
      description: "Core biopsy of breast tissue",
      specimenCode: "BR-CORE-BX",
      subspecialtyId: "breast",
      subspecialtyName: "Breast",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-5",
      name: "Endometrial Biopsy",
      description: "Biopsy of endometrial tissue",
      specimenCode: "GYN-ENDO-BX",
      subspecialtyId: "gyn",
      subspecialtyName: "Gynecologic",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-6",
      name: "Gallbladder",
      description: "Gallbladder specimen",
      specimenCode: "GI-GB",
      subspecialtyId: "gi",
      subspecialtyName: "GI",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
    {
      id: "sp-7",
      name: "Prostate Core Biopsy",
      description: "Core biopsy of prostate tissue",
      specimenCode: "GU-PROST-BX",
      subspecialtyId: "gu",
      subspecialtyName: "GU",
      active: true,
      version: 1,
      updatedBy: "system",
      updatedAt: now,
    },
  ]);

  const addSpecimen = (specimen: Specimen) => {
    setSpecimens((prev) => [...prev, specimen]);
  };

  const updateSpecimen = (specimen: Specimen) => {
    setSpecimens((prev) =>
      prev.map((s) => (s.id === specimen.id ? specimen : s))
    );
  };

  return (
    <SpecimenContext.Provider value={{ specimens, addSpecimen, updateSpecimen }}>
      {children}
    </SpecimenContext.Provider>
  );
};

export const useSpecimens = () => {
  const context = useContext(SpecimenContext);
  if (!context) {
    throw new Error("useSpecimens must be used within a SpecimenProvider");
  }
  return context;
};
