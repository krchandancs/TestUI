// src/contexts/DirtyStateProvider.tsx

import React, { useState, useCallback } from 'react';
import { DirtyStateContext } from './DirtyStateContext';

export const DirtyStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDirty, setIsDirty]        = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const onProceedRef = React.useRef<((path: string) => void) | null>(null);

  const setDirty = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  const requestNavigate = useCallback((path: string, onProceed: (path: string) => void) => {
    if (!isDirty) {
      onProceed(path);
      return;
    }
    setPendingPath(path);
    onProceedRef.current = onProceed;
  }, [isDirty]);

  const confirmNavigate = useCallback(() => {
    const path    = pendingPath;
    const proceed = onProceedRef.current;
    setIsDirty(false);
    setPendingPath(null);
    onProceedRef.current = null;
    if (path && proceed) proceed(path);
  }, [pendingPath]);

  const cancelNavigate = useCallback(() => {
    setPendingPath(null);
    onProceedRef.current = null;
  }, []);

  return (
    <DirtyStateContext.Provider value={{
      isDirty, setDirty, requestNavigate, pendingPath, confirmNavigate, cancelNavigate,
    }}>
      {children}
    </DirtyStateContext.Provider>
  );
};
