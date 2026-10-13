/**
 * HUB by Raisen — Integration tests for Inbox context.
 * Flujo critico: crear conversacion -> enviar mensaje -> listar inbox.
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar Memory*Store por *RepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { assertEquals, assert } from "jsr:@std/assert";
import {
  MemoryConversationStore,
  MemoryMessageStore,
} from "../fixtures/memory-store.infrastructure.ts";
import { crearConversacion } from "../../../src/inbox/domain/conversation.entity.ts";
import { SendMessageHandler } from "../../../src/inbox/application/send-message.handler.ts";
import { ListInboxHandler } from "../../../src/inbox/application/list-inbox.query.ts";
import type { TenantId, ContactId, ConversationId } from "../../../src/shared/domain/ids.ts";

Deno.test("Inbox: crear conversacion -> enviar mensaje -> listar inbox", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);
  const listInbox = new ListInboxHandler(convs);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // 1) Crear conversacion en memoria y guardarla
  const conv = crearConversacion(tenantId, contactId, "whatsapp");
  assert(conv.ok, "la conversacion se debe crear");
  const convState = conv.value;

  const guardado = await convs.guardar(convState);
  assert(guardado.ok);

  const convId = convState.id;

  // 2) Enviar mensaje outbound
  const sendRes = await sendMsg.ejecutar({
    tenantId,
    conversationId: convId,
    contactId,
    channel: "whatsapp",
    provider: "zernio",
    content: { type: "text", body: "Hola, gracias por contactarnos. ?Como podemos ayudarte?" },
    senderType: "human_agent",
  });
  assert(sendRes.ok, "el mensaje se debe enviar");

  // 3) Verificar que el mensaje persiste en el store
  const mensajesEnConv = await msgs.buscarPorConversacion(convId);
  assert(mensajesEnConv.ok);
  assertEquals(mensajesEnConv.value.length, 1);
  assertEquals(mensajesEnConv.value[0]?.content.body, "Hola, gracias por contactarnos. ?Como podemos ayudarte?");

  // 4) Listar inbox activo
  const inbox = await listInbox.ejecutar({
    tenantId,
    status: "all",
    assignedAgentId: null,
    limit: 20,
  });
  assert(inbox.ok);
  assertEquals(inbox.value.length, 1);
  assertEquals(inbox.value[0]?.id, convId);
  assertEquals(inbox.value[0]?.status, "open");
});

Deno.test("Inbox: mensaje a conversacion inexistente falla", async () => {
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
  assert(!res.ok, "conversacion inexistente debe fallar");
  assertEquals(res.error.kind, "conversacion_no_encontrada");
});

Deno.test("Inbox: multiples conversaciones listadas correctamente", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);
  const listInbox = new ListInboxHandler(convs);

  const tenantId = crypto.randomUUID() as TenantId;

  // Crear 2 conversaciones con contactos distintos
  const c1 = crearConversacion(tenantId, crypto.randomUUID() as ContactId, "webchat");
  const c2 = crearConversacion(tenantId, crypto.randomUUID() as ContactId, "email");
  assert(c1.ok && c2.ok);

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
  assert(r1.ok);

  const inbox = await listInbox.ejecutar({ tenantId, status: "all", assignedAgentId: null, limit: 20 });
  assert(inbox.ok);
  assertEquals(inbox.value.length, 2); // ambas activas
});

Deno.test("Inbox: envio de mensaje AI con metadatos", async () => {
  const convs = new MemoryConversationStore();
  const msgs = new MemoryMessageStore();
  const sendMsg = new SendMessageHandler(convs, msgs);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;
  const conv = crearConversacion(tenantId, contactId, "whatsapp");
  assert(conv.ok);
  await convs.guardar(conv.value);

  const res = await sendMsg.ejecutar({
    tenantId,
    conversationId: conv.value.id,
    contactId,
    channel: "whatsapp",
    provider: "omega",
    content: { type: "text", body: "Respuesta automatica generada por AI" },
    senderType: "ai_agent",
    aiMode: "autonomous",
    aiConfidence: 0.92,
    aiInteractionId: "interaction-001",
  });
  assert(res.ok);

  const msgsList = await msgs.buscarPorConversacion(conv.value.id);
  assert(msgsList.ok);
  const msg = msgsList.value[0]!;
  assertEquals(msg.aiMeta.mode, "autonomous");
  assertEquals(msg.aiMeta.confidence, 0.92);
  assertEquals(msg.aiMeta.interactionId, "interaction-001");
});