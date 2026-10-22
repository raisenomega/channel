/**
 * HUB by Raisen — Flujo publico de factura: acuña el token (authenticated) y lee/solicita-pago la
 * factura por token SIN login (anon key). Espejo de public-quote-client. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders, getAnonKey } from "@/lib/supabase";

export interface PublicInvoiceItem { description: string; quantity: number; unit_price: number; line_total: number; }
export interface PublicInvoice {
  status: string;
  invoice?: { client_name: string; client_phone: string | null; client_email: string | null; client_address: string | null; items: PublicInvoiceItem[]; subtotal: number; tax_total: number; total: number; service: string | null; pay_requested: boolean };
  brand?: { name: string; logo_url: string | null; style: string };
}

function anon(): Record<string, string> {
  const k = getAnonKey() ?? "";
  return { apikey: k, authorization: `Bearer ${k}`, "content-type": "application/json" };
}

export async function getPublicInvoice(token: string): Promise<PublicInvoice> {
  const base = supabaseRestBase();
  if (!base) return { status: "error" };
  try {
    const res = await fetch(`${base}/rpc/_public_get_invoice_by_token`, { method: "POST", headers: anon(), body: JSON.stringify({ _token: token }) });
    return res.ok ? ((await res.json()) as PublicInvoice) : { status: "error" };
  } catch { return { status: "error" }; }
}

export async function requestPayInvoice(token: string): Promise<string> {
  const base = supabaseRestBase();
  if (!base) return "error";
  try {
    const res = await fetch(`${base}/rpc/_public_invoice_pay`, { method: "POST", headers: anon(), body: JSON.stringify({ _token: token }) });
    if (!res.ok) return "error";
    return ((await res.json()) as { status?: string }).status ?? "error";
  } catch { return "error"; }
}

export async function createInvoiceToken(invoiceId: string): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/create_invoice_token`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ p_invoice_id: invoiceId }) });
    if (!res.ok) return null;
    return ((await res.json()) as { token?: string }).token ?? null;
  } catch { return null; }
}

export function invoiceLink(token: string): string {
  return `${window.location.origin}/i/${token}`;
}
