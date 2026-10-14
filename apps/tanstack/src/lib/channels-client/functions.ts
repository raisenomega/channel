/**
 * HUB by Raisen — Funciones del cliente de canales.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";
import type { Channel, ChannelError, Result, RowInbox } from "./types";
import type { ChannelKind } from "@/components/ui/channel-icon";

function mapear(r: RowInbox): Channel {
  const kind = (r.channel_type ?? "webchat").toLowerCase() as ChannelKind;
  const sync = r.sync_status ?? "pending";
  return {
    id: String(r.id),
    kind,
    active: r.is_active === true,
    state: sync === "connected" ? "conectado" : "desconectado",
    provider: r.provider ?? null,
    syncStatus: sync,
  };
}

export async function listarCanales(): Promise<Result<Channel[], ChannelError>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "provider", "is_active", "sync_status", "channel_type", "name"];
  const url = `${base}/inboxes?select=${encodeURIComponent(cols.join(","))}&order=name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RowInbox[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

async function patchCanal(
  id: string,
  payload: Record<string, unknown>,
): Promise<Result<void, ChannelError>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await fetch(`${base}/inboxes?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    return { ok: true, value: undefined };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function toggleCanal(
  id: string,
  active: boolean,
): Promise<Result<void, ChannelError>> {
  return patchCanal(id, { is_active: active });
}