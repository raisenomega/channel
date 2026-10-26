/**
 * HUB by Raisen — Crea una cotizacion REAL (tabla quotes) con los 4 datos del cliente + items, y mintea el
 * token oficial (quote_approvals, hash SHA-256) para el link /q/<token> del FRONTEND (plantilla oficial, la
 * unica). Service-role directo (save_quote_with_items es authenticated-only). Devuelve el token. C4 <=75.
 */
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface QuoteItem { readonly description: string; readonly quantity: number; readonly unit_price: number; readonly line_total: number; }
export interface CotizacionOficialInput {
  readonly tenantId: string; readonly contactId: string;
  readonly cliente: { readonly nombre: string; readonly telefono: string; readonly email: string; readonly direccion: string };
  readonly items: readonly QuoteItem[]; readonly subtotal: number; readonly total: number; readonly service: string;
}

export async function crearCotizacionOficial(i: CotizacionOficialInput): Promise<string | null> {
  const base = supabaseBase(); const hdrs = supabaseHdrs();
  if (!base || !hdrs) return null;
  try {
    const qr = await fetch(`${base}/quotes`, { method: "POST", headers: { ...hdrs, Prefer: "return=representation" }, body: JSON.stringify({
      tenant_id: i.tenantId, contact_id: i.contactId, status: "sent", currency: "USD", sent_at: new Date().toISOString(),
      client_name: i.cliente.nombre, client_phone: i.cliente.telefono, client_email: i.cliente.email, client_address: i.cliente.direccion,
      items: i.items, subtotal: i.subtotal, tax_total: 0, total: i.total, total_amount: i.total, notes: i.service,
    }) });
    if (!qr.ok) { console.error("[cotiz-oficial] quote FALLO", (await qr.text().catch(() => "")).slice(0, 150)); return null; }
    const quoteId = (((await qr.json()) as Array<{ id: string }>)[0] ?? {}).id;
    if (!quoteId) return null;
    const token = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
    const ar = await fetch(`${base}/quote_approvals`, { method: "POST", headers: { ...hdrs, Prefer: "return=minimal" }, body: JSON.stringify({
      quote_id: quoteId, tenant_id: i.tenantId, token_hash: await sha256hex(token), expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    }) });
    if (!ar.ok) { console.error("[cotiz-oficial] token FALLO", (await ar.text().catch(() => "")).slice(0, 150)); return null; }
    return token;
  } catch (e) { console.error("[cotiz-oficial] ERROR", e instanceof Error ? e.message : e); return null; }
}
