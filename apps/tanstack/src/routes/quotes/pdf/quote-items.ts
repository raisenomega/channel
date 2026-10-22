/**
 * HUB by Raisen — Lineas de una cotizacion (quote_line_items, forma Nucleo) + calculo de totales
 * (subtotal/tax/total) con la misma formula de Nucleo. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { DocItem, DocTotals } from "./doc-types";

interface Row { description: string; quantity: number; unit_price: number; discount_pct: number; tax_pct: number; line_total: number; }

export async function fetchQuoteItems(quoteId: string): Promise<DocItem[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return [];
  try {
    const cols = "description,quantity,unit_price,discount_pct,tax_pct,line_total";
    const res = await fetch(`${base}/quote_line_items?quote_id=eq.${encodeURIComponent(quoteId)}&select=${cols}&order=sort.asc`, { headers });
    if (!res.ok) return [];
    const rows = (await res.json()) as Row[];
    return rows.map((r) => ({
      description: r.description, quantity: Number(r.quantity), unitPrice: Number(r.unit_price),
      discountPct: Number(r.discount_pct), taxPct: Number(r.tax_pct), lineTotal: Number(r.line_total),
    }));
  } catch {
    return [];
  }
}

export function computeTotals(items: DocItem[], fallbackTotal: number, currency: string): DocTotals {
  if (items.length === 0) return { subtotal: fallbackTotal, tax: 0, total: fallbackTotal, currency };
  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const base = it.quantity * it.unitPrice * (1 - it.discountPct / 100);
    subtotal += base;
    tax += base * it.taxPct / 100;
  }
  return { subtotal, tax, total: subtotal + tax, currency };
}
