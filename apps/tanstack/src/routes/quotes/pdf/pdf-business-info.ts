/**
 * HUB by Raisen — Datos del negocio para el PDF: los jala del tenant (lo que editas en Crear/Editar
 * negocio) + branding_config (logo, estilo, mensaje de pie). Un solo fetch para todo. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface BizInfo {
  name: string; phone: string; address: string; legalName: string; taxId: string;
  logoUrl: string | null; footer: string; style: string;
}

interface Branding { logo_url?: string; pdf_footer?: string; pdf_style?: string; }
interface Row {
  name?: string | null; phone?: string | null; street?: string | null; city?: string | null;
  region?: string | null; postal_code?: string | null; legal_name?: string | null;
  tax_id?: string | null; branding_config?: Branding | null;
}

const COLS = "name,phone,street,city,region,postal_code,legal_name,tax_id,branding_config";
const EMPTY: BizInfo = { name: "", phone: "", address: "", legalName: "", taxId: "", logoUrl: null, footer: "", style: "clasico" };

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
    const address = [r.street, r.city, r.region, r.postal_code].filter(Boolean).join(", ");
    return {
      name: r.name ?? "", phone: r.phone ?? "", address, legalName: r.legal_name ?? "", taxId: r.tax_id ?? "",
      logoUrl: b.logo_url ?? null, footer: b.pdf_footer ?? "", style: b.pdf_style ?? "clasico",
    };
  } catch {
    return EMPTY;
  }
}
