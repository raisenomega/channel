/**
 * HUB by Raisen — Hook: polling 10s del status de los 7 agentes IA.
 */
import { useState, useEffect, useCallback } from "react";

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
    try {
      const res = await fetch("/api/tenants/mine/agents/status");
      if (res.ok) {
        const data = (await res.json()) as { agents: AgentStatus[] };
        setAgents(data.agents ?? fallback());
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return { agents };
}