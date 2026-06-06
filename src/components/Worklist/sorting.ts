// src/Worklist/sorting.ts
export const priorityRank = (p?: string) => {
  if (!p) return 2;
  if (p === "STAT") return 0;
  if (p === "Routine") return 1;
  return 2;
};

export const parseTime = (t?: string) => {
  if (!t) return 0;
  const d = Date.parse(t);
  return Number.isNaN(d) ? 0 : d;
};

export const getHighestSeverityForCase = (c: any): number => {
  let max = 0;
  if (Array.isArray(c.caseFlags)) {
    for (const f of c.caseFlags) {
      if (typeof f.severity === "number") max = Math.max(max, f.severity);
    }
  }
  if (Array.isArray(c.specimenFlags)) {
    for (const f of c.specimenFlags) {
      if (typeof f.severity === "number") max = Math.max(max, f.severity);
    }
  }
  return max;
};

export const compareCases = (a: any, b: any) => {
  const pa = priorityRank(a.priority);
  const pb = priorityRank(b.priority);
  if (pa !== pb) return pa - pb;

  const sa = getHighestSeverityForCase(a);
  const sb = getHighestSeverityForCase(b);
  if (sa !== sb) return sb - sa;

  const ta = parseTime(a.time);
  const tb = parseTime(b.time);
  return tb - ta;
};
