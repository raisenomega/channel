import { assertEquals, assert } from "jsr:@std/assert";
import { crearUser } from "../../../src/identity/domain/user.entity.ts";
import { Email } from "../../../src/shared/domain/email.vo.ts";

const TEST_TENANT_ID = crypto.randomUUID() as never;

Deno.test("crearUser — debe crear un usuario válido", () => {
  const emailResult = Email.crear("juan@example.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Juan Pérez", "agent", TEST_TENANT_ID);
  assert(result.ok);
  assertEquals(result.value.fullName, "Juan Pérez");
  assertEquals(result.value.role, "agent");
  assertEquals(result.value.isActive, true);
});

Deno.test("crearUser — debe fallar con rol inválido", () => {
  const emailResult = Email.crear("test@test.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Test", "ceo" as never, TEST_TENANT_ID);
  assert(!result.ok);
  assertEquals(result.error.kind, "rol_invalido");
});

Deno.test("crearUser — debe aceptar role owner", () => {
  const emailResult = Email.crear("owner@negocio.com");
  assert(emailResult.ok);
  const result = crearUser(emailResult.value, "Dueño", "owner", TEST_TENANT_ID);
  assert(result.ok);
  assertEquals(result.value.role, "owner");
});