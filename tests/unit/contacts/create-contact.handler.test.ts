import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CreateContactHandler, CreateContactCommand } from "../../../src/contacts/application/create-contact.handler.ts";
import { ContactRepository, RepoError } from "../../../src/contacts/domain/contact.repository.ts";

const TID = crypto.randomUUID() as never;

Deno.test("CreateContactHandler — debe crear contacto exitosamente con solo nombre", async () => {
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

  assert(result.ok);
  assertEquals(typeof result.value, "string");
});

Deno.test("CreateContactHandler — debe crear contacto con email y segmento", async () => {
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

  assert(result.ok);
  assertEquals(typeof result.value, "string");
});

Deno.test("CreateContactHandler — debe fallar con nombre_vacio si displayName vacio", async () => {
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

  assert(!result.ok);
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("CreateContactHandler — debe fallar con email_invalido si email mal formado", async () => {
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

  assert(!result.ok);
  assertEquals(result.error.kind, "email_invalido");
});

Deno.test("CreateContactHandler — debe fallar si repo.guardar falla", async () => {
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

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
});