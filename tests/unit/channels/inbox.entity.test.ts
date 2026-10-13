import { assertEquals, assert } from "jsr:@std/assert";
import { crearInbox, activarInbox, desactivarInbox } from "../../../src/channels/domain/inbox.entity.ts";

const TEST_TENANT = crypto.randomUUID() as never;

Deno.test("crearInbox — debe crear inbox válido", () => {
  const result = crearInbox("WhatsApp Principal", "whatsapp", "zernio", TEST_TENANT);
  assert(result.ok);
  assertEquals(result.value.name, "WhatsApp Principal");
  assertEquals(result.value.channelType, "whatsapp");
  assertEquals(result.value.provider, "zernio");
  assertEquals(result.value.isActive, false);
  assertEquals(result.value.syncStatus, "pending");
});

Deno.test("crearInbox — debe fallar con nombre vacío", () => {
  const result = crearInbox("", "email", "resend", TEST_TENANT);
  assert(!result.ok);
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("crearInbox — debe fallar con provider inválido", () => {
  const result = crearInbox("Test", "webchat", "fake_provider" as never, TEST_TENANT);
  assert(!result.ok);
  assertEquals(result.error.kind, "provider_no_soportado");
});

Deno.test("activarInbox — debe activar y cambiar syncStatus", () => {
  const r = crearInbox("Test", "email", "resend", TEST_TENANT);
  assert(r.ok);
  const activo = activarInbox(r.value);
  assertEquals(activo.isActive, true);
  assertEquals(activo.syncStatus, "connected");
});

Deno.test("desactivarInbox — debe desactivar y cambiar syncStatus", () => {
  const r = crearInbox("Test", "telegram", "zernio", TEST_TENANT);
  assert(r.ok);
  const inactivo = desactivarInbox(r.value);
  assertEquals(inactivo.isActive, false);
  assertEquals(inactivo.syncStatus, "disconnected");
});