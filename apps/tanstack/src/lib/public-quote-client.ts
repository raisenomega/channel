/**
 * HUB by Raisen — Flujo publico de aprobacion de cotizacion. Acuna el token (authenticated) y lee/
 * responde la cotizacion por token SIN login (anon key). El link abre en el dominio donde HUB este
 * servido (window.location.origin). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders, getAnonKey } from "@/lib/supabase";

export interface PublicQuoteItem { description: string; quantity: number; unit_price: number; line_total: number; }
export interface PublicQuote {
  status: string;
  quote?: { client_name: string; client_phone: string | null; client_email: string | null; client_address: string | null; items: PublicQuoteItem[]; subtotal: number; tax_total: number; total: number; service: string | null; quote_number: string | null };
  brand?: { name: string; logo_url: string | null; style: string; phone?: string; email?: string; address?: string; tax?: { mode?: string; value?: number; currency?: string }; footer1?: string; terms?: string };
}

function anon(): Record<string, string> {
  const k = getAnonKey() ?? "";
  return { apikey: k, authorization: `Bearer ${k}`, "content-type": "application/json" };
}

export async function getPublicQuote(token: string): Promise<PublicQuote> {
  const base = supabaseRestBase();
  if (!base) return { status: "error" };
  try {
    const res = await fetch(`${base}/rpc/_public_get_quote_by_token`, { method: "POST", headers: anon(), body: JSON.stringify({ _token: token }) });
    return res.ok ? ((await res.json()) as PublicQuote) : { status: "error" };
  } catch { return { status: "error" }; }
}

export async function respondPublicQuote(token: string, decision: "accepted" | "rejected", note: string): Promise<string> {
  const base = supabaseRestBase();
  if (!base) return "error";
  try {
    const res = await fetch(`${base}/rpc/_public_quote_respond`, { method: "POST", headers: anon(), body: JSON.stringify({ _token: token, _decision: decision, _note: note }) });
    if (!res.ok) return "error";
    return ((await res.json()) as { status?: string }).status ?? "error";
  } catch { return "error"; }
}

export async function createApprovalToken(quoteId: string): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/create_quote_approval_token`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ p_quote_id: quoteId }) });
    if (!res.ok) return null;
    return ((await res.json()) as { token?: string }).token ?? null;
  } catch { return null; }
}

export function approvalLink(token: string): string {
  return `${window.location.origin}/q/${token}`;
}
