/**
 * HUB by Raisen — Funciones del cliente de contactos.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";
import type { Result, RawContact, ContactListItem } from "./types";

function mapear(r: RawContact): ContactListItem {
  return {
    id: r.id,
    displayName: r.display_name ?? "—",
    phone: r.primary_phone,
    email: r.primary_email,
    segment: r.segment,
    ltvUsd: r.ltv_usd ?? 0,
    totalOrders: r.total_orders ?? 0,
    channel: r.preferred_channel ?? null,
  };
}

export async function listarContactos(): Promise<Result<ContactListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "display_name", "primary_phone", "primary_email", "segment", "ltv_usd", "total_orders", "preferred_channel"];
  const url = `${base}/contacts?select=${encodeURIComponent(cols.join(","))}&order=created_at.desc`;
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
  address?: string;
}): Promise<Result<{ id: string }>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await fetch(`${base}/rpc/create_contact`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ p_name: data.display_name, p_phone: data.primary_phone ?? "", p_email: data.primary_email ?? "", p_segment: data.segment ?? "nuevo", p_address: data.address ?? "" }),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const id = (await res.json()) as unknown;
    if (typeof id !== "string") return { ok: false, error: { kind: "red", cause: "no_id" } };
    return { ok: true, value: { id } };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}