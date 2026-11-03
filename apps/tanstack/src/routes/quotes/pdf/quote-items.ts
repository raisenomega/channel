/**
 * HUB by Raisen — Lineas de una cotizacion + totales con tax a nivel documento. Lee quotes.items (jsonb)
 * DIRECTO via RLS (mismo camino que el listado que SI funciona): el RPC get_quote_items resolvia el tenant
 * por auth.uid()->users y devolvia vacio para algunos tokens -> editor/PDF en cero. El snapshot jsonb lo
 * llenan AMBOS paths (save_quote_with_items y el agente), asi que es la fuente consistente. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { QuoteLine } from "@/lib/quotes-client";
import type { DocItem, DocTotals, TaxConfig } from "./doc-types";

interface Row { description?: string; quantity?: number; unit_price?: number; discount_pct?: number; line_total?: number; }

async function leerItems(quoteId: string): Promise<Row[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return [];
  try {
    const res = await fetch(`${base}/quotes?id=eq.${quoteId}&select=items`, { headers });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ items?: Row[] }>;
    return Array.isArray(rows[0]?.items) ? (rows[0]!.items as Row[]) : [];
  } catch {
    return [];
  }
}

function lineTotalDe(r: Row): number {
  const q = Number(r.quantity ?? 0), p = Number(r.unit_price ?? 0), d = Number(r.discount_pct ?? 0);
  return r.line_total != null ? Number(r.line_total) : q * p * (1 - d / 100);
}

export async function fetchQuoteLines(quoteId: string): Promise<QuoteLine[]> {
  return (await leerItems(quoteId)).map((r) => ({ description: String(r.description ?? ""), quantity: Number(r.quantity ?? 0), unitPrice: Number(r.unit_price ?? 0), discountPct: Number(r.discount_pct ?? 0), lineTotal: lineTotalDe(r) }));
}

export async function fetchQuoteItems(quoteId: string): Promise<DocItem[]> {
  return (await leerItems(quoteId)).map((r) => ({ description: String(r.description ?? ""), quantity: Number(r.quantity ?? 0), unitPrice: Number(r.unit_price ?? 0), lineTotal: lineTotalDe(r) }));
}

export function computeTotals(items: DocItem[], fallbackSubtotal: number, tax: TaxConfig): DocTotals {
  const subtotal = items.length > 0 ? items.reduce((s, it) => s + it.lineTotal, 0) : fallbackSubtotal;
  const taxAmt = tax.mode === "pct" ? subtotal * tax.value / 100 : tax.value;
  return { subtotal, tax: taxAmt, total: subtotal + taxAmt, currency: tax.currency };
}
