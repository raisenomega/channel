/**
 * HUB by Raisen — P2: FIRMAR una propuesta de cotizacion del agente = crear la cotizacion real (save_quote_
 * with_items, con la sesion del dueno -> current_tenant). Devuelve true si se creo. Luego el que llama marca
 * el draft aprobado. NO envia ni cobra: solo crea el borrador de cotizacion. C4 <=75.
 */
import { saveQuoteWithItems } from "@/lib/quotes-client/save-items";
import type { DraftItem } from "@/hooks/useDraftsPending";

export async function firmarCotizacion(d: DraftItem): Promise<boolean> {
  const lines = (d.quoteItems ?? []).map((l) => ({
    description: l.description, quantity: l.quantity, unitPrice: l.unit_price, discountPct: 0, lineTotal: l.line_total,
  }));
  if (lines.length === 0 || !d.quoteContactId) return false;
  const total = typeof d.quoteTotal === "number" ? d.quoteTotal : lines.reduce((s, l) => s + l.lineTotal, 0);
  const id = await saveQuoteWithItems({
    contactId: d.quoteContactId, currency: "USD", subtotal: total, taxTotal: 0, total,
    clientName: d.contactName ?? "", clientPhone: d.contactPhone ?? "", clientEmail: "", clientAddress: "", service: "",
  }, lines);
  return id !== null;
}
