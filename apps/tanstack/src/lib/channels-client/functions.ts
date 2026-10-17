/**
 * HUB by Raisen — Cliente de canales contra backend HUB (Hotfix H-3).
 * Reemplaza Supabase REST directo por apiFetch a GET /tenants/:id/channels.
 * toggleCanal devuelve not_implemented (no existe PATCH backend aun). C4 <=75.
 */
import { apiFetch } from "../api-client";
import { ensureTenantId, errorSinTenant } from "../tenant-client/mi-tenant";
import type { Channel, ChannelError, Result } from "./types";
import type { ChannelKind } from "@/components/ui/channel-icon";

export async function listarCanales(): Promise<Result<Channel[], ChannelError>> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return { ok: false, error: errorSinTenant() };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/channels`);
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const body = await res.json() as { ok: boolean; channels?: Array<Record<string, unknown>> };
    if (!body.ok || !Array.isArray(body.channels)) return { ok: false, error: { kind: "red", cause: "schema_invalido" } };
    const channels: Channel[] = body.channels.map((r) => ({
      id: String(r.id), kind: (r.platform ?? "webchat") as ChannelKind, active: !r.isPaused,
      state: r.status === "connected" ? "conectado" : "desconectado", provider: "zernio", syncStatus: r.status as string,
    }));
    return { ok: true, value: channels };
  } catch (e) {
    if (String(e) === "Error: no_session") return { ok: false, error: { kind: "no_autorizado" } };
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function toggleCanal(_channelId: string, _active: boolean): Promise<Result<void, ChannelError>> {
  return { ok: false, error: { kind: "not_implemented" } };
}