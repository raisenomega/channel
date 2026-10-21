/**
 * HUB by Raisen — Provider global de alertas (Opción B: polling, confiable, cero mocks).
 * Hace refetch cada 8s (+ al volver el foco) de las fuentes reales (mensajes entrantes por canal + CRM)
 * y cuenta, por CLAVE, cuántas son posteriores a la última vez que viste esa clave (baseline por-viewer
 * en localStorage). `markRead(key)` marca visto -> badge a 0. La UI consume por clave (useAlertCount/
 * AlertBadge). Sumar una fuente nueva = otro fetcher en alerts-activity + incluirlo aquí. Sin Realtime.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInboundActivity, fetchCrmActivity, type ActivityRow } from "./alerts-activity";
import { AlertsContext, type AlertsApi } from "./alerts-context";

const SEEN_KEY = "hub.alerts.seen"; // { <clave>: epochMs visto, __baseline: 1er arranque }

function loadSeen(): Record<string, number> {
  try {
    const s = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, number>;
    if (!s.__baseline) { s.__baseline = Date.now(); localStorage.setItem(SEEN_KEY, JSON.stringify(s)); }
    return s;
  } catch { return { __baseline: Date.now() }; }
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<Record<string, number>>(loadSeen);
  const opts = { refetchInterval: 8000, refetchOnWindowFocus: true, staleTime: 4000 } as const;
  const msgs = useQuery({ queryKey: ["alerts-activity"], queryFn: fetchInboundActivity, ...opts });
  const crm = useQuery({ queryKey: ["alerts-crm"], queryFn: fetchCrmActivity, ...opts });

  const markRead = useCallback((key: string) => {
    setSeen((s) => {
      const n = { ...s, [key]: Date.now() };
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(n)); } catch { /* per-viewer; ok si falla */ }
      return n;
    });
  }, []);

  const counts = useMemo<Record<string, number>>(() => {
    const rows: ActivityRow[] = [...(msgs.data ?? []), ...(crm.data ?? [])];
    const out: Record<string, number> = {};
    for (const r of rows) {
      const base = seen[r.key] ?? seen.__baseline ?? 0;
      if (r.created_at && new Date(r.created_at).getTime() > base) out[r.key] = (out[r.key] ?? 0) + 1;
    }
    return out;
  }, [msgs.data, crm.data, seen]);

  const api = useMemo<AlertsApi>(() => ({ counts, bump: () => {}, markRead }), [counts, markRead]);
  return <AlertsContext.Provider value={api}>{children}</AlertsContext.Provider>;
}
