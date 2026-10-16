/**
 * HUB by Raisen — Hook: polling 10s del status de los 7 agentes IA.
 * Hotfix G: apiFetch con JWT + tenantId real (antes "/tenants/mine" literal sin auth -> 401/403).
 * Sin tenant resuelto no consulta: muestra el fallback honesto (todos offline).
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface AgentStatus {
  readonly name: string;
  readonly online: boolean;
  readonly lastAction: string;
  readonly timestamp: string;
}

const NAMES = ["victor","zahra","thao","iris","eco","angel","kelsy"] as const;

function fallback(): AgentStatus[] {
  return NAMES.map((n) => ({ name: n, online: false, lastAction: "", timestamp: "" }));
}

export function useAgentStatus(): { agents: readonly AgentStatus[] } {
  const [agents, setAgents] = useState<readonly AgentStatus[]>(fallback);

  const fetchStatus = useCallback(async () => {
    const tenantId = resolveTenantId();
    if (!tenantId) return;
    try {
      const res = await apiFetch(`/tenants/${encodeURIComponent(tenantId)}/agents/status`);
      if (res.ok) {
        const data = (await res.json()) as { agents: AgentStatus[] };
        setAgents(data.agents ?? fallback());
      }
    } catch { /* sin sesion o red: se mantiene el fallback */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return { agents };
}
