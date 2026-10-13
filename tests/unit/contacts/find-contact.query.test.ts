import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { FindContactHandler, FindContactQuery } from "../../../src/contacts/application/find-contact.query.ts";
import { ContactRepository, RepoError } from "../../../src/contacts/domain/contact.repository.ts";
import { ContactState } from "../../../src/contacts/domain/contact.entity.ts";
import { Email } from "../../../src/shared/domain/email.vo.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

const contactFixture: ContactState = Object.freeze({
  id: CID,
  tenantId: TID,
  displayName: "Ana Prueba",
  primaryEmail: Email.crear("ana@example.com").ok ? Email.crear("ana@example.com").value : null,
  primaryPhone: null,
  language: "es",
  segment: "new_lead",
  ltvUsd: 0,
  totalOrders: 0,
  preferredChannel: null,
  doNotContact: false,
  marketingOptIn: false,
  aiContextSummary: null,
  createdAt: new Date(),
});

const contactFuzzyExtra: ContactState = Object.freeze({
  ...contactFixture,
  id: crypto.randomUUID() as never,
  displayName: "Ana Secundaria",
  primaryEmail: Email.crear("ana2@example.com").ok ? Email.crear("ana2@example.com").value : null,
});

Deno.test("FindContactHandler — debe retornar contacto por email exacto", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(contactFixture),
    buscarFuzzy: async (_tid, _query) => ok([contactFixture, contactFuzzyExtra]),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "ana@example.com", limit: 10 };
  const result = await handler.ejecutar(query);

  assert(result.ok);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].id, CID);
});

Deno.test("FindContactHandler — debe hacer fuzzy si no encuentra email exacto", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(null),
    buscarFuzzy: async (_tid, _query) => ok([contactFixture, contactFuzzyExtra]),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "Ana", limit: 10 };
  const result = await handler.ejecutar(query);

  assert(result.ok);
  assertEquals(result.value.length, 2);
});

Deno.test("FindContactHandler — debe respetar el limit en busqueda fuzzy", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(null),
    buscarFuzzy: async (_tid, _query) => ok([contactFixture, contactFuzzyExtra]),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "Ana", limit: 1 };
  const result = await handler.ejecutar(query);

  assert(result.ok);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].id, CID);
});

Deno.test("FindContactHandler — debe fallar si buscarFuzzy falla con persistence_failure", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(null),
    buscarFuzzy: async (_tid, _query) => err({ kind: "persistence_failure", cause: "db_corrupt" }),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "Ana", limit: 10 };
  const result = await handler.ejecutar(query);

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
  assertEquals(result.error.cause, "db_corrupt");
});

Deno.test("FindContactHandler — debe envolver error sin cause como fallo_persistencia", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(null),
    buscarFuzzy: async (_tid, _query) => err({ kind: "not_found" }),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "Ana", limit: 10 };
  const result = await handler.ejecutar(query);

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
  assertEquals(result.error.cause, "fallo_persistencia");
});

Deno.test("FindContactHandler — debe retornar array vacio si fuzzy devuelve vacio", async () => {
  const mockRepo: ContactRepository = {
    buscarPorEmail: async (_tid, _email) => ok(null),
    buscarFuzzy: async (_tid, _query) => ok([]),
    guardar: async (_c) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorTenant: async (_tid) => ok([]),
  };

  const handler = new FindContactHandler(mockRepo);
  const query: FindContactQuery = { tenantId: TID, query: "xyz-no-existe", limit: 10 };
  const result = await handler.ejecutar(query);

  assert(result.ok);
  assertEquals(result.value.length, 0);
});