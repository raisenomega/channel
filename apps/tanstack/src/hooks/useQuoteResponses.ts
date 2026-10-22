/**
 * HUB by Raisen — Hook: respuestas REALES de cotizacion (el cliente acepto/rechazo el link publico)
 * para la tarjeta Peticiones del dashboard. Lee quotes con responded_at via PostgREST (RLS por tenant,
 * misma lectura directa que listarQuotes). Cero-mocks: vacio honesto ante error/sin sesion. C4 <=75.
 */
import { useState, useEffect, useCallback } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Peticion } from "@/components/dashboard/bentobox/bento-peticiones";

interface Row { id: string; status: string; client_name: string | null; responded_at: string; }

export function useQuoteResponses(lang: Idioma): { peticiones: readonly Peticion[] } {
  const [peticiones, setPeticiones] = useState<readonly Peticion[]>([]);
  const fetchRows = useCallback(async () => {
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) return;
    const q = "quotes?select=id,status,client_name,responded_at&responded_at=not.is.null&order=responded_at.desc&limit=5";
    try {
      const res = await fetch(`${base}/${q}`, { headers });
      if (!res.ok) return;
      const rows = (await res.json()) as Row[];
      setPeticiones(rows.map((r) => {
        const accepted = r.status !== "rejected";
        const txt = t(lang, accepted ? "dash.cotAceptada" : "dash.cotRechazada");
        const ts = new Date(r.responded_at).toLocaleString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return { id: r.id, label: r.client_name ? `${txt} · ${r.client_name}` : txt, timestamp: ts, tone: accepted ? ("accepted" as const) : ("rejected" as const) };
      }));
    } catch { /* vacio honesto */ }
  }, [lang]);
  useEffect(() => {
    void fetchRows();
    const id = setInterval(() => void fetchRows(), 30_000);
    return () => clearInterval(id);
  }, [fetchRows]);
  return { peticiones };
}
