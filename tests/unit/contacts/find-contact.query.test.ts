import { expect, test } from "vitest";
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

test("FindContactHandler â€” debe retornar contacto por email exacto", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.length).toBe(1);
  expect(result.value[0].id).toBe(CID);
});

test("FindContactHandler â€” debe hacer fuzzy si no encuentra email exacto", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.length).toBe(2);
});

test("FindContactHandler â€” debe respetar el limit en busqueda fuzzy", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.length).toBe(1);
  expect(result.value[0].id).toBe(CID);
});

test("FindContactHandler â€” debe fallar si buscarFuzzy falla con persistence_failure", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("db_corrupt");
});

test("FindContactHandler â€” debe envolver error sin cause como fallo_persistencia", async () => {
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

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("fallo_persistencia");
});

test("FindContactHandler â€” debe retornar array vacio si fuzzy devuelve vacio", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.length).toBe(0);
});
