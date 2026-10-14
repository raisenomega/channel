import { expect, test } from "vitest";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import { TenantRepository } from "../../../src/identity/domain/identity.repository.ts";

test("CrearTenantHandler â€” debe crear tenant y retornar id", async () => {
  const mockRepo: TenantRepository = {
    guardar: async (_tenant) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorSlug: async (_slug) => ({ ok: true, value: null }),
  };
  const handler = new CrearTenantHandler(mockRepo);
  const result = await handler.ejecutar({
    name: "Test", slug: "test", plan: "lite_starter", ownerEmail: "anon@example.com",
  });
  expect(result.ok, "deberÃ­a crear tenant").toBe(true);
  expect(typeof result.value).toBe("string");
});

test("CrearTenantHandler â€” debe fallar si el repo falla", async () => {
  const mockRepo: TenantRepository = {
    guardar: async (_tenant) => ({ ok: false, error: { kind: "persistence_failure", cause: "DB down" } }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorSlug: async (_slug) => ({ ok: true, value: null }),
  };
  const handler = new CrearTenantHandler(mockRepo);
  const result = await handler.ejecutar({
    name: "Test", slug: "test", plan: "lite_starter", ownerEmail: "anon@example.com",
  });
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
