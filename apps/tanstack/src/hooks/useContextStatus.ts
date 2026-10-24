/**
 * HUB by Raisen — Hook: completitud del Contexto del negocio (para el punto del chip). Verde > 70%.
 * Poll 15s para que el chip se actualice tras guardar. Sin tenant/red -> gris (0%).
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface CtxStatus { percent: number; green: boolean; }

export function useContextStatus(): CtxStatus {
  const [st, setSt] = useState<CtxStatus>({ percent: 0, green: false });
  const fetchIt = useCallback(async () => {
    const tid = resolveTenantId();
    if (!tid) { setSt({ percent: 0, green: false }); return; }
    try {
      const res = await apiFetch(`/tenants/${encodeURIComponent(tid)}/context`);
      if (res.ok) {
        const d = (await res.json()) as { completeness?: { percent: number; green: boolean } };
        setSt({ percent: d.completeness?.percent ?? 0, green: d.completeness?.green ?? false });
      } else { setSt({ percent: 0, green: false }); }
    } catch { setSt({ percent: 0, green: false }); }
  }, []);
  useEffect(() => { fetchIt(); const id = setInterval(fetchIt, 15_000); return () => clearInterval(id); }, [fetchIt]);
  return st;
}
