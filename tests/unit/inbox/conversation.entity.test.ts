import { assertEquals, assert } from "jsr:@std/assert";
import { crearConversacion, transicionarStatus } from "../../../src/inbox/domain/conversation.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

Deno.test("crearConversacion — debe crear conversación open", () => {
  const result = crearConversacion(TID, CID, "whatsapp");
  assert(result.ok);
  assertEquals(result.value.status, "open");
  assertEquals(result.value.primaryChannel, "whatsapp");
  assertEquals(result.value.operationMode, "human");
  assertEquals(result.value.totalMessages, 0);
});

Deno.test("crearConversacion — debe fallar sin contacto", () => {
  const result = crearConversacion(TID, "" as never, "email");
  assert(!result.ok);
  assertEquals(result.error.kind, "contacto_requerido");
});

Deno.test("transicionarStatus — open → resolved permitido", () => {
  const result = transicionarStatus("open", "resolved");
  assert(result.ok);
});

Deno.test("transicionarStatus — resolved → snoozed prohibido", () => {
  const result = transicionarStatus("resolved", "snoozed");
  assert(!result.ok);
  assertEquals(result.error.kind, "transicion_invalida");
});

Deno.test("transicionarStatus — archived no puede ir a ningún lado", () => {
  assert(!transicionarStatus("archived", "open").ok);
  assert(!transicionarStatus("archived", "resolved").ok);
  assert(!transicionarStatus("archived", "snoozed").ok);
});