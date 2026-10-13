/**
 * HUB by Raisen — Cliente CRM de contactos (tabla `contacts`).
 * CRUD via Supabase REST. Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";
import type { RowContact } from "./types";

export type ContactError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: ContactError };

interface RawContact {
  id: string;
  display_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  segment: string | null;
  ltv_usd: number | null;
  total_orders: number | null;
  preferred_channel: string | null;
  marketing_opt_in: boolean | null;
  do_not_contact: boolean | null;
}

export interface ContactListItem {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  segment: string | null;
  ltvUsd: number;
  totalOrders: number;
}

function mapear(r: RawContact): ContactListItem {
  return {
    id: r.id,
    displayName: r.display_name ?? "—",
    phone: r.primary_phone,
    email: r.primary_email,
    segment: r.segment,
    ltvUsd: r.ltv_usd ?? 0,
    totalOrders: r.total_orders ?? 0,
  };
}

export async function listarContactos(): Promise<Result<ContactListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "display_name", "primary_phone", "primary_email", "segment", "ltv_usd", "total_orders"];
  const url = `${base}/contacts?select=${encodeURIComponent(cols.join(","))}&order=display_name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawContact[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function crearContacto(data: {
  display_name: string;
  primary_phone?: string;
  primary_email?: string;
  segment?: string;
}): Promise<Result<RowContact>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await fetch(`${base}/contacts`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const created = (await res.json()) as RowContact;
    return { ok: true, value: created };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}