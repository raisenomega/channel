/**
 * HUB by Raisen — Editar factura: guardar (save_invoice_with_items) + leer cliente/lineas
 * (get_invoice_doc / get_invoice_items) para el editor y el PDF. Tenant server-side. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";
import type { QuoteLine } from "./quotes-client";

export interface InvoiceSave { id: string; clientName: string; clientPhone: string; clientEmail: string; clientAddress: string; service: string; subtotal: number; taxTotal: number; total: number; }
export interface InvoiceDoc { phone: string; email: string; address: string; service: string; }

async function rpc(name: string, body: object): Promise<unknown> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/${name}`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function saveInvoiceWithItems(inv: InvoiceSave, lines: QuoteLine[]): Promise<string | null> {
  const p_invoice = { id: inv.id, client_name: inv.clientName, client_phone: inv.clientPhone, client_email: inv.clientEmail, client_address: inv.clientAddress, service: inv.service, subtotal: inv.subtotal, tax_total: inv.taxTotal, total: inv.total };
  const p_items = lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unitPrice, discount_pct: l.discountPct, line_total: l.lineTotal }));
  const id = await rpc("save_invoice_with_items", { p_invoice, p_items });
  return typeof id === "string" ? id : null;
}

// Lecturas DIRECTAS de invoices via RLS (mismo camino que listarInvoices que SI funciona): los RPC
// get_invoice_doc/get_invoice_items resolvian por auth.uid()->users y devolvian vacio para algunos tokens
// -> editor/PDF de factura en cero. items jsonb lo llena convert_quote_to_invoice (y el guardado).
async function leerFactura(invoiceId: string, cols: string): Promise<Record<string, unknown> | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers || !invoiceId) return null;
  try {
    const res = await fetch(`${base}/invoices?id=eq.${invoiceId}&select=${cols}`, { headers });
    if (!res.ok) return null;
    return ((await res.json()) as Record<string, unknown>[])[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchInvoiceDoc(invoiceId: string): Promise<InvoiceDoc | null> {
  const r = await leerFactura(invoiceId, "phone,email,client_address,notes");
  return r ? { phone: String(r["phone"] ?? ""), email: String(r["email"] ?? ""), address: String(r["client_address"] ?? ""), service: String(r["notes"] ?? "") } : null;
}

export async function fetchInvoiceLines(invoiceId: string): Promise<QuoteLine[]> {
  const r = await leerFactura(invoiceId, "items");
  const items = Array.isArray(r?.["items"]) ? (r!["items"] as Array<{ description?: string; quantity?: number; unit_price?: number; discount_pct?: number; line_total?: number }>) : [];
  return items.map((it) => { const q = Number(it.quantity ?? 0), p = Number(it.unit_price ?? 0), d = Number(it.discount_pct ?? 0); return { description: String(it.description ?? ""), quantity: q, unitPrice: p, discountPct: d, lineTotal: it.line_total != null ? Number(it.line_total) : q * p * (1 - d / 100) }; });
}
