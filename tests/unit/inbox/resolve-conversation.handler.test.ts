import { expect, test } from "vitest";
import { ResolveConversationHandler } from "../../../src/inbox/application/resolve-conversation.handler.ts";
import { ConversationRepository } from "../../../src/inbox/domain/inbox.repository.ts";
import { ConversationState } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

const convActiva: ConversationState = Object.freeze({
  id: CID, tenantId: TID, contactId: crypto.randomUUID() as never,
  primaryChannel: "whatsapp", primaryInboxId: null,
  status: "open", operationMode: "human",
  assignedAgentId: null, subject: null, priority: "medium",
  isStarred: false, totalMessages: 0, aiMessages: 0, humanMessages: 0,
  contactAskedIfBot: false, contactAskedForHuman: false,
  avgIndistinguishabilityScore: null, createdAt: new Date(),
});

const convResuelta: ConversationState = Object.freeze({ ...convActiva, status: "resolved" as const });

test("ResolveConversationHandler â€” debe resolver conversaciÃ³n activa", async () => {
  const mockRepo: ConversationRepository = {
    guardar: async (_c) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: convActiva }),
    buscarPorContacto: async (_tid, _cid) => ({ ok: true, value: [] }),
    buscarActivos: async (_tid) => ({ ok: true, value: [convActiva] }),
  };
  const handler = new ResolveConversationHandler(mockRepo);
  const result = await handler.ejecutar({ conversationId: CID });
  expect(result.ok).toBe(true);
});

test("ResolveConversationHandler â€” debe fallar si ya estÃ¡ resuelta", async () => {
  const mockRepo: ConversationRepository = {
    guardar: async (_c) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: convResuelta }),
    buscarPorContacto: async (_tid, _cid) => ({ ok: true, value: [] }),
    buscarActivos: async (_tid) => ({ ok: true, value: [] }),
  };
  const handler = new ResolveConversationHandler(mockRepo);
  const result = await handler.ejecutar({ conversationId: CID });
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("ya_resuelta");
});
