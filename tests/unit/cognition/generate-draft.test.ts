/**
 * HUB by Raisen — S3: GenerateDraftHandler compone contexto -> reason -> persist. Verifica que el draft
 * lleva el texto del reasoner + to (= quien escribio) + channel + persona, para que S2 pueda enviarlo.
 */
import { expect, test } from "vitest";
import { GenerateDraftHandler } from "../../../src/cognition/application/generate-draft.handler.ts";
import type { AgentContextService } from "../../../src/cognition/application/agent-context.ts";
import type { AgentReasoner } from "../../../src/cognition/application/agent-reasoner.ts";
import type { PersistDraftHandler, PersistDraftCommand } from "../../../src/cognition/application/persist-draft.handler.ts";
import type { NormalizedMessage } from "../../../src/channels/domain/channel.adapter.ts";
import type { TenantId, ConversationId, ContactId } from "../../../src/shared/domain/ids.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const nm = { providerMessageId: "m1", from: "+1787", channel: "whatsapp", content: "cuanto cuesta?", attachments: [] } as unknown as NormalizedMessage;
const fakeCtx = { obtener: async () => ok({ knowledge: [], history: [], brandVoice: "VOZ", catalogContext: "CAT" }) } as unknown as AgentContextService;
const fakeReasoner = { razonar: async () => ok({ response: "Hola, el servicio es $525.", action: {}, model: "claude", costUsd: 0 }) } as unknown as AgentReasoner;

test("S3-01 contexto->reason->persist: draft con texto del reasoner + to/channel/persona", async () => {
  let captured: PersistDraftCommand | null = null;
  const fakePersist = { ejecutar: async (c: PersistDraftCommand) => { captured = c; return ok({ id: "d1", draftContent: c.draftContent } as never); } } as unknown as PersistDraftHandler;
  const h = new GenerateDraftHandler(fakeCtx, fakeReasoner, fakePersist);
  const r = await h.ejecutar({ tenantId: "t1" as unknown as TenantId, conversationId: "c1" as unknown as ConversationId, contactId: "ct1" as unknown as ContactId, channel: "whatsapp", personaSlug: "thao", normalizedMessage: nm });
  expect(r.ok).toBe(true);
  expect(captured!.draftContent).toBe("Hola, el servicio es $525.");
  expect(captured!.to).toBe("+1787");
  expect(captured!.channel).toBe("whatsapp");
  expect(captured!.personaSlug).toBe("thao");
});
