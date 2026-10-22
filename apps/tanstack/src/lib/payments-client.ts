/**
 * HUB by Raisen — Cliente de pagos (tabla `payments`).
 * Lectura via Supabase REST. Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export type PaymentError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: PaymentError };

interface RawPayment {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  currency: string;
  provider: string | null;
  created_at: string;
}

export interface PaymentListItem {
  id: string;
  orderId: string | null;
  status: string;
  amount: number;
  currency: string;
  provider: string | null;
  createdAt: string;
}

function mapear(r: RawPayment): PaymentListItem {
  return {
    id: r.id,
    orderId: r.order_id,
    status: r.status,
    amount: r.amount,
    currency: r.currency ?? "USD",
    provider: r.provider,
    createdAt: r.created_at,
  };
}

export async function listarPagos(): Promise<Result<PaymentListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "order_id", "status", "amount", "currency", "provider", "created_at"];
  const url = `${base}/payments?select=${encodeURIComponent(cols.join(","))}&order=created_at.desc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawPayment[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}