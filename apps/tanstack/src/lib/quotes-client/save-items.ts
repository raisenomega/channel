/**
 * HUB by Raisen — Guarda una cotizacion con sus lineas via RPC save_quote_with_items (atomico,
 * tenant server-side). Mapea camelCase -> snake_case. Devuelve el id de la cotizacion o null. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";

export interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
}

export interface QuoteSave {
  id?: string;
  contactId: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export async function saveQuoteWithItems(q: QuoteSave, lines: QuoteLine[]): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const p_quote = {
    id: q.id ?? "", contact_id: q.contactId, currency: q.currency, status: "draft",
    subtotal: q.subtotal, tax_total: q.taxTotal, total: q.total,
  };
  const p_items = lines.map((l) => ({
    description: l.description, quantity: l.quantity, unit_price: l.unitPrice,
    discount_pct: l.discountPct, line_total: l.lineTotal,
  }));
  try {
    const res = await fetch(`${base}/rpc/save_quote_with_items`, {
      method: "POST", headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ p_quote, p_items }),
    });
    if (!res.ok) return null;
    const id = (await res.json()) as unknown;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}
