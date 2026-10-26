/**
 * HUB by Raisen — Datos del negocio (tenants + branding_config) y del cliente para el DOCUMENTO formal de la
 * cotizacion publica. Compone todo lo que la pagina /q/:token necesita. Service-role. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { leerCotizacionPorToken, type PublicQuote } from "./public-quote.query.ts";

export interface DocNegocio { name: string; phone: string; email: string; address: string; logoUrl: string | null; terms: string; }
export interface DatosCotizacion { quote: PublicQuote; biz: DocNegocio; cliente: string; numero: string; fecha: string; token: string; }

async function negocioParaDoc(tenantId: string): Promise<DocNegocio> {
  const { data } = await supabase.from("tenants").select("name, phone, street, city, region, postal_code, branding_config").eq("id", tenantId).maybeSingle();
  const r = (data ?? {}) as { name?: string; phone?: string; street?: string; city?: string; region?: string; postal_code?: string; branding_config?: Record<string, unknown> };
  const b = (r.branding_config ?? {}) as { logo_url?: string; pdf_company?: { name?: string; address?: string; phone?: string; email?: string }; pdf_terms?: string };
  const co = b.pdf_company ?? {};
  const addr = [r.street, r.city, r.region, r.postal_code].filter(Boolean).join(", ");
  return { name: co.name || r.name || "Cotizacion", phone: co.phone || r.phone || "", email: co.email || "", address: co.address || addr, logoUrl: b.logo_url ?? null, terms: b.pdf_terms ?? "" };
}

async function nombreCliente(contactId: string | null): Promise<string> {
  if (!contactId) return "";
  const { data } = await supabase.from("contacts").select("display_name").eq("id", contactId).maybeSingle();
  return (data as { display_name?: string } | null)?.display_name ?? "";
}

export async function datosCotizacion(token: string): Promise<DatosCotizacion | null> {
  const quote = await leerCotizacionPorToken(token);
  if (!quote) return null;
  const [biz, cliente] = await Promise.all([negocioParaDoc(quote.tenantId), nombreCliente(quote.contactId)]);
  return { quote, biz, cliente, numero: "COT-" + token.slice(0, 8).toUpperCase(), fecha: quote.createdAt.slice(0, 10), token };
}
