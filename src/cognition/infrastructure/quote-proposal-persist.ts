/**
 * HUB by Raisen — P2: persiste la propuesta de cotizacion del agente como agent_drafts (status draft -> va a
 * FIRMA del operador). metadata.scope="quote", label="Cotizacion", quoteItems=lineas, subtotal/total, +
 * encabezado honesto (conclusion/identified/confidence 0-100). Al FIRMAR, el front crea la cotizacion real
 * (save_quote_with_items) con la sesion del dueno. NO envia nada. confidence del column = 0-1. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { AgentDraftsRepository } from "./agent-drafts.repository.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { QuoteProposal } from "../domain/quote-proposal.ts";
import { totales } from "../domain/quote-proposal.ts";

export interface QuoteConvRef { readonly tenantId: string; readonly conversationId: string; readonly contactId: string | null; readonly to?: string; readonly channel?: string; }

const repo = new AgentDraftsRepository();

export async function persistirPropuestaCotizacion(ref: QuoteConvRef, p: QuoteProposal): Promise<string> {
  const now = new Date().toISOString();
  const { subtotal, total } = totales(p.lines);
  const resumen = p.lines.map((l) => `${l.quantity} x ${l.description} = $${(l.quantity * l.unitPrice).toFixed(2)}`).join("\n") + `\n\nTotal: $${total.toFixed(2)}`;
  const meta: Record<string, unknown> = {
    scope: "quote", label: "Cotizacion", conclusion: p.conclusion, identified: p.identified, confidence: p.confidence,
    quoteItems: p.lines.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unitPrice, line_total: Math.round(l.quantity * l.unitPrice * 100) / 100 })),
    subtotal, total,
  };
  // NO guardamos to/channel: firmar = aprobar + crear cotizacion (el front), NO enviar el resumen como texto.
  if (ref.channel) meta["channel"] = ref.channel; // solo informativo (de que red vino)
  if (ref.contactId) meta["contactId"] = ref.contactId;
  const token = crypto.randomUUID(); meta["token"] = token; // link publico para el cliente: /q/<token>
  const draft: AgentDraft = {
    id: crypto.randomUUID(), tenantId: ref.tenantId as unknown as TenantId, conversationId: ref.conversationId as unknown as ConversationId,
    contactId: (ref.contactId ?? null) as unknown as ContactId | null, personaSlug: "zahra",
    inboundMessage: "(propuesta de cotizacion)", draftContent: resumen, confidence: Math.min(1, Math.max(0, Math.round(p.confidence) / 100)),
    reason: p.conclusion, status: "draft", aiDisclosureIncluded: false, traceId: crypto.randomUUID(), metadata: Object.freeze(meta),
    createdAt: now, updatedAt: now, approvedBy: null, approvedAt: null, rejectedReason: null, sentAt: null, providerMessageId: null, wasCorrect: null, feedbackNote: null,
  };
  await repo.insertar(draft);
  return token;
}

// Dedup: ya hay una cotizacion del agente pendiente de firma en esta conversacion?
export async function hayCotizacionPendiente(conversationId: string): Promise<boolean> {
  const { data } = await supabase.from("agent_drafts").select("metadata").eq("conversation_id", conversationId).eq("status", "draft").limit(20);
  const rows = (data ?? []) as Array<{ metadata?: { scope?: string } }>;
  return rows.some((r) => r.metadata?.scope === "quote");
}
