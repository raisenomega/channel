/**
 * HUB by Raisen — Guarda la configuracion de plantilla en tenants.branding_config (jsonb, sin
 * migracion): pdf_style (estilo elegido) y pdf_footer (mensaje de pie). RLS tenants_update_own. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

async function readBranding(tenantId: string): Promise<Record<string, unknown>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return {};
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}&select=branding_config`, { headers });
    if (!res.ok) return {};
    const rows = (await res.json()) as Array<{ branding_config?: Record<string, unknown> | null }>;
    return rows[0]?.branding_config ?? {};
  } catch {
    return {};
  }
}

async function patchBranding(tenantId: string, patch: Record<string, unknown>): Promise<boolean> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return false;
  const b = await readBranding(tenantId);
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ branding_config: { ...b, ...patch } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function savePdfStyle(tenantId: string, style: string): Promise<boolean> {
  return patchBranding(tenantId, { pdf_style: style });
}

export function savePdfFooter(tenantId: string, footer: string): Promise<boolean> {
  return patchBranding(tenantId, { pdf_footer: footer });
}
