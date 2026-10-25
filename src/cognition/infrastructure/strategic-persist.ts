/**
 * HUB by Raisen — Sistema B 2b: persiste el borrador de CIERRE como agent_drafts (status draft -> va a
 * Borradores para aprobar). metadata lleva el encabezado del operador (conclusion/identified/confidence) +
 * scope strategic + to/channel para el envio al aprobar. NO auto-envia. C4 <=75.
 */
import { AgentDraftsRepository } from "./agent-drafts.repository.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { QuietConv } from "../application/followup-scanner.ts";
import type { ClosingDraft } from "../application/closing-draft.producer.ts";

const repo = new AgentDraftsRepository();

export async function persistirBorradorCierre(conv: QuietConv, d: ClosingDraft): Promise<void> {
  const now = new Date().toISOString();
  const meta: Record<string, unknown> = { scope: "strategic", label: "Cierre de venta", conclusion: d.conclusion, identified: d.identified, confidence: d.confidence };
  if (conv.participantExternalId) { meta["contactLabel"] = conv.participantExternalId; meta["to"] = conv.participantExternalId; }
  if (conv.channel) meta["channel"] = conv.channel;
  const draft: AgentDraft = {
    id: crypto.randomUUID(), tenantId: conv.tenantId as unknown as TenantId, conversationId: conv.id as unknown as ConversationId,
    contactId: (conv.contactId ?? null) as unknown as ContactId | null, personaSlug: "zahra",
    inboundMessage: "(seguimiento de conversacion quieta)", draftContent: d.message, confidence: Math.round(d.confidence / 10),
    reason: d.conclusion, status: "draft", aiDisclosureIncluded: false, traceId: crypto.randomUUID(), metadata: Object.freeze(meta),
    createdAt: now, updatedAt: now, approvedBy: null, approvedAt: null, rejectedReason: null, sentAt: null, providerMessageId: null, wasCorrect: null, feedbackNote: null,
  };
  await repo.insertar(draft);
}
