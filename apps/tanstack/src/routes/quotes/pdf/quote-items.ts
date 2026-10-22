/**
 * HUB by Raisen — Lineas de una cotizacion (quote_line_items) + totales con tax a nivel documento
 * (porcentaje del subtotal o cantidad fija). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { QuoteLine } from "@/lib/quotes-client";
import type { DocItem, DocTotals, TaxConfig } from "./doc-types";

interface Row { description: string; quantity: number; unit_price: number; discount_pct?: number; }

export async function fetchQuoteLines(quoteId: string): Promise<QuoteLine[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return [];
  try {
    const res = await fetch(`${base}/rpc/get_quote_items`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ p_quote_id: quoteId }) });
    if (!res.ok) return [];
    const rows = (await res.json()) as Row[];
    return rows.map((r) => { const q = Number(r.quantity), p = Number(r.unit_price), d = Number(r.discount_pct ?? 0); return { description: r.description, quantity: q, unitPrice: p, discountPct: d, lineTotal: q * p * (1 - d / 100) }; });
  } catch {
    return [];
  }
}

export async function fetchQuoteItems(quoteId: string): Promise<DocItem[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return [];
  try {
    const res = await fetch(`${base}/rpc/get_quote_items`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ p_quote_id: quoteId }) });
    if (!res.ok) return [];
    const rows = (await res.json()) as Row[];
    return rows.map((r) => ({ description: r.description, quantity: Number(r.quantity), unitPrice: Number(r.unit_price), lineTotal: Number(r.quantity) * Number(r.unit_price) * (1 - Number(r.discount_pct ?? 0) / 100) }));
  } catch {
    return [];
  }
}

export function computeTotals(items: DocItem[], fallbackSubtotal: number, tax: TaxConfig): DocTotals {
  const subtotal = items.length > 0 ? items.reduce((s, it) => s + it.lineTotal, 0) : fallbackSubtotal;
  const taxAmt = tax.mode === "pct" ? subtotal * tax.value / 100 : tax.value;
  return { subtotal, tax: taxAmt, total: subtotal + taxAmt, currency: tax.currency };
}
