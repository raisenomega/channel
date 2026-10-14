/**
 * HUB by Raisen — Fetchers REST scoped al contacto del hilo activo.
 * Cotizaciones, órdenes y pagos del cliente seleccionado.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { RowQuote, RowOrder, RowPayment } from "@/lib/types";

function enc(v: string): string { return encodeURIComponent(v); }

export async function fetchQuotesForContact(contactId: string): Promise<RowQuote[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = ["id", "contact_id", "status", "total_amount", "currency", "created_at", "expires_at"].join(",");
  const url = `${base}/quotes?select=${enc(cols)}&contact_id=eq.${enc(contactId)}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowQuote[];
  } catch { return []; }
}

export async function fetchOrdersForContact(contactId: string): Promise<RowOrder[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = ["id", "quote_id", "contact_id", "status", "total_amount", "currency", "created_at", "paid_at"].join(",");
  const url = `${base}/orders?select=${enc(cols)}&contact_id=eq.${enc(contactId)}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowOrder[];
  } catch { return []; }
}

export async function fetchPaymentsForContact(contactId: string): Promise<RowPayment[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const [orders, quotes] = await Promise.all([
      fetchOrdersForContact(contactId),
      fetchQuotesForContact(contactId),
    ]);
    const orderIds = orders.map((o) => o.id);
    const quoteIds = quotes.map((q) => q.id);
    if (orderIds.length === 0 && quoteIds.length === 0) return [];
    const clauses: string[] = [];
    if (orderIds.length > 0) clauses.push(`order_id.in.(${orderIds.map((id: string) => encodeURIComponent(id)).join(",")})`);
    if (quoteIds.length > 0) clauses.push(`quote_id.in.(${quoteIds.map((id: string) => encodeURIComponent(id)).join(",")})`);
    const cols = ["id", "order_id", "quote_id", "status", "amount", "currency", "provider", "created_at"].join(",");
    const url = `${base}/payments?select=${enc(cols)}&or=(${clauses.join(",")})&order=created_at.desc&limit=50`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as RowPayment[];
  } catch { return []; }
}