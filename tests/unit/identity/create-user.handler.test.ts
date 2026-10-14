import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CrearUserHandler, CrearUserCommand } from "../../../src/identity/application/create-user.handler.ts";
import { UserRepository, RepoError } from "../../../src/identity/domain/identity.repository.ts";

const TID = crypto.randomUUID() as never;

test("CrearUserHandler â€” debe crear usuario exitosamente", async () => {
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

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
});

test("CrearUserHandler â€” debe usar idioma por defecto si no se provee", async () => {
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

  expect(result.ok).toBe(true);
});

test("CrearUserHandler â€” debe fallar con email_invalido si email mal formado", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("email_invalido");
});

test("CrearUserHandler â€” debe fallar con rol_invalido si role no es valido", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("rol_invalido");
});

test("CrearUserHandler â€” debe fallar si repo.guardar falla", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
