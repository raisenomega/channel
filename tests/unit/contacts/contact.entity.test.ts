import { assertEquals, assert } from "jsr:@std/assert";
import { crearContacto } from "../../../src/contacts/domain/contact.entity.ts";

const TID = crypto.randomUUID() as never;

Deno.test("crearContacto — debe crear contacto valido", () => {
  const result = crearContacto(TID, "Test User", "anon@example.com", "+17875550100");
  assert(result.ok);
  assertEquals(result.value.displayName, "Test User");
  assertEquals(result.value.segment, "new_lead");
  assertEquals(result.value.language, "es");
  assertEquals(result.value.ltvUsd, 0);
  assertEquals(result.value.doNotContact, false);
});

Deno.test("crearContacto — debe fallar con nombre vacio", () => {
  const result = crearContacto(TID, "");
  assert(!result.ok);
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("crearContacto — debe fallar con email invalido", () => {
  const result = crearContacto(TID, "Test", "no-es-email");
  assert(!result.ok);
  assertEquals(result.error.kind, "email_invalido");
});

Deno.test("crearContacto — debe aceptar segmento vip", () => {
  const result = crearContacto(TID, "VIP Client", undefined, undefined, "vip");
  assert(result.ok);
  assertEquals(result.value.segment, "vip");
});

Deno.test("crearContacto — debe fallar con segmento invalido", () => {
  const result = crearContacto(TID, "Test", undefined, undefined, "fake_segment" as never);
  assert(!result.ok);
  assertEquals(result.error.kind, "segmento_invalido");
});
