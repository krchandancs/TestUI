import { useEffect, useState } from "react";

export function useLISFreshnessCheck(accession?: string) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!accession) return;

    // STUB: Always fresh for now
    setIsStale(false);

    // Later:
    // fetch(`/lis/case/${accession}/metadata`)
    //   .then(res => res.json())
    //   .then(meta => setIsStale(meta.changed));
  }, [accession]);

  return { isStale };
}
