import { expect, test } from "vitest";
import { crearContacto } from "../../../src/contacts/domain/contact.entity.ts";

const TID = crypto.randomUUID() as never;

test("crearContacto â€” debe crear contacto valido", () => {
  const result = crearContacto(TID, "Test User", "anon@example.com", "+17875550100");
  expect(result.ok).toBe(true);
  expect(result.value.displayName).toBe("Test User");
  expect(result.value.segment).toBe("new_lead");
  expect(result.value.language).toBe("es");
  expect(result.value.ltvUsd).toBe(0);
  expect(result.value.doNotContact).toBe(false);
});

test("crearContacto â€” debe fallar con nombre vacio", () => {
  const result = crearContacto(TID, "");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("nombre_vacio");
});

test("crearContacto â€” debe fallar con email invalido", () => {
  const result = crearContacto(TID, "Test", "no-es-email");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("email_invalido");
});

test("crearContacto â€” debe aceptar segmento vip", () => {
  const result = crearContacto(TID, "VIP Client", undefined, undefined, "vip");
  expect(result.ok).toBe(true);
  expect(result.value.segment).toBe("vip");
});

test("crearContacto â€” debe fallar con segmento invalido", () => {
  const result = crearContacto(TID, "Test", undefined, undefined, "fake_segment" as never);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("segmento_invalido");
});
