/**
 * HUB by Raisen â€” Integration tests for Inbox context.
 * Flujo critico: crear conversacion -> enviar mensaje -> listar inbox.
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar Memory*Store por *RepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { expect, test } from "vitest";
import {
  MemoryConversationStore,
  MemoryMessageStore,
} from "../fixtures/memory-store.infrastructure.ts";
import { crearConversacion } from "../../../src/inbox/domain/conversation.entity.ts";
import { SendMessageHandler } from "../../../src/inbox/application/send-message.handler.ts";
import { ListInboxHandler } from "../../../src/inbox/application/list-inbox.query.ts";
import type { TenantId, ContactId, ConversationId } from "../../../src/shared/domain/ids.ts";

test("Inbox: crear conversacion -> enviar mensaje -> listar inbox", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);
  const listInbox = new ListInboxHandler(convs);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // 1) Crear conversacion en memoria y guardarla
  const conv = crearConversacion(tenantId, contactId, "whatsapp");
  expect(conv.ok, "la conversacion se debe crear").toBe(true);
  const convState = conv.value;

  const guardado = await convs.guardar(convState);
  expect(guardado.ok).toBe(true);

  const convId = convState.id;

  // 2) Enviar mensaje outbound
  const sendRes = await sendMsg.ejecutar({
    tenantId, conversationId: convId,
    contactId,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Hola, gracias por contactarnos. ?Como podemos ayudarte?" },
    senderType: "human_agent",
  });
  expect(sendRes.ok, "el mensaje se debe enviar").toBe(true);

  // 3) Verificar que el mensaje persiste en el store
  const mensajesEnConv = await msgs.buscarPorConversacion(convId);
  expect(mensajesEnConv.ok).toBe(true);
  expect(mensajesEnConv.value.length).toBe(1);
  expect(mensajesEnConv.value[0]?.content.body).toBe("Hola, gracias por contactarnos. ?Como podemos ayudarte?");

  // 4) Listar inbox activo
  const inbox = await listInbox.ejecutar({
    tenantId, status: "all",
    assignedAgentId: null,
    limit: 20,
  });
  expect(inbox.ok).toBe(true);
  expect(inbox.value.length).toBe(1);
  expect(inbox.value[0]?.id).toBe(convId);
  expect(inbox.value[0]?.status).toBe("open");
});

test("Inbox: mensaje a conversacion inexistente falla", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const handler = new SendMessageHandler(convs, msgs);

  const res = await handler.ejecutar({
    tenantId: crypto.randomUUID() as TenantId,
    conversationId: crypto.randomUUID() as ConversationId,
    contactId: crypto.randomUUID() as ContactId,
    channel: "email",
    provider: "resend",
    content: { type: "text", body: "Hola" },
    senderType: "system",
  });
  expect(!res.ok, "conversacion inexistente debe fallar").toBe(true);
  expect(res.error.kind).toBe("conversacion_no_encontrada");
});

test("Inbox: multiples conversaciones listadas correctamente", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);
  const listInbox = new ListInboxHandler(convs);

  const tenantId = crypto.randomUUID() as TenantId;

  // Crear 2 conversaciones con contactos distintos
  const c1 = crearConversacion(tenantId, crypto.randomUUID() as ContactId, "webchat");
  const c2 = crearConversacion(tenantId, crypto.randomUUID() as ContactId, "email");
  expect(c1.ok && c2.ok).toBe(true);

  await convs.guardar(c1.value);
  await convs.guardar(c2.value);

  // Enviar mensaje a la primera
  const r1 = await sendMsg.ejecutar({
    tenantId, conversationId: c1.value.id,
    contactId: c1.value.contactId, channel: "webchat",
    provider: "native-webchat",
    content: { type: "text", body: "Mensaje en webchat" },
    senderType: "human_agent",
  });
  expect(r1.ok).toBe(true);

  const inbox = await listInbox.ejecutar({ tenantId, status: "all", assignedAgentId: null, limit: 20 });
  expect(inbox.ok).toBe(true);
  expect(inbox.value.length).toBe(2);
});

test("Inbox: envio de mensaje AI con metadatos", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;
  const conv = crearConversacion(tenantId, contactId, "whatsapp");
  expect(conv.ok).toBe(true);
  await convs.guardar(conv.value);

  const res = await sendMsg.ejecutar({
    tenantId, conversationId: conv.value.id,
    contactId,
    channel: "whatsapp",
    provider: "omega",
    content: { type: "text", body: "Respuesta automatica generada por AI" },
    senderType: "ai_agent",
    aiMode: "autonomous",
    aiConfidence: 0.92,
    aiInteractionId: "interaction-001",
  });
  expect(res.ok).toBe(true);

  const msgsList = await msgs.buscarPorConversacion(conv.value.id);
  expect(msgsList.ok).toBe(true);
  const msg = msgsList.value[0]!;
  expect(msg.aiMeta.mode).toBe("autonomous");
  expect(msg.aiMeta.confidence).toBe(0.92);
  expect(msg.aiMeta.interactionId).toBe("interaction-001");
});
