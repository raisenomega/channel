/**
 * HUB by Raisen — Funciones del cliente de cotizaciones.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";
import type { RowQuote } from "../types";
import type { Result, RawQuote, QuoteListItem } from "./types";

function mapear(r: RawQuote): QuoteListItem {
  return {
    id: r.id,
    contactId: r.contact_id,
    status: r.status,
    totalAmount: r.total_amount,
    currency: r.currency ?? "USD",
    createdAt: r.created_at,
    expiresAt: r.expired_at,
  };
}

export async function listarQuotes(): Promise<Result<QuoteListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "contact_id", "status", "total_amount", "currency", "created_at", "expired_at"];
  const url = `${base}/quotes?select=${encodeURIComponent(cols.join(","))}&order=created_at.desc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawQuote[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function crearQuote(data: {
  contact_id: string;
  total_amount: number;
  currency: string;
  status?: string;
}): Promise<Result<RowQuote>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await fetch(`${base}/quotes`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({ ...data, status: data.status ?? "draft" }),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const created = (await res.json()) as RowQuote;
    return { ok: true, value: created };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}