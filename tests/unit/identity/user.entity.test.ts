import { assertEquals, assert } from "jsr:@std/assert";
import { crearUser } from "../../../src/identity/domain/user.entity.ts";
import { Email } from "../../../src/shared/domain/email.vo.ts";

const TEST_TENANT = crypto.randomUUID() as never;

Deno.test("crearUser — debe crear usuario en español por defecto", () => {
  const emailResult = Email.crear("juan@example.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Juan Pérez", "agent", TEST_TENANT);
  assert(result.ok);
  assertEquals(result.value.language, "es");
});

Deno.test("crearUser — debe aceptar idioma explícito", () => {
  const emailResult = Email.crear("john@example.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "John", "agent", TEST_TENANT, "en");
  assert(result.ok);
  assertEquals(result.value.language, "en");
});

Deno.test("crearUser — debe fallar con idioma inválido", () => {
  const emailResult = Email.crear("test@test.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Test", "agent", TEST_TENANT, "fr" as never);
  assert(!result.ok);
  assertEquals(result.error.kind, "idioma_invalido");
});

Deno.test("crearUser — debe fallar con rol inválido", () => {
  const emailResult = Email.crear("test@test.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Test", "ceo" as never, TEST_TENANT);
  assert(!result.ok);
  assertEquals(result.error.kind, "rol_invalido");
});

Deno.test("crearUser — debe aceptar role owner", () => {
  const emailResult = Email.crear("owner@negocio.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Dueño", "owner", TEST_TENANT);
  assert(result.ok);
  assertEquals(result.value.role, "owner");
});