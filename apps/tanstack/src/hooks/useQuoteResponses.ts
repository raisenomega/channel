/**
 * HUB by Raisen — Hook: respuestas REALES del cliente para la tarjeta Peticiones: cotizaciones
 * aceptadas/rechazadas (quotes.responded_at) + facturas con pago solicitado (invoices.pay_requested_at).
 * Lectura directa via PostgREST (RLS por tenant). Cero-mocks: vacio honesto ante error. C4 <=75.
 */
import { useState, useEffect, useCallback } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Peticion } from "@/components/dashboard/bentobox/bento-peticiones";

type Tone = "accepted" | "rejected" | "pay";
type Row = Record<string, string | null>;

function withName(txt: string, name: string | null | undefined): string {
  return name ? `${txt} · ${name}` : txt;
}
function fmt(iso: string, lang: Idioma): string {
  return iso ? new Date(iso).toLocaleString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
}

export function useQuoteResponses(lang: Idioma): { peticiones: readonly Peticion[] } {
  const [peticiones, setPeticiones] = useState<readonly Peticion[]>([]);
  const fetchRows = useCallback(async () => {
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) return;
    const get = async (q: string): Promise<Row[]> => {
      try { const res = await fetch(`${base}/${q}`, { headers }); return res.ok ? ((await res.json()) as Row[]) : []; } catch { return []; }
    };
    const [qs, is] = await Promise.all([
      get("quotes?select=id,status,client_name,responded_at&responded_at=not.is.null&order=responded_at.desc&limit=5"),
      get("invoices?select=id,client_name,pay_requested_at&pay_requested_at=not.is.null&order=pay_requested_at.desc&limit=5"),
    ]);
    const items: { id: string; label: string; tone: Tone; ts: string }[] = [];
    for (const r of qs) {
      const acc = r.status !== "rejected";
      items.push({ id: "q" + r.id, tone: acc ? "accepted" : "rejected", ts: r.responded_at ?? "", label: withName(t(lang, acc ? "dash.cotAceptada" : "dash.cotRechazada"), r.client_name) });
    }
    for (const r of is) items.push({ id: "i" + r.id, tone: "pay", ts: r.pay_requested_at ?? "", label: withName(t(lang, "dash.facturaPago"), r.client_name) });
    items.sort((a, b) => b.ts.localeCompare(a.ts));
    setPeticiones(items.slice(0, 5).map((x) => ({ id: x.id, label: x.label, tone: x.tone, timestamp: fmt(x.ts, lang) })));
  }, [lang]);
  useEffect(() => {
    void fetchRows();
    const id = setInterval(() => void fetchRows(), 30_000);
    return () => clearInterval(id);
  }, [fetchRows]);
  return { peticiones };
}
