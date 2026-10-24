/**
 * HUB by Raisen — Hook: modo de los agentes por negocio (off | supervised | autonomous). Lee/escribe
 * /tenants/:id/agents/mode. Sin tenant -> 'off'.
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export function useAgentMode(): { mode: string; setMode: (m: string) => Promise<void>; busy: boolean } {
  const [mode, setModeState] = useState("off");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const tid = resolveTenantId();
    if (!tid) return;
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/mode`); if (r.ok) { const d = (await r.json()) as { mode?: string }; setModeState(d.mode ?? "off"); } } catch { /* */ }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const setMode = async (m: string) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true);
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/agents/mode`, { method: "PUT", body: JSON.stringify({ mode: m }) }); if (r.ok) { const d = (await r.json()) as { mode?: string }; setModeState(d.mode ?? m); } } catch { /* */ }
    setBusy(false);
  };
  return { mode, setMode, busy };
}
