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

// O-2/O-3: pide el auth_url del OAuth (patron OMEGA). NO afirma conexion (P1): solo
// devuelve la URL para el popup; el verde real llega por refetch tras el BroadcastChannel.
export async function obtenerConnectUrl(platform: string): Promise<Result<string, ChannelError>> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return { ok: false, error: errorSinTenant() };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/channels/${platform}/connect-url`);
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const b = await res.json() as { ok?: boolean; auth_url?: string };
    return b.auth_url ? { ok: true, value: b.auth_url } : { ok: false, error: { kind: "red", cause: "auth_url_ausente" } };
  } catch (e) { return { ok: false, error: { kind: "red", cause: String(e) } }; }
}

// Toggle conectado/desconectado por plataforma. PATCH /tenants/:id/channels/:platform {connected}.
// Apagar -> disconnected (chip gris); encender -> connected (sin re-OAuth; el enlace Zernio persiste).
export async function toggleCanal(platform: string, connected: boolean): Promise<Result<void, ChannelError>> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return { ok: false, error: errorSinTenant() };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/channels/${encodeURIComponent(platform)}`, { method: "PATCH", body: JSON.stringify({ connected }) });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    return { ok: true, value: undefined };
  } catch (e) { return { ok: false, error: { kind: "red", cause: String(e) } }; }
}
// Reconcilia channel_connections con las cuentas REALES del tenant en Zernio (POST /reconcile).
// Sostiene el chip verde sin depender del redirect del callback. Best-effort (silencioso).
export async function reconciliarCanales(): Promise<void> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return;
  try { await apiFetch(`/tenants/${tenantId}/channels/reconcile`, { method: "POST" }); } catch { /* best-effort */ }
}
