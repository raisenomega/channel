/**
 * HUB by Raisen — Verdad VIVA de conexion (patron Aria/Omega): el estado "conectado" NO sale de un flag
 * guardado; sale de lo que Zernio realmente tiene bajo el tenant AHORA. GET /tenants/:id/connected-accounts.
 * Si Meta/Zernio soltaron el numero, NO aparece aqui -> el chip deja de mentir. C4 <=75.
 */
import { apiFetch } from "../api-client";
import { ensureTenantId } from "../tenant-client/mi-tenant";

export async function listarCuentasVivas(): Promise<string[]> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return [];
  try {
    const res = await apiFetch(`/tenants/${tenantId}/connected-accounts`);
    if (!res.ok) return [];
    const b = await res.json() as { ok?: boolean; items?: Array<{ platform?: string }> };
    if (!b.ok || !Array.isArray(b.items)) return [];
    return b.items.map((i) => String(i.platform ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}
