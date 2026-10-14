/**
 * HUB by Raisen — Operaciones del cliente de integraciones.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { IntegrationError, IntegrationConfig, IntegrationType, filaAVista } from "./integrations-client-types.ts";
import { hubConfig, sesion } from "./integrations-client-helpers.ts";

/** Carga las configuraciones de integracion reales del tenant autenticado. */
export async function cargarIntegraciones(): Promise<Result<readonly IntegrationConfig[], IntegrationError>> {
  const { supabaseUrl, anonKey } = hubConfig();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  const s = sesion();
  if (!s?.accessToken) return err({ kind: "sin_sesion" });
  if (!s.tenant?.tenantId) return err({ kind: "sin_tenant" });
  try {
    const url = `${supabaseUrl}/rest/v1/integration_configs?select=*&order=type.asc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { apikey: anonKey, authorization: `Bearer ${s.accessToken}`, "content-type": "application/json" },
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) {
      if (res.status === 404) return ok(Object.freeze([]));
      return err({ kind: "red", cause: `http_${res.status}` });
    }
    const filas = (await res.json()) as Array<unknown>;
    const vistos = filas
      .map((r) => filaAVista(r as never))
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
  const { supabaseUrl, anonKey } = hubConfig();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  const s = sesion();
  if (!s?.accessToken) return err({ kind: "sin_sesion" });
  if (!s.tenant?.tenantId) return err({ kind: "sin_tenant" });
  try {
    const url = `${supabaseUrl}/rest/v1/integration_configs?type=eq.${encodeURIComponent(tipo)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { apikey: anonKey, authorization: `Bearer ${s.accessToken}`, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) return err({ kind: "red", cause: `http_${res.status}` });
    return ok(null);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}