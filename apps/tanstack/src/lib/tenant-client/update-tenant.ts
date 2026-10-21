/**
 * HUB by Raisen — Editar datos del negocio DIRECTO a Supabase (NO depende de Railway).
 * PATCH /tenants (RLS tenants_update_own: id=current_tenant() AND is_hub_owner()). Whitelist IDÉNTICA
 * a la del backend (sanitizarPerfil + name + phone) para no escribir columnas no permitidas. C4 <=75.
 * (El CREAR de tenant sigue por el backend: requiere que ponga app_metadata.tenant_id en el JWT.)
 */
import { supabaseRestBase, supabaseAuthHeaders } from "../supabase";

export interface UpdateTenantResult {
  readonly ok: boolean;
  readonly error?: string;
}

// Mismas columnas que acepta el backend (sanitizarPerfil + name + phone + brand_tone/sla validados).
const CAMPOS = [
  "name", "phone", "street", "postal_code", "city", "region", "legal_name", "tax_id", "industry",
  "brand_services", "brand_target_audience", "operation_hours", "brand_mission", "brand_tone", "expected_response_sla",
] as const;

function columnas(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of CAMPOS) {
    const v = String(body[k] ?? "").trim();
    if (v) out[k] = v.slice(0, 1000);
  }
  return out;
}

export async function actualizarTelefonoTenant(tenantId: string, phone: string): Promise<UpdateTenantResult> {
  return patchTenant(tenantId, { phone });
}

/** S-10: edita datos del negocio (name + perfil + phone opcional). Directo a Supabase. */
export async function actualizarPerfilTenant(tenantId: string, patch: Record<string, unknown>): Promise<UpdateTenantResult> {
  return patchTenant(tenantId, patch);
}

async function patchTenant(tenantId: string, body: Record<string, unknown>): Promise<UpdateTenantResult> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return { ok: false, error: "config_incompleta" };
  const patch = columnas(body);
  if (Object.keys(patch).length === 0) return { ok: true };
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return { ok: false, error: `supabase ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
