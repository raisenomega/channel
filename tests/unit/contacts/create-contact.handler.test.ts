import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CreateContactHandler, CreateContactCommand } from "../../../src/contacts/application/create-contact.handler.ts";
import { ContactRepository, RepoError } from "../../../src/contacts/domain/contact.repository.ts";

const TID = crypto.randomUUID() as never;

test("CreateContactHandler â€” debe crear contacto exitosamente con solo nombre", async () => {
  const mockRepo: ContactRepository = {
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_tid, _e) => ok(null),
    buscarFuzzy: async (_tid, _q) => ok([]),
  };

  const handler = new CreateContactHandler(mockRepo);
  const cmd: CreateContactCommand = {
    tenantId: TID,
    displayName: "Juan Perez",
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
});

test("CreateContactHandler â€” debe crear contacto con email y segmento", async () => {
  const mockRepo: ContactRepository = {
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_tid, _e) => ok(null),
    buscarFuzzy: async (_tid, _q) => ok([]),
  };

  const handler = new CreateContactHandler(mockRepo);
  const cmd: CreateContactCommand = {
    tenantId: TID,
    displayName: "Maria Lopez",
    email: "anon@example.com",
    segment: "qualified_lead",
    language: "es",
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
});

test("CreateContactHandler â€” debe fallar con nombre_vacio si displayName vacio", async () => {
  const mockRepo: ContactRepository = {
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_tid, _e) => ok(null),
    buscarFuzzy: async (_tid, _q) => ok([]),
  };

  const handler = new CreateContactHandler(mockRepo);
  const cmd: CreateContactCommand = {
    tenantId: TID,
    displayName: "",
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("nombre_vacio");
});

test("CreateContactHandler â€” debe fallar con email_invalido si email mal formado", async () => {
  const mockRepo: ContactRepository = {
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_tid, _e) => ok(null),
    buscarFuzzy: async (_tid, _q) => ok([]),
  };

  const handler = new CreateContactHandler(mockRepo);
  const cmd: CreateContactCommand = {
    tenantId: TID,
    displayName: "Test",
    email: "invalid-email",
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("email_invalido");
});

test("CreateContactHandler â€” debe fallar si repo.guardar falla", async () => {
  const mockRepo: ContactRepository = {
    guardar: async (_c) => err({ kind: "persistence_failure", cause: "db_down" }),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
    buscarPorEmail: async (_tid, _e) => ok(null),
    buscarFuzzy: async (_tid, _q) => ok([]),
  };

  const handler = new CreateContactHandler(mockRepo);
  const cmd: CreateContactCommand = {
    tenantId: TID,
    displayName: "Juan Perez",
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
