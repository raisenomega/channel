/**
 * HUB by Raisen — Provider global de alertas (Opción B: polling, confiable, cero mocks).
 * Refetch cada 8s (+ al volver el foco) de las fuentes reales (mensajes entrantes por canal + CRM) y del
 * ESTADO DE LECTURA por usuario (channel_read_state, persistente entre dispositivos). Cuenta, por clave,
 * cuántas son posteriores a tu `last_read_at`. `markRead(key)` hace upsert (optimista + remoto) -> badge a 0
 * en todos tus dispositivos. La UI consume por clave (useAlertCount/AlertBadge). Sin Realtime.
 */
import { useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInboundActivity, fetchCrmActivity, fetchReadState, markReadRemote, type ActivityRow } from "./alerts-activity";
import { fetchEscalationActivity } from "@/routes/escaladas/escaladas-fetchers";
import { AlertsContext, type AlertsApi } from "./alerts-context";

const RS_KEY = ["alerts-readstate"] as const;

export function AlertsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const opts = { refetchInterval: 8000, refetchOnWindowFocus: true, staleTime: 4000 } as const;
  const msgs = useQuery({ queryKey: ["alerts-activity"], queryFn: fetchInboundActivity, ...opts });
  const crm = useQuery({ queryKey: ["alerts-crm"], queryFn: fetchCrmActivity, ...opts });
  const esc = useQuery({ queryKey: ["alerts-escaladas"], queryFn: fetchEscalationActivity, ...opts });
  const readState = useQuery({ queryKey: RS_KEY, queryFn: fetchReadState, ...opts });

  const markRead = useCallback((key: string) => {
    qc.setQueryData<Record<string, number>>(RS_KEY, (prev) => ({ ...(prev ?? {}), [key]: Date.now() })); // optimista
    void markReadRemote(key).then(() => qc.invalidateQueries({ queryKey: RS_KEY })); // persiste (cross-device)
  }, [qc]);

  const counts = useMemo<Record<string, number>>(() => {
    const rs = readState.data ?? {};
    const rows: ActivityRow[] = [...(msgs.data ?? []), ...(crm.data ?? []), ...(esc.data ?? [])];
    const out: Record<string, number> = {};
    for (const r of rows) {
      const base = rs[r.key] ?? 0; // sin registro de lectura -> todo cuenta como no-leído (se limpia al abrir)
      if (r.created_at && new Date(r.created_at).getTime() > base) out[r.key] = (out[r.key] ?? 0) + 1;
    }
    return out;
  }, [msgs.data, crm.data, esc.data, readState.data]);

  const api = useMemo<AlertsApi>(() => ({ counts, bump: () => {}, markRead }), [counts, markRead]);
  return <AlertsContext.Provider value={api}>{children}</AlertsContext.Provider>;
}
