/**
 * HUB by Raisen — Estado EN VIVO de plantillas (Meta via backend). name -> status. C4 <=75.
 */
import { apiFetch } from "../api-client";
import { ensureTenantId } from "../tenant-client/mi-tenant";

export async function estadoPlantillas(): Promise<Record<string, string>> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return {};
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates/status`);
    if (!res.ok) return {};
    const j = (await res.json()) as { ok: boolean; statuses?: Array<{ name: string; status: string }> };
    const map: Record<string, string> = {};
    for (const s of j.statuses ?? []) map[s.name] = s.status;
    return map;
  } catch {
    return {};
  }
}
