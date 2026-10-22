/**
 * HUB by Raisen — Datos del negocio para el PDF: compañia (nombre/direccion/telefono/email, override
 * editable en la plantilla sobre lo de Crear negocio), logo, estilo, tax (config), pie corto y
 * terminos. Todo en tenants.branding_config (sin migracion). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { TaxConfig } from "./doc-types";

export interface BizInfo {
  name: string; phone: string; email: string; address: string;
  logoUrl: string | null; style: string;
  tax: TaxConfig; footer1: string; terms: string;
}

interface Company { name?: string; address?: string; phone?: string; email?: string; }
interface Branding {
  logo_url?: string; pdf_style?: string; pdf_company?: Company;
  pdf_tax?: { mode?: string; value?: number; currency?: string }; pdf_footer1?: string; pdf_terms?: string;
}
interface Row { name?: string | null; phone?: string | null; street?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; branding_config?: Branding | null; }

const COLS = "name,phone,street,city,region,postal_code,branding_config";
const DEF_TAX: TaxConfig = { mode: "pct", value: 0, currency: "USD" };
const EMPTY: BizInfo = { name: "", phone: "", email: "", address: "", logoUrl: null, style: "clasico", tax: DEF_TAX, footer1: "", terms: "" };

export async function fetchBusinessInfo(tenantId: string): Promise<BizInfo> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !tenantId) return EMPTY;
  try {
    const res = await fetch(`${base}/tenants?id=eq.${encodeURIComponent(tenantId)}&select=${COLS}`, { headers });
    if (!res.ok) return EMPTY;
    const rows = (await res.json()) as Row[];
    const r = rows[0];
    if (!r) return EMPTY;
    const b = r.branding_config ?? {};
    const co = b.pdf_company ?? {};
    const addr = [r.street, r.city, r.region, r.postal_code].filter(Boolean).join(", ");
    const tx = b.pdf_tax ?? {};
    return {
      name: co.name || r.name || "", phone: co.phone || r.phone || "", email: co.email || "", address: co.address || addr,
      logoUrl: b.logo_url ?? null, style: b.pdf_style ?? "clasico",
      tax: { mode: tx.mode === "fixed" ? "fixed" : "pct", value: Number(tx.value ?? 0), currency: tx.currency || "USD" },
      footer1: b.pdf_footer1 ?? "", terms: b.pdf_terms ?? "",
    };
  } catch {
    return EMPTY;
  }
}
