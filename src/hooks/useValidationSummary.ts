import { useMemo } from 'react';
import { SynopticReportNode, SynopticField } from '../pages/Synoptic/synopticTypes';

export function useValidationSummary(activeSynoptic: SynopticReportNode | null) {
  return useMemo(() => {
    if (!activeSynoptic) {
      return {
        allIssues: [],
        requiredMissing: [],
        disputed: [],
        unverified: [],
        dirty: [],
        isReadyToFinalize: true,
      };
    }

    const requiredMissing: SynopticField[] = [];
    const disputed: SynopticField[] = [];
    const unverified: SynopticField[] = [];
    const dirty: SynopticField[] = [];

    // Collect all field groups on this node
    const collectFields = (node: SynopticReportNode) => {
      const groups: (SynopticField[] | undefined)[] = [
        node.tumorFields,
        node.marginFields,
        node.lymphNodes,
        node.ancillaryFields,
        node.specimenFields,
        node.biomarkerFields,
      ];

      for (const group of groups) {
        if (!group) continue;

        for (const field of group) {
          if (field.required && !field.value) {
            requiredMissing.push(field);
          }
          if (field.verification === 'disputed') {
            disputed.push(field);
          }
          if (field.verification !== 'verified' && field.confidence < 100) {
            unverified.push(field);
          }
          if (field.dirty) {
            dirty.push(field);
          }
        }
      }

      // Recurse into children
      for (const child of node.children) {
        collectFields(child);
      }
    };

    collectFields(activeSynoptic);

    const allIssues = [
      ...requiredMissing,
      ...disputed,
      ...unverified,
      ...dirty,
    ];

    return {
      allIssues,
      requiredMissing,
      disputed,
      unverified,
      dirty,
      isReadyToFinalize: allIssues.length === 0,
    };
  }, [activeSynoptic]);
}