import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { SendMessageHandler, SendMessageCommand } from "../../../src/inbox/application/send-message.handler.ts";
import { ConversationRepository, MessageRepository } from "../../../src/inbox/domain/inbox.repository.ts";
import { ConversationState } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const COID = crypto.randomUUID() as never;

const convActiva: ConversationState = Object.freeze({
  id: COID,
  tenantId: TID,
  contactId: CID,
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

Deno.test("SendMessageHandler — debe enviar mensaje de human_agent exitosamente", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Hola, ¿cómo estás?" },
    senderType: "human_agent",
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
});

Deno.test("SendMessageHandler — debe enviar mensaje de ai_agent con metadatos", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Respuesta automatica" },
    senderType: "ai_agent",
    aiMode: "assistant",
    aiConfidence: 0.95,
    aiInteractionId: "inter-001",
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
});

Deno.test("SendMessageHandler — debe fallar si conversacion no existe (null)", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(null),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "email",
    provider: "resend",
    content: { type: "text", body: "Test message" },
    senderType: "system",
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "conversacion_no_encontrada");
});

Deno.test("SendMessageHandler — debe fallar si conversacion esta resuelta", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convResuelta),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Hola" },
    senderType: "human_agent",
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "conversacion_resuelta");
});

Deno.test("SendMessageHandler — debe fallar con contenido_vacio si body es vacio", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "" },
    senderType: "system",
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "contenido_vacio");
});

Deno.test("SendMessageHandler — debe fallar con persistence_failure si msgRepo.guardar falla", async () => {
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva),
    guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };

  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => err({ kind: "persistence_failure", cause: "db_timeout" }),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };

  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const cmd: SendMessageCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Hola" },
    senderType: "human_agent",
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
  assertEquals(result.error.cause, "db_timeout");
});