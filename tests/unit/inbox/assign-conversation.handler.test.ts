import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { AssignConversationHandler, AssignConversationCommand } from "../../../src/inbox/application/assign-conversation.handler.ts";
import { ConversationRepository, RepoError } from "../../../src/inbox/domain/inbox.repository.ts";
import { ConversationState } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const AID = crypto.randomUUID() as never;

const convActiva: ConversationState = Object.freeze({
  id: CID,
  tenantId: TID,
  contactId: crypto.randomUUID() as never,
  primaryChannel: "whatsapp",
  primaryInboxId: null,
  status: "open",
  operationMode: "human",
  assignedAgentId: null,
  subject: null,
  priority: "medium",
  isStarred: false,
  totalMessages: 0,
  aiMessages: 0,
  humanMessages: 0,
  contactAskedIfBot: false,
  contactAskedForHuman: false,
  avgIndistinguishabilityScore: null,
  createdAt: new Date(),
});

const convResuelta: ConversationState = Object.freeze({ ...convActiva, status: "resolved" as const });

test("AssignConversationHandler â€” debe asignar conversacion activa exitosamente", async () => {
  const mockRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const handler = new AssignConversationHandler(mockRepo);
  const cmd: AssignConversationCommand = { conversationId: CID, agentId: AID };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
});

test("AssignConversationHandler â€” debe fallar si conversacion no se encuentra (error repo)", async () => {
  const mockRepo: ConversationRepository = {
    buscar: async (_id) => err({ kind: "not_found" }),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const handler = new AssignConversationHandler(mockRepo);
  const cmd: AssignConversationCommand = { conversationId: CID, agentId: AID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("conversacion_no_encontrada");
});

test("AssignConversationHandler â€” debe fallar si conversacion no existe (null)", async () => {
  const mockRepo: ConversationRepository = {
    buscar: async (_id) => ok(null),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const handler = new AssignConversationHandler(mockRepo);
  const cmd: AssignConversationCommand = { conversationId: CID, agentId: AID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("conversacion_no_encontrada");
});

test("AssignConversationHandler â€” debe fallar si conversacion ya esta resuelta", async () => {
  const mockRepo: ConversationRepository = {
    buscar: async (_id) => ok(convResuelta),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const handler = new AssignConversationHandler(mockRepo);
  const cmd: AssignConversationCommand = { conversationId: CID, agentId: AID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("conversacion_resuelta");
});
