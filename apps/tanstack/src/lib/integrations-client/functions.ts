/**
 * HUB by Raisen — Funciones del cliente de integraciones.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";
import type { Integration, IntegrationError, Result, RowIntegration, IntegrationType } from "./types";

const TYPE_SET = new Set<string>(["nucleo", "omega", "pos", "table", "health", "home", "fleet"]);

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