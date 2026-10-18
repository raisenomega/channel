/**
 * HUB by Raisen — O-4: fetchers del page picker FB. pending-pages lista las paginas del consent;
 * select-page adjunta una. Los tokens viven server-side (stash); el cliente solo ve {id,name}.
 */
import { apiFetch } from "../api-client";
import { ensureTenantId } from "../tenant-client/mi-tenant";

export interface FbPage { readonly id: string; readonly name: string; }

// V-vigía: reqId se reenvia como ?req= para correlacionar con los logs backend (pending-pages/select-page).
export async function obtenerPaginasFb(reqId = "-"): Promise<FbPage[]> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return [];
  try {
    const r = await apiFetch(`/tenants/${tenantId}/channels/facebook/pending-pages?req=${encodeURIComponent(reqId)}`);
    if (!r.ok) return [];
    return ((await r.json()) as { pages?: FbPage[] }).pages ?? [];
  } catch { return []; }
}

export async function seleccionarPaginaFb(pageId: string, reqId = "-"): Promise<boolean> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return false;
  try {
    const r = await apiFetch(`/tenants/${tenantId}/channels/facebook/select-page?req=${encodeURIComponent(reqId)}`, { method: "POST", body: JSON.stringify({ page_id: pageId }) });
    return r.ok;
  } catch { return false; }
}
