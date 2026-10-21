/**
 * HUB by Raisen — Provider global de alertas (Opción B: polling, 100% confiable, cero mocks).
 * Hace refetch de la actividad ENTRANTE cada 8s (y al volver el foco) y deriva, por canal, cuántos
 * mensajes entraron DESDE que abriste ese canal por última vez (baseline por-viewer en localStorage).
 * `markRead("channel:x")` marca ese canal como visto -> su badge vuelve a 0. La UI consume por clave
 * (useAlertCount/AlertBadge); fuentes nuevas (CRM, pagos, facturas) se suman aquí sin tocar la UI.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInboundActivity } from "./alerts-activity";
import { AlertsContext, type AlertsApi } from "./alerts-context";

const SEEN_KEY = "hub.alerts.seen"; // { <canal>: epochMs visto, __baseline: 1er arranque }

function loadSeen(): Record<string, number> {
  try {
    const s = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, number>;
    if (!s.__baseline) { s.__baseline = Date.now(); localStorage.setItem(SEEN_KEY, JSON.stringify(s)); }
    return s;
  } catch { return { __baseline: Date.now() }; }
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<Record<string, number>>(loadSeen);
  const { data } = useQuery({
    queryKey: ["alerts-activity"], queryFn: fetchInboundActivity,
    refetchInterval: 8000, refetchOnWindowFocus: true, staleTime: 4000,
  });

  const markRead = useCallback((key: string) => {
    if (!key.startsWith("channel:")) return;
    const ch = key.slice("channel:".length);
    setSeen((s) => {
      const n = { ...s, [ch]: Date.now() };
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(n)); } catch { /* per-viewer; ok si falla */ }
      return n;
    });
  }, []);

  const counts = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const r of data ?? []) {
      const base = seen[r.channel] ?? seen.__baseline ?? 0;
      if (new Date(r.created_at).getTime() > base) out[`channel:${r.channel}`] = (out[`channel:${r.channel}`] ?? 0) + 1;
    }
    return out;
  }, [data, seen]);

  const api = useMemo<AlertsApi>(() => ({ counts, bump: () => {}, markRead }), [counts, markRead]);
  return <AlertsContext.Provider value={api}>{children}</AlertsContext.Provider>;
}
