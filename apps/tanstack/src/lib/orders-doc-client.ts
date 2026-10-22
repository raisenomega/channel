/**
 * HUB by Raisen — Lee cliente + lineas de una orden (get_order_doc / get_order_items) para el PDF
 * "ORDEN". Tenant server-side. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";
import type { QuoteLine } from "./quotes-client";

export interface OrderDoc { name: string; phone: string; email: string; address: string; service: string; }

async function rpc(name: string, body: object): Promise<unknown> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/${name}`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function fetchOrderDoc(orderId: string): Promise<OrderDoc | null> {
  if (!orderId) return null;
  const rows = (await rpc("get_order_doc", { p_order_id: orderId })) as { client_name?: string; client_phone?: string; client_email?: string; client_address?: string; service?: string }[] | null;
  const r = rows?.[0];
  return r ? { name: r.client_name ?? "", phone: r.client_phone ?? "", email: r.client_email ?? "", address: r.client_address ?? "", service: r.service ?? "" } : null;
}

export async function fetchOrderLines(orderId: string): Promise<QuoteLine[]> {
  if (!orderId) return [];
  const rows = (await rpc("get_order_items", { p_order_id: orderId })) as { description: string; quantity: number; unit_price: number; discount_pct?: number }[] | null;
  return (rows ?? []).map((r) => { const q = Number(r.quantity), p = Number(r.unit_price), d = Number(r.discount_pct ?? 0); return { description: r.description, quantity: q, unitPrice: p, discountPct: d, lineTotal: q * p * (1 - d / 100) }; });
}
