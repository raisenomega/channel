/**
 * HUB by Raisen — sync best-effort a Supabase (RLS por tenant). Si no es
 * viable (sin config/session) el estado se mantiene local (P1 honesto).
 */
import { CanalState, ProveedorState, PROVIDER_CANAL, SyncMark, modeloDe } from "./channel-model.ts";
import { auth, type SessionUsuario } from "./auth-client.ts";

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

function sesion(): SessionUsuario | null {
  try {
    return auth.leer();
  } catch {
    return null;
  }
}

async function escribir(tabla: string, cuerpo: Record<string, unknown>): Promise<SyncMark> {
  const { supabaseUrl, anonKey } = config();
  const s = sesion();
  if (!s?.accessToken || !s.tenant?.tenantId || !supabaseUrl || !anonKey) return "local";
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        "content-type": "application/json",
        "prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify(cuerpo),
    });
    return res.ok ? "cloud" : "error";
  } catch {
    return "error";
  }
}

export async function sincronizarInbox(c: CanalState): Promise<SyncMark> {
  const s = sesion();
  const cuerpo = {
    tenant_id: s?.tenant?.tenantId, channel_type: c.key, provider: PROVIDER_CANAL[c.key],
    name: c.key, is_active: c.active, sync_status: c.active ? "connected" : "disconnected",
  };
  return escribir("inboxes", cuerpo);
}

export async function sincronizarAutonomia(c: CanalState): Promise<SyncMark> {
  const s = sesion();
  const cuerpo = { tenant_id: s?.tenant?.tenantId, channel: c.key, is_active: c.autonomous };
  return escribir("agent_autonomy_config", cuerpo);
}

export async function sincronizarProveedor(p: ProveedorState, apiKey: string): Promise<SyncMark> {
  const s = sesion();
  const cuerpo = {
    tenant_id: s?.tenant?.tenantId,
    provider: p.provider,
    model: modeloDe(p.provider),
    is_active: true,
    secrets_encrypted: { api_key: apiKey },
  };
  return escribir("ai_provider_configs", cuerpo);
}