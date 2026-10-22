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

export async function fetchInvoiceDoc(invoiceId: string): Promise<InvoiceDoc | null> {
  if (!invoiceId) return null;
  const rows = (await rpc("get_invoice_doc", { p_invoice_id: invoiceId })) as { client_phone?: string; client_email?: string; client_address?: string; service?: string }[] | null;
  const r = rows?.[0];
  return r ? { phone: r.client_phone ?? "", email: r.client_email ?? "", address: r.client_address ?? "", service: r.service ?? "" } : null;
}

export async function fetchInvoiceLines(invoiceId: string): Promise<QuoteLine[]> {
  if (!invoiceId) return [];
  const rows = (await rpc("get_invoice_items", { p_invoice_id: invoiceId })) as { description: string; quantity: number; unit_price: number; discount_pct?: number }[] | null;
  return (rows ?? []).map((r) => { const q = Number(r.quantity), p = Number(r.unit_price), d = Number(r.discount_pct ?? 0); return { description: r.description, quantity: q, unitPrice: p, discountPct: d, lineTotal: q * p * (1 - d / 100) }; });
}
