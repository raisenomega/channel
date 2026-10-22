/**
 * HUB by Raisen — Guarda la config de plantilla en tenants.branding_config (sin migracion):
 * estilo, compañia (override), tax, mensaje de pie y terminos. RLS tenants_update_own. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { TaxConfig } from "./doc-types";

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

async function patch(tenantId: string, p: Record<string, unknown>): Promise<boolean> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return false;
  const b = await readBranding(tenantId);
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ branding_config: { ...b, ...p } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function savePdfStyle(tenantId: string, style: string): Promise<boolean> {
  return patch(tenantId, { pdf_style: style });
}

export interface TemplateConfig {
  company: { name: string; address: string; phone: string; email: string };
  tax: TaxConfig; footer1: string; terms: string;
}

export function saveTemplateConfig(tenantId: string, c: TemplateConfig): Promise<boolean> {
  return patch(tenantId, { pdf_company: c.company, pdf_tax: c.tax, pdf_footer1: c.footer1, pdf_terms: c.terms });
}
