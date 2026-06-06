// src/hooks/useCasePreview.ts

import { useState } from "react";
import { getMockReport } from "../mock/mockReports";
import type { FullReport, MinimalReport } from "../mock/mockReports";
import type { SimilarCase } from "../types/SimilarCase";

export function useCasePreview() {
  const [selectedCase, setSelectedCase] = useState<
    FullReport | MinimalReport | null
  >(null);

  const [isOpen, setIsOpen] = useState(false);

  const openPreview = (sc: SimilarCase) => {
    const report = getMockReport(sc.accession);
    // SR-16: set report and open in a single synchronised update.
    // Previously selectedCase was null on first render, causing the drawer
    // to return null before isOpen could flip — the shell was never mounted
    // so the CSS transition had nothing to animate from.
    // Setting both together ensures the shell is mounted before isOpen=true.
    setSelectedCase(report);
    setIsOpen(true);
  };

  const closePreview = () => {
    setIsOpen(false);
    // Clear after transition completes so the drawer can animate out cleanly
    setTimeout(() => setSelectedCase(null), 350);
  };

  return {
    selectedCase,
    isOpen,
    openPreview,
    closePreview,
  };
}
