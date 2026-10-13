/**
 * HUB by Raisen — Cliente de ordenes (tabla `orders`).
 * Lectura via Supabase REST. Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export type OrderError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: OrderError };

interface RawOrder {
  id: string;
  quote_id: string | null;
  contact_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  paid_at: string | null;
}

export interface OrderListItem {
  id: string;
  quoteId: string | null;
  contactId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
}

function mapear(r: RawOrder): OrderListItem {
  return {
    id: r.id,
    quoteId: r.quote_id,
    contactId: r.contact_id,
    status: r.status,
    totalAmount: r.total_amount,
    currency: r.currency ?? "USD",
    createdAt: r.created_at,
    paidAt: r.paid_at,
  };
}

export async function listarOrdenes(): Promise<Result<OrderListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "quote_id", "contact_id", "status", "total_amount", "currency", "created_at", "paid_at"];
  const url = `${base}/orders?select=${encodeURIComponent(cols.join(","))}&order=created_at.desc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawOrder[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}