/**
 * HUB by Raisen — Cliente de facturas: convertir cotizacion -> factura (RPC) y listar facturas de un
 * contacto (RPC). Tenant server-side (users.tenant_id). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export interface InvoiceListItem { id: string; clientName: string; total: number; status: string; createdAt: string; }

export async function convertQuoteToInvoice(quoteId: string): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/convert_quote_to_invoice`, {
      method: "POST", headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ p_quote_id: quoteId }),
    });
    if (!res.ok) return null;
    const id = (await res.json()) as unknown;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export async function fetchInvoicesForContact(contactId: string): Promise<InvoiceListItem[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !contactId) return [];
  try {
    const res = await fetch(`${base}/rpc/get_invoices_for_contact`, {
      method: "POST", headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ p_contact_id: contactId }),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { id: string; client_name: string; total: number; status: string; created_at: string }[];
    return rows.map((r) => ({ id: r.id, clientName: r.client_name, total: Number(r.total), status: r.status, createdAt: r.created_at }));
  } catch {
    return [];
  }
}
