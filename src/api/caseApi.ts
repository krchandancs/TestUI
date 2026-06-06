// src/api/caseApi.ts
// Minimal real-case loader for Flag Manager.
// This mirrors the structure your Synoptic page already uses.

export async function getCase(caseId: string) {
  // IMPORTANT:
  // Your Synoptic page already has the full case loaded in memory.
  // But since we don't have direct access to that loader here,
  // we return a minimal structure that matches your specimen list.

  // TODO: Replace this with your real backend call when ready.
  return {
    id: caseId,
    accession: caseId,
    specimens: [
      { id: "sp-1", name: "Specimen 1 — Left Breast Mastectomy" },
      { id: "sp-2", name: "Specimen 2 — Sentinel Lymph Nodes" },
      { id: "sp-3", name: "Specimen 3 — Additional Margins" }
    ]
  };
}
