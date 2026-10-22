/**
 * HUB by Raisen — Guarda la config de plantilla en tenants.branding_config via RPC save_branding
 * (SECURITY DEFINER, scoped a current_tenant()): funciona para el owner real aunque la RLS directa
 * de tenants exija is_hub_owner(). Merge jsonb server-side. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { TaxConfig } from "./doc-types";

async function saveBranding(patch: Record<string, unknown>): Promise<boolean> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return false;
  try {
    const res = await fetch(`${base}/rpc/save_branding`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ patch }),
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

export function savePdfStyle(_tenantId: string, style: string): Promise<boolean> {
  return saveBranding({ pdf_style: style });
}

export function saveLogoUrl(_tenantId: string, url: string): Promise<boolean> {
  return saveBranding({ logo_url: url });
}

export interface TemplateConfig {
  company: { name: string; address: string; phone: string; email: string };
  tax: TaxConfig; footer1: string; terms: string;
}

export function saveTemplateConfig(_tenantId: string, c: TemplateConfig): Promise<boolean> {
  return saveBranding({ pdf_company: c.company, pdf_tax: c.tax, pdf_footer1: c.footer1, pdf_terms: c.terms });
}
