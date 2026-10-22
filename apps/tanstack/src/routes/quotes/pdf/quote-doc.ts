/**
 * HUB by Raisen — Lee los datos del cliente de una cotizacion (telefono/email/direccion de entrega) +
 * servicio, via RPC get_quote_doc (determinista por users.tenant_id). Para el PDF. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface QuoteDoc { phone: string; email: string; address: string; service: string; }

export async function fetchQuoteDoc(quoteId: string): Promise<QuoteDoc | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !quoteId) return null;
  try {
    const res = await fetch(`${base}/rpc/get_quote_doc`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ p_quote_id: quoteId }) });
    if (!res.ok) return null;
    const rows = (await res.json()) as { client_phone?: string; client_email?: string; client_address?: string; service?: string }[];
    const r = rows[0];
    if (!r) return null;
    return { phone: r.client_phone ?? "", email: r.client_email ?? "", address: r.client_address ?? "", service: r.service ?? "" };
  } catch {
    return null;
  }
}
