import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CrearUserHandler, CrearUserCommand } from "../../../src/identity/application/create-user.handler.ts";
import { UserRepository, RepoError } from "../../../src/identity/domain/identity.repository.ts";

const TID = crypto.randomUUID() as never;

Deno.test("CrearUserHandler — debe crear usuario exitosamente", async () => {
  const mockRepo: UserRepository = {
    guardar: async (_u) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_e) => ok(null),
  };

  const handler = new CrearUserHandler(mockRepo);
  const cmd: CrearUserCommand = {
    email: "anon@example.com",
    fullName: "Juan Perez",
    role: "agent",
    tenantId: TID,
    language: "es",
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(typeof result.value, "string");
});

Deno.test("CrearUserHandler — debe usar idioma por defecto si no se provee", async () => {
  const mockRepo: UserRepository = {
    guardar: async (_u) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_e) => ok(null),
  };

  const handler = new CrearUserHandler(mockRepo);
  const cmd: CrearUserCommand = {
    email: "anon@example.com",
    fullName: "Maria Lopez",
    role: "supervisor",
    tenantId: TID,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
});

Deno.test("CrearUserHandler — debe fallar con email_invalido si email mal formado", async () => {
  const mockRepo: UserRepository = {
    guardar: async (_u) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_e) => ok(null),
  };

  const handler = new CrearUserHandler(mockRepo);
  const cmd: CrearUserCommand = {
    email: "not-an-email",
    fullName: "Test User",
    role: "agent",
    tenantId: TID,
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "email_invalido");
});

Deno.test("CrearUserHandler — debe fallar con rol_invalido si role no es valido", async () => {
  const mockRepo: UserRepository = {
    guardar: async (_u) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_e) => ok(null),
  };

  const handler = new CrearUserHandler(mockRepo);
  const cmd: CrearUserCommand = {
    email: "anon@example.com",
    fullName: "Test User",
    role: "ceo" as never,
    tenantId: TID,
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "rol_invalido");
});

Deno.test("CrearUserHandler — debe fallar si repo.guardar falla", async () => {
  const mockRepo: UserRepository = {
    guardar: async (_u) => err({ kind: "persistence_failure", cause: "disk_full" }),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_e) => ok(null),
  };

  const handler = new CrearUserHandler(mockRepo);
  const cmd: CrearUserCommand = {
    email: "anon@example.com",
    fullName: "Juan Perez",
    role: "agent",
    tenantId: TID,
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
});