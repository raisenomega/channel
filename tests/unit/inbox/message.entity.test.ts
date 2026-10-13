import { assertEquals, assert } from "jsr:@std/assert";
import { crearMensaje } from "../../../src/inbox/domain/message.entity.ts";

const CID = crypto.randomUUID() as never;
const CNID = crypto.randomUUID() as never;
const TID = crypto.randomUUID() as never;

Deno.test("crearMensaje — debe crear mensaje de texto", () => {
  const result = crearMensaje(CID, CNID, TID, "inbound", "contact", "whatsapp", "zernio",
    { type: "text", body: "Hola, ¿cuánto cuesta?" });
  assert(result.ok);
  assertEquals(result.value.direction, "inbound");
  assertEquals(result.value.content.body, "Hola, ¿cuánto cuesta?");
  assertEquals(result.value.status, "sent");
  assertEquals(result.value.aiMeta.editedByHuman, false);
});

Deno.test("crearMensaje — debe fallar con contenido vacío", () => {
  const result = crearMensaje(CID, CNID, TID, "outbound", "human_agent", "email", "resend",
    { type: "text", body: "   " });
  assert(!result.ok);
  assertEquals(result.error.kind, "contenido_vacio");
});

Deno.test("crearMensaje — mensaje de IA debe incluir AiMeta", () => {
  const result = crearMensaje(CID, CNID, TID, "outbound", "ai_agent", "webchat", "hub",
    { type: "text", body: "Claro, con gusto." },
    { interactionId: "int-001", confidence: 0.94, mode: "autonomous", editedByHuman: false });
  assert(result.ok);
  assertEquals(result.value.senderType, "ai_agent");
  assertEquals(result.value.aiMeta.confidence, 0.94);
  assertEquals(result.value.aiMeta.mode, "autonomous");
});

Deno.test("crearMensaje — direction debe ser inbound/outbound/internal", () => {
  const r = crearMensaje(CID, CNID, TID, "internal", "system", "webchat", "hub",
    { type: "text", body: "Sistema: conversación creada" });
  assert(r.ok);
  assertEquals(r.value.direction, "internal");
});