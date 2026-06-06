// src/hooks/usePage.ts
// Call this at the top of any page component to register it in the breadcrumb trail.
//
// Usage:
//   usePage('Search', '/search');

import { useEffect } from 'react';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

export function usePage(label: string, path: string) {
  const { pushCrumb } = useBreadcrumb();

  useEffect(() => {
    pushCrumb(label, path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
