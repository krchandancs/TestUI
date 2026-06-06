// src/contexts/DirtyStateContext.tsx

import { createContext, useContext } from 'react';

interface DirtyStateContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  requestNavigate: (path: string, onProceed: (path: string) => void) => void;
  pendingPath: string | null;
  confirmNavigate: () => void;
  cancelNavigate: () => void;
}

export const DirtyStateContext = createContext<DirtyStateContextValue>({
  isDirty: false,
  setDirty: () => {},
  requestNavigate: (_path, onProceed) => onProceed(_path),
  pendingPath: null,
  confirmNavigate: () => {},
  cancelNavigate: () => {},
});

export function useDirtyState() {
  return useContext(DirtyStateContext);
}
