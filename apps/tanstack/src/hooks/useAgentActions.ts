/**
 * HUB by Raisen — Dashboard: ultima accion de cada agente (1 linea honesta). Poll 20s. Vacio sin tenant/red.
 */
import { useState, useEffect } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface UltimaAccion { label: string; at: string; }

export function useAgentActions(): Record<string, UltimaAccion> {
  const [a, setA] = useState<Record<string, UltimaAccion>>({});
  useEffect(() => {
    const tid = resolveTenantId();
    if (!tid) return;
    const load = () => void apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/last-actions`)
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { actions?: Record<string, UltimaAccion> }; setA(j.actions ?? {}); } })
      .catch(() => { /* vacio honesto */ });
    load(); const id = setInterval(load, 20000); return () => clearInterval(id);
  }, []);
  return a;
}
