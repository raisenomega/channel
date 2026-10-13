/**
 * HUB by Raisen — Cliente de integraciones ecosistema.
 * Lista y alterna estado de integraciones desde `integration_configs`.
 * Sin datos mock: si la tabla no existe o está vacía, retorna vacío honesto (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export type IntegrationType =
  | "nucleo" | "omega" | "pos" | "table" | "health" | "home" | "fleet";

export interface Integration {
  readonly id: string;
  readonly tenantId: string;
  readonly type: IntegrationType;
  readonly config: Readonly<Record<string, unknown>>;
  readonly isActive: boolean;
  readonly lastSyncAt: string | null;
}

export type IntegrationError =
  | { kind: "config_incompleta"; cause?: string }
  | { kind: "sin_sesion"; cause?: string }
  | { kind: "no_autorizado"; cause?: string }
  | { kind: "red"; cause?: string };

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

interface RowIntegration {
  id: string;
  tenant_id: string;
  type: string;
  config: Record<string, unknown> | null;
  is_active: boolean | null;
  last_sync_at: string | null;
}

export const TIPO_INTEGRACION: readonly IntegrationType[] = Object.freeze([
  "nucleo", "omega", "pos", "table", "health", "home", "fleet",
]);

const TYPE_SET = new Set<string>(TIPO_INTEGRACION);

function mapear(row: RowIntegration): Integration | null {
  if (!TYPE_SET.has(row.type)) return null;
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    type: row.type as IntegrationType,
    config: Object.freeze({ ...(row.config ?? {}) }),
    isActive: row.is_active === true,
    lastSyncAt: row.last_sync_at ?? null,
  };
}

/**
 * Lista las configuraciones de integración del tenant autenticado.
 * Si la tabla no existe (404) retorna array vacío honesto (N5).
 */
export async function listarIntegraciones(): Promise<Result<Integration[], IntegrationError>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base) return { ok: false, error: { kind: "config_incompleta" } };
  if (!headers) return { ok: false, error: { kind: "sin_sesion" } };

  const cols = ["id", "tenant_id", "type", "config", "is_active", "last_sync_at"];
  const url = `${base}/integration_configs?select=${encodeURIComponent(cols.join(","))}&order=type.asc`;

  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: { kind: "no_autorizado" } };
    }
    // 404: tabla/migración aún no existe → vacío honesto
    if (res.status === 404) return { ok: true, value: [] };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };

    const filas = (await res.json()) as RowIntegration[];
    const integraciones = filas
      .map(mapear)
      .filter((i): i is Integration => i !== null);
    return { ok: true, value: integraciones };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

/**
 * Alterna el estado activo/inactivo de una integración.
 */
export async function toggleIntegracion(
  id: string,
  isActive: boolean,
): Promise<Result<void, IntegrationError>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base) return { ok: false, error: { kind: "config_incompleta" } };
  if (!headers) return { ok: false, error: { kind: "sin_sesion" } };

  try {
    const url = `${base}/integration_configs?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...headers,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: { kind: "no_autorizado" } };
    }
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    return { ok: true, value: undefined };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}