import { assertEquals, assert } from "jsr:@std/assert";
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

Deno.test("ResolveConversationHandler — debe resolver conversación activa", async () => {
  const mockRepo: ConversationRepository = {
    guardar: async (_c) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: convActiva }),
    buscarPorContacto: async (_tid, _cid) => ({ ok: true, value: [] }),
    buscarActivos: async (_tid) => ({ ok: true, value: [convActiva] }),
  };
  const handler = new ResolveConversationHandler(mockRepo);
  const result = await handler.ejecutar({ conversationId: CID });
  assert(result.ok);
});

Deno.test("ResolveConversationHandler — debe fallar si ya está resuelta", async () => {
  const mockRepo: ConversationRepository = {
    guardar: async (_c) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: convResuelta }),
    buscarPorContacto: async (_tid, _cid) => ({ ok: true, value: [] }),
    buscarActivos: async (_tid) => ({ ok: true, value: [] }),
  };
  const handler = new ResolveConversationHandler(mockRepo);
  const result = await handler.ejecutar({ conversationId: CID });
  assert(!result.ok);
  assertEquals(result.error.kind, "ya_resuelta");
});