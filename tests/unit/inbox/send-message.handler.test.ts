import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { SendMessageHandler, SendMessageCommand, OutboundDispatcher } from "../../../src/inbox/application/send-message.handler.ts";
import { ConversationRepository, MessageRepository } from "../../../src/inbox/domain/inbox.repository.ts";
import { ConversationState } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const COID = crypto.randomUUID() as never;

const convActiva: ConversationState = Object.freeze({
  id: COID,
  tenantId: TID,
  contactId: CID,
  participantExternalId: "1774346600215945",
  providerConversationId: "6a3dcaa29d9472faaeea9423",
  providerAccountId: "6ad59c380f7c39ef909f2f2b",
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

test("SendMessageHandler â€” debe enviar mensaje de human_agent exitosamente", async () => {
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
    content: { type: "text", body: "Hola, Â¿cÃ³mo estÃ¡s?" },
    senderType: "human_agent",
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
});

test("SendMessageHandler â€” debe enviar mensaje de ai_agent con metadatos", async () => {
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

  expect(result.ok).toBe(true);
});

test("SendMessageHandler â€” debe fallar si conversacion no existe (null)", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("conversacion_no_encontrada");
});

test("SendMessageHandler â€” debe fallar si conversacion esta resuelta", async () => {
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
    senderType: "ai_agent",
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("conversacion_resuelta");
});

test("SendMessageHandler â€” un envio HUMANO reabre la conversacion resuelta", async () => {
  let reabierto = false;
  const mockConvRepo: ConversationRepository = {
    buscar: async (_id) => ok(convResuelta),
    guardar: async (c) => { if (c.status === "open") reabierto = true; return ok(undefined); },
    buscarPorContacto: async (_tid, _cid) => ok([]),
    buscarActivos: async (_tid) => ok([]),
  };
  const mockMsgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorConversacion: async (_cid, _limit) => ok([]),
  };
  const handler = new SendMessageHandler(mockConvRepo, mockMsgRepo);
  const result = await handler.ejecutar({
    tenantId: TID, conversationId: COID, contactId: CID, channel: "whatsapp",
    provider: "zernio", content: { type: "text", body: "Hola" }, senderType: "human_agent",
  });
  expect(result.ok).toBe(true);
  expect(reabierto).toBe(true);
});

test("SendMessageHandler â€” debe fallar con contenido_vacio si body es vacio", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("contenido_vacio");
});

test("SendMessageHandler â€” debe fallar con persistence_failure si msgRepo.guardar falla", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("db_timeout");
});

test("3o-b: con dispatcher + participantExternalId -> despacha el saliente con el to correcto", async () => {
  const convRepo: ConversationRepository = {
    buscar: async (_id) => ok(convActiva), guardar: async (_c) => ok(undefined),
    buscarPorContacto: async (_t, _c) => ok([]), buscarActivos: async (_t) => ok([]),
  };
  const msgRepo: MessageRepository = {
    guardar: async (_m) => ok(undefined), buscar: async (_id) => ok(null), buscarPorConversacion: async (_c, _l) => ok([]),
  };
  const enviados: Array<{ to: string; content: string; conversationId?: string; accountId?: string }> = [];
  const dispatcher: OutboundDispatcher = { enviar: async (m) => { enviados.push({ to: m.to, content: m.content, conversationId: m.conversationId, accountId: m.accountId }); return ok(undefined); } };
  const handler = new SendMessageHandler(convRepo, msgRepo, dispatcher);
  const r = await handler.ejecutar({
    tenantId: TID, conversationId: COID, contactId: CID, channel: "whatsapp",
    provider: "zernio", content: { type: "text", body: "hola" }, senderType: "human_agent",
  });
  expect(r.ok).toBe(true);
  expect(enviados).toEqual([{ to: "1774346600215945", content: "hola", conversationId: "6a3dcaa29d9472faaeea9423", accountId: "6ad59c380f7c39ef909f2f2b" }]);
});
