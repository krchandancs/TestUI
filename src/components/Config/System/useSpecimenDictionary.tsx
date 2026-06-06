// useSpecimenDictionary.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SpecimenEntry } from './specimenTypes';
import starterData from '../../../../scripts/terminology-sources/specimens-starter.json';

// ─── Starter data seed ────────────────────────────────────────────────────────
// Cast the imported JSON to SpecimenEntry[] — the shape matches exactly.
// This seeds the dictionary on first run (empty localStorage) so new
// installations have 60 common specimens ready to use out of the box.
// Institutions can customise via Configuration > Specimen Dictionary.
const STARTER_SPECIMENS = starterData.specimens as unknown as SpecimenEntry[];

// localStorage key used to track whether starter data has been seeded.
// Separate from specimenDictionary so a user clearing their dictionary
// doesn't trigger a re-seed on next load.
const SEED_KEY = 'specimenDictionarySeeded_v1';

interface SpecimenDictionaryContextValue {
  dictionary:         SpecimenEntry[];
  version:            number;
  addEntries:         (entries: SpecimenEntry[]) => void;
  updateEntries:      (entries: SpecimenEntry[]) => void;
  deprecateEntries:   (ids: string[]) => void;
  replaceDictionary:  (entries: SpecimenEntry[]) => void;
  exportDictionary:   () => SpecimenEntry[];
}

const SpecimenDictionaryContext = createContext<SpecimenDictionaryContextValue | null>(null);

export const useSpecimenDictionary = () => {
  const ctx = useContext(SpecimenDictionaryContext);
  if (!ctx) throw new Error('useSpecimenDictionary must be used inside provider');
  return ctx;
};

export const SpecimenDictionaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dictionary, setDictionary] = useState<SpecimenEntry[]>([]);
  const [version,    setVersion]    = useState<number>(1);

  // Load from localStorage on mount — seed from starter data if first run
  useEffect(() => {
    const raw        = localStorage.getItem('specimenDictionary');
    const rawVersion = localStorage.getItem('specimenDictionaryVersion');
    const seeded     = localStorage.getItem(SEED_KEY);

    if (raw) {
      // Existing dictionary — load as normal
      setDictionary(JSON.parse(raw));
      if (rawVersion) setVersion(Number(rawVersion));
    } else if (!seeded) {
      // First run — seed from starter data and mark as seeded
      setDictionary(STARTER_SPECIMENS);
      setVersion(1);
      localStorage.setItem('specimenDictionary',        JSON.stringify(STARTER_SPECIMENS));
      localStorage.setItem('specimenDictionaryVersion', '1');
      localStorage.setItem(SEED_KEY,                    'true');
    }
    // If seeded=true but raw is empty, the user deliberately cleared their
    // dictionary — respect that and leave it empty.
  }, []);

  // Persist to localStorage
  const persist = (entries: SpecimenEntry[], newVersion: number) => {
    setDictionary(entries);
    setVersion(newVersion);
    localStorage.setItem('specimenDictionary',        JSON.stringify(entries));
    localStorage.setItem('specimenDictionaryVersion', String(newVersion));
  };

  const addEntries = (entries: SpecimenEntry[]) => {
    persist([...dictionary, ...entries], version + 1);
  };

  const updateEntries = (entries: SpecimenEntry[]) => {
    const updated = dictionary.map(d => {
      const match = entries.find(e => e.id === d.id);
      return match ? match : d;
    });
    persist(updated, version + 1);
  };

  const deprecateEntries = (ids: string[]) => {
    const updated = dictionary.map(d =>
      ids.includes(d.id) ? { ...d, active: false, version: d.version + 1 } : d
    );
    persist(updated, version + 1);
  };

  const replaceDictionary = (entries: SpecimenEntry[]) => {
    persist(entries, version + 1);
  };

  const exportDictionary = () => dictionary;

  return (
    <SpecimenDictionaryContext.Provider
      value={{
        dictionary,
        version,
        addEntries,
        updateEntries,
        deprecateEntries,
        replaceDictionary,
        exportDictionary,
      }}
    >
      {children}
    </SpecimenDictionaryContext.Provider>
  );
};
