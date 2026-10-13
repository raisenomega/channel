/**
 * HUB by Raisen — Cliente de canales (tabla `inboxes`).
 * Lectura y alternancia de activación vía Supabase REST. Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";
import type { ChannelKind } from "@/components/ui/channel-icon";

export interface Channel {
  readonly id: string;
  readonly kind: ChannelKind;
  readonly active: boolean;
  /** Modo conectado/desconectado/autonomo (vacio si no configurado). */
  readonly state: "conectado" | "desconectado" | "autonomo";
  readonly provider: string | null;
  readonly apiKey: string | null;
  readonly autonomous: boolean;
}

export type ChannelError =
  | { kind: "no_autorizado"; cause?: string }
  | { kind: "red"; cause?: string }
  | { kind: "config_incompleta"; cause?: string };

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

interface RowInbox {
  id: string;
  provider?: string | null;
  api_key?: string | null;
  active?: boolean | null;
  autonomous?: boolean | null;
  display_name?: string | null;
  channel_key?: string | null;
}

function mapear(r: RowInbox): Channel {
  const kind = (r.channel_key ?? r.display_name ?? "webchat").toLowerCase() as ChannelKind;
  const autonomous = r.autonomous === true;
  return {
    id: String(r.id),
    kind,
    active: r.active === true,
    state: autonomous ? "autonomo" : r.active === true ? "conectado" : "desconectado",
    provider: r.provider ?? null,
    apiKey: r.api_key ?? null,
    autonomous,
  };
}

export async function listarCanales(): Promise<Result<Channel[], ChannelError>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "provider", "api_key", "active", "autonomous", "display_name", "channel_key"];
  const url = `${base}/inboxes?select=${encodeURIComponent(cols.join(","))}&order=display_name.asc`;
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

/** PATCH genérico a una fila de `inboxes`. */
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
  return patchCanal(id, { active });
}

export async function setAutonomia(
  id: string,
  autonomous: boolean,
): Promise<Result<void, ChannelError>> {
  return patchCanal(id, { autonomous });
}