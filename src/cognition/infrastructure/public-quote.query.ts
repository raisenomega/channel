/**
 * HUB by Raisen — Lectura/decision PUBLICA de una cotizacion por token (link al cliente). El token (uuid)
 * vive en metadata del agent_draft scope=quote. decidir() es idempotente (no pisa una decision previa). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface PublicQuoteItem { readonly description: string; readonly quantity: number; readonly unitPrice: number; readonly lineTotal: number; }
export interface PublicQuote { readonly items: readonly PublicQuoteItem[]; readonly total: number; readonly conclusion: string; readonly decision: string | null; readonly business: string; }

export async function leerCotizacionPorToken(token: string): Promise<PublicQuote | null> {
  if (!token) return null;
  const { data } = await supabase.from("agent_drafts").select("metadata").eq("metadata->>token", token).limit(1).maybeSingle();
  if (!data) return null;
  const m = ((data as { metadata?: Record<string, unknown> }).metadata ?? {});
  const items = (((m["quoteItems"] as Array<Record<string, unknown>>) ?? [])).map((l) => ({
    description: String(l["description"] ?? ""), quantity: Number(l["quantity"] ?? 0),
    unitPrice: Number(l["unit_price"] ?? 0), lineTotal: Number(l["line_total"] ?? 0),
  }));
  return { items, total: Number(m["total"] ?? 0), conclusion: String(m["conclusion"] ?? ""), decision: (m["clientDecision"] as string) ?? null, business: String(m["business"] ?? "Cotizacion") };
}

export async function decidirCotizacion(token: string, decision: "accepted" | "rejected"): Promise<boolean> {
  if (!token) return false;
  const { data } = await supabase.from("agent_drafts").select("id, metadata").eq("metadata->>token", token).limit(1).maybeSingle();
  if (!data) return false;
  const row = data as { id: string; metadata?: Record<string, unknown> };
  if (row.metadata?.["clientDecision"]) return true; // idempotente: ya decidido
  const meta = { ...(row.metadata ?? {}), clientDecision: decision, clientDecisionAt: new Date().toISOString() };
  await supabase.from("agent_drafts").update({ metadata: meta, updated_at: new Date().toISOString() }).eq("id", row.id);
  return true;
}
