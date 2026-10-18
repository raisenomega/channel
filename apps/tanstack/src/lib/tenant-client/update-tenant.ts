/**
 * HUB by Raisen — R-3/R-4: wrapper para PATCH /tenants/:id (edit-number) via apiFetch con JWT.
 * NO refresca la sesion (el scope NO cambia al editar el numero; Compuerta #66). C4 <=75.
 */
import { apiFetch } from "../api-client";

export interface UpdateTenantResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function actualizarTelefonoTenant(tenantId: string, phone: string): Promise<UpdateTenantResult> {
  const res = await apiFetch(`/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PATCH",
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) return { ok: false, error: (await res.text()) || `PATCH /tenants failed (${res.status})` };
  return { ok: true };
}
