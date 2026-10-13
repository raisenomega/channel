/**
 * HUB by Raisen — Cliente de integraciones ecosistema (FASE 8).
 * Lee el estado real de `integration_configs` (JWT + RLS por tenant) via
 * Supabase REST. Si la tabla no existe (migracion 017 no aplicada) o no hay
 * filas, devuelve estado vacio honesto (N5): no se inventa nada conectado.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { auth, type SessionUsuario } from "./auth-client.ts";

export type IntegrationType =
  | "nucleo" | "omega" | "pos" | "table" | "health" | "home" | "fleet";

export interface IntegrationConfig {
  readonly id: string;
  readonly tenantId: string;
  readonly type: IntegrationType;
  readonly config: Readonly<Record<string, unknown>>;
  readonly isActive: boolean;
  readonly lastSyncAt: string | null;
}

export type IntegrationError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "sin_sesion" }
  | { readonly kind: "sin_tenant" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

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

interface IntegrationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly type: string;
  readonly config: Record<string, unknown>;
  readonly is_active: boolean;
  readonly last_sync_at: string | null;
}

function filaAVista(row: IntegrationRow): IntegrationConfig | null {
  if (!TIPO_INTEGRACION.includes(row.type as IntegrationType)) return null;
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    type: row.type as IntegrationType,
    config: Object.freeze({ ...row.config }),
    isActive: Boolean(row.is_active),
    lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
  };
}

/** Carga las configuraciones de integracion reales del tenant autenticado. */
export async function cargarIntegraciones(): Promise<Result<readonly IntegrationConfig[], IntegrationError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  const s = sesion();
  if (!s?.accessToken) return err({ kind: "sin_sesion" });
  if (!s.tenant?.tenantId) return err({ kind: "sin_tenant" });
  try {
    const url = `${supabaseUrl}/rest/v1/integration_configs?select=*&order=type.asc`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        "content-type": "application/json",
      },
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    // 404: la tabla/migracion 017 no existe aun -> estado vacio honesto.
    if (!res.ok) {
      if (res.status === 404) return ok(Object.freeze([]));
      return err({ kind: "red", cause: `http_${res.status}` });
    }
    const filas = (await res.json()) as IntegrationRow[];
    const vistos = filas
      .map(filaAVista)
      .filter((c): c is IntegrationConfig => c !== null);
    return ok(Object.freeze(vistos));
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

/** Persiste el toggle is_active de una integracion (best-effort, honrado). */
export async function guardarIntegracion(
  tipo: IntegrationType,
  isActive: boolean,
): Promise<Result<null, IntegrationError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  const s = sesion();
  if (!s?.accessToken) return err({ kind: "sin_sesion" });
  if (!s.tenant?.tenantId) return err({ kind: "sin_tenant" });
  try {
    const url = `${supabaseUrl}/rest/v1/integration_configs?type=eq.${encodeURIComponent(tipo)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });
    return ok(null);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

export const TIPO_INTEGRACION: readonly IntegrationType[] = Object.freeze([
  "nucleo", "omega", "pos", "table", "health", "home", "fleet",
]);