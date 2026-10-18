/**
 * HUB by Raisen — M-9: datos del tenant del usuario (nombre + plan) via RPC mi_tenant
 * (migracion 022 devuelve tenant_id, name, slug, plan, email, role). Para mostrar
 * tenant.name en el KPI del dashboard y en /settings (antes salia vacio).
 * Cero sinteticos: null = sin tenant. C4 <=75.
 */
import { supabaseAuthHeaders, supabaseRestBase } from "../supabase";

export interface MiTenantInfo {
  readonly tenantId: string;
  readonly name: string;
  readonly plan: string;
}

interface Row { tenant_id?: string | null; name?: string | null; plan?: string | null; }

export async function fetchMiTenantInfo(): Promise<MiTenantInfo | null> {
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
    const body = (await res.json()) as Row[] | Row;
    const r = Array.isArray(body) ? body[0] : body;
    if (!r?.tenant_id) return null;
    return { tenantId: String(r.tenant_id), name: String(r.name ?? ""), plan: String(r.plan ?? "") };
  } catch {
    return null;
  }
}
