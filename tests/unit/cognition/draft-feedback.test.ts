/**
 * HUB by Raisen — #2: aprobar/denegar -> was_correct (juicio humano) + evento de aprendizaje a CEREBRO.
 */
import { expect, test } from "vitest";
import { cerebroFeedbackEvent, registrarAprendizaje } from "../../../src/cognition/application/draft-feedback.ts";
import type { AgentDraft } from "../../../src/cognition/domain/agent-draft.entity.ts";
import type { AgentDraftsRepository } from "../../../src/cognition/infrastructure/agent-drafts.repository.ts";
import type { CerebroEvent } from "../../../src/integrations/domain/cerebro.types.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const draft = (meta: Record<string, unknown>): AgentDraft => ({ id: "d1", tenantId: "t1", contactId: "ct1", personaSlug: "zahra", metadata: meta } as unknown as AgentDraft);

test("WC-01 approved -> conversation.resolved + signal human_judgment + verifiedOutcome null", () => {
  const e = cerebroFeedbackEvent(draft({ channel: "instagram", contactLabel: "@juan", scope: "opportunity" }), true);
  expect(e.event).toBe("conversation.resolved");
  expect(e.payload.decision).toBe("approved");
  expect(e.payload.wasCorrect).toBe(true);
  expect(e.payload.signal).toBe("human_judgment");
  expect(e.payload.verifiedOutcome).toBe(null);
  expect(e.payload.opportunity).toBe(true);
  expect(e.identity.id_value).toBe("@juan");
});

test("WC-02 whatsapp -> identity phone; rejected -> wasCorrect false", () => {
  const e = cerebroFeedbackEvent(draft({ channel: "whatsapp", contactPhone: "+1787", contactLabel: "+1787" }), false);
  expect(e.identity.id_type).toBe("phone");
  expect(e.payload.decision).toBe("rejected");
  expect(e.payload.wasCorrect).toBe(false);
});

test("WC-03 registrarAprendizaje marca feedback + emite (no bloquea)", async () => {
  let marked: [string, boolean] | null = null;
  let emitted: CerebroEvent | null = null;
  const repo = { registrarFeedback: async (id: string, wc: boolean) => { marked = [id, wc]; return ok(undefined); } } as unknown as AgentDraftsRepository;
  await registrarAprendizaje(repo, (e) => { emitted = e; }, draft({ channel: "whatsapp", contactPhone: "+1" }), true);
  expect(marked).toEqual(["d1", true]);
  expect(emitted!.event).toBe("conversation.resolved");
});
