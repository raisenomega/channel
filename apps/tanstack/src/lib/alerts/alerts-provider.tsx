/**
 * HUB by Raisen — Provider global de alertas: UNA suscripción Supabase Realtime a `messages` (INSERT).
 * Cada mensaje ENTRANTE sube el badge del chip de su canal y refresca las vistas (sin refresh manual).
 * RLS de `messages` (migr 055) scopea el stream al tenant vía setAuth(JWT). Fuentes nuevas (CRM, pagos,
 * facturas, estados) se enchufan aquí registrando tabla->clave; la UI ya consume por clave.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { readLocalSession } from "@/lib/auth";
import { AlertsContext, type AlertsApi } from "./alerts-context";

interface MsgRow { channel?: string; direction?: string; conversation_id?: string }

export function AlertsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const bump = useCallback((key: string) => setCounts((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 })), []);
  const markRead = useCallback((key: string) => setCounts((c) => (c[key] ? { ...c, [key]: 0 } : c)), []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const token = readLocalSession()?.access_token;
    if (token) sb.realtime.setAuth(token);
    const auth = sb.auth.onAuthStateChange((_e, s) => { if (s?.access_token) sb.realtime.setAuth(s.access_token); });
    const ch = sb
      .channel("hub-alerts-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new as MsgRow;
        if (row.direction !== "inbound") return; // solo lo que ESCRIBE el cliente
        if (row.channel) {
          bump(`channel:${row.channel}`);
          void qc.invalidateQueries({ queryKey: ["channel-convs", row.channel] });
          if (row.conversation_id) void qc.invalidateQueries({ queryKey: ["channel-msgs", row.channel, row.conversation_id] });
        }
        void qc.invalidateQueries({ queryKey: ["inbox"] });
        if (row.conversation_id) void qc.invalidateQueries({ queryKey: ["messages", row.conversation_id] });
      })
      .subscribe();
    return () => { auth.data.subscription.unsubscribe(); void sb.removeChannel(ch); };
  }, [qc, bump]);

  const api = useMemo<AlertsApi>(() => ({ counts, bump, markRead }), [counts, bump, markRead]);
  return <AlertsContext.Provider value={api}>{children}</AlertsContext.Provider>;
}
