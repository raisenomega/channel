/**
 * HUB by Raisen — Guarda/lee el estilo de plantilla PDF elegido en tenants.branding_config.pdf_style
 * (jsonb ya existente, sin migracion). RLS tenants_update_own. C4 <=75.
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

export async function fetchPdfStyle(tenantId: string): Promise<string> {
  const b = await readBranding(tenantId);
  return typeof b.pdf_style === "string" ? b.pdf_style : "clasico";
}

export async function savePdfStyle(tenantId: string, style: string): Promise<boolean> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return false;
  const b = await readBranding(tenantId);
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ branding_config: { ...b, pdf_style: style } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
