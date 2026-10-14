import { expect, test } from "vitest";
import { crearUser } from "../../../src/identity/domain/user.entity.ts";
import { Email } from "../../../src/shared/domain/email.vo.ts";

const TEST_TENANT = crypto.randomUUID() as never;

test("crearUser â€” debe crear usuario en espaÃ±ol por defecto", () => {
  const emailResult = Email.crear("anon@example.com");
  expect(emailResult.ok).toBe(true);
  const result = crearUser(emailResult.value, "Juan PÃ©rez", "agent", TEST_TENANT);
  expect(result.ok).toBe(true);
  expect(result.value.language).toBe("es");
});

test("crearUser â€” debe aceptar idioma explÃ­cito", () => {
  const emailResult = Email.crear("user@example.com");
  expect(emailResult.ok).toBe(true);
  const result = crearUser(emailResult.value, "John", "agent", TEST_TENANT, "en");
  expect(result.ok).toBe(true);
  expect(result.value.language).toBe("en");
});

test("crearUser â€” debe fallar con idioma invÃ¡lido", () => {
  const emailResult = Email.crear("anon@example.com");
  expect(emailResult.ok).toBe(true);
  const result = crearUser(emailResult.value, "Test", "agent", TEST_TENANT, "fr" as never);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("idioma_invalido");
});

test("crearUser â€” debe fallar con rol invÃ¡lido", () => {
  const emailResult = Email.crear("anon@example.com");
  expect(emailResult.ok).toBe(true);
  const result = crearUser(emailResult.value, "Test", "ceo" as never, TEST_TENANT);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("rol_invalido");
});

test("crearUser â€” debe aceptar role owner", () => {
  const emailResult = Email.crear("owner@example.com");
  expect(emailResult.ok).toBe(true);
  const result = crearUser(emailResult.value, "DueÃ±o", "owner", TEST_TENANT);
  expect(result.ok).toBe(true);
  expect(result.value.role).toBe("owner");
});
