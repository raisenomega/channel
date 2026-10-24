/**
 * HUB by Raisen — Hook: modo + config S7 de los agentes por negocio. Lee/escribe /agents/config. C4 <=75.
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface AgentsHours { days: number[]; start: string; end: string }
export interface AgentsConfig {
  confidence: number;
  can: { reply: boolean; quote: boolean; invoice: boolean; order: boolean; charge: boolean; appointment: boolean };
  review: { opportunities: boolean; complaints: boolean; newContacts: boolean };
  hours: AgentsHours | null;
  dailyCap: number;
  channels: string[];
}
interface Resp { mode?: string; config?: AgentsConfig }

export function useAgentConfig(): { mode: string; config: AgentsConfig | null; busy: boolean; saved: boolean; save: (m: string, c: AgentsConfig) => Promise<void> } {
  const [mode, setMode] = useState("off");
  const [config, setConfig] = useState<AgentsConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = useCallback(async () => {
    const tid = resolveTenantId();
    if (!tid) return;
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/config`); if (r.ok) { const d = (await r.json()) as Resp; setMode(d.mode ?? "off"); setConfig(d.config ?? null); } } catch { /* */ }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (m: string, c: AgentsConfig) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true); setSaved(false);
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/config`, { method: "PUT", body: JSON.stringify({ mode: m, config: c }) }); if (r.ok) { const d = (await r.json()) as Resp; setMode(d.mode ?? m); setConfig(d.config ?? c); setSaved(true); } } catch { /* */ }
    setBusy(false);
  };
  return { mode, config, busy, saved, save };
}
