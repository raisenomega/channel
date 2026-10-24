/**
 * HUB by Raisen — #2 loop de aprendizaje: al aprobar/denegar un borrador, marca was_correct (juicio del
 * humano) y emite el evento a CEREBRO (fire-and-forget, no bloquea). payload.signal='human_judgment' +
 * verifiedOutcome=null = gancho para anclar al resultado real (venta) despues. C4 <=75. Sin any.
 */
import type { CerebroEvent } from "../../integrations/domain/cerebro.types.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../infrastructure/agent-drafts.repository.ts";

export function cerebroFeedbackEvent(draft: AgentDraft, wasCorrect: boolean): CerebroEvent {
  const meta = draft.metadata as { channel?: string; contactLabel?: string; contactPhone?: string; scope?: string };
  const wa = meta.channel === "whatsapp" && !!meta.contactPhone;
  const idValue = (wa ? meta.contactPhone : meta.contactLabel) ?? "";
  return {
    event: "conversation.resolved",
    sourcePlatform: "hub",
    tenantId: String(draft.tenantId),
    occurredAt: new Date().toISOString(),
    identity: { idType: wa ? "phone" : "social_handle", idValue, ...(draft.contactId ? { localId: String(draft.contactId) } : {}) },
    payload: {
      decision: wasCorrect ? "approved" : "rejected",
      wasCorrect, signal: "human_judgment", verifiedOutcome: null,
      persona: draft.personaSlug, opportunity: meta.scope === "opportunity",
    },
  };
}

export async function registrarAprendizaje(
  repo: AgentDraftsRepository, emit: ((e: CerebroEvent) => void) | undefined, draft: AgentDraft, wasCorrect: boolean,
): Promise<void> {
  try {
    await repo.registrarFeedback(draft.id, wasCorrect);
    emit?.(cerebroFeedbackEvent(draft, wasCorrect));
  } catch { /* el aprendizaje no bloquea la aprobacion/denegacion */ }
}
