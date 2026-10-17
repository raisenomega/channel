/**
 * HUB by Raisen — Hidratacion del tenant real del usuario (Hotfix L-1b).
 * resolveTenantId() solo ve el JWT (app_metadata.tenant_id) o el tenant
 * recordado al crearlo en ESTE browser. Un usuario que YA tiene tenant en
 * public.users (JWT sin refrescar, otro navegador) quedaba como "sin tenant" y
 * la UI mentia: "crea tu primer cliente". mi_tenant() (migracion 022, SECURITY
 * DEFINER) devuelve el tenant real sin recursion RLS de `users`.
 * Cero sinteticos: si el RPC no devuelve fila, el usuario NO tiene tenant.
 * C4 <=75.
 */
import { supabaseAuthHeaders, supabaseRestBase } from "../supabase";
import { rememberTenantId, resolveTenantId } from "../api-client";
import { readLocalSession } from "../auth";

interface MiTenantRow {
  tenant_id?: string | null;
}

let enVuelo: Promise<string | null> | null = null;

async function pedirMiTenant(): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/mi_tenant`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const cuerpo = (await res.json()) as MiTenantRow[] | MiTenantRow;
    const fila = Array.isArray(cuerpo) ? cuerpo[0] : cuerpo;
    const id = fila?.tenant_id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

/**
 * tenant del JWT / localStorage; si falta, lo resuelve del RPC mi_tenant y lo
 * recuerda. null = el usuario realmente no tiene tenant (estado honesto).
 */
export async function ensureTenantId(): Promise<string | null> {
  const cacheado = resolveTenantId();
  if (cacheado) return cacheado;
  enVuelo ??= pedirMiTenant().finally(() => {
    enVuelo = null;
  });
  const id = await enVuelo;
  if (id) rememberTenantId(id);
  return id;
}

/**
 * Error correcto cuando no hay tenant: SIN sesion es sesion caida
 * (no_autorizado -> /login, A-02); CON sesion es falta de tenant
 * (config_incompleta -> la pagina se queda y muestra su CTA, A-01).
 */
export function errorSinTenant(): { kind: "config_incompleta" } | { kind: "no_autorizado" } {
  return readLocalSession() ? { kind: "config_incompleta" } : { kind: "no_autorizado" };
}
