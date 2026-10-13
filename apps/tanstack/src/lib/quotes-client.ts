/**
 * HUB by Raisen — Cliente de cotizaciones (tabla `quotes`).
 * CRUD via Supabase REST. Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";
import type { RowQuote } from "./types";

export type QuoteError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: QuoteError };

interface RawQuote {
  id: string;
  contact_id: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  expires_at: string | null;
}

export interface QuoteListItem {
  id: string;
  contactId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  expiresAt: string | null;
}

function mapear(r: RawQuote): QuoteListItem {
  return {
    id: r.id,
    contactId: r.contact_id,
    status: r.status,
    totalAmount: r.total_amount,
    currency: r.currency ?? "USD",
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

export async function listarQuotes(): Promise<Result<QuoteListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "contact_id", "status", "total_amount", "currency", "created_at", "expires_at"];
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