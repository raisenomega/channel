import { assertEquals, assert } from "jsr:@std/assert";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import { TenantRepository } from "../../../src/identity/domain/identity.repository.ts";

Deno.test("CrearTenantHandler — debe crear tenant y retornar id", async () => {
  const mockRepo: TenantRepository = {
    guardar: async (_tenant) => ({ ok: true, value: undefined }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorSlug: async (_slug) => ({ ok: true, value: null }),
  };
  const handler = new CrearTenantHandler(mockRepo);
  const result = await handler.ejecutar({
    name: "Test", slug: "test", plan: "lite_starter", ownerEmail: "anon@example.com",
  });
  assert(result.ok, "debería crear tenant");
  assertEquals(typeof result.value, "string");
});

Deno.test("CrearTenantHandler — debe fallar si el repo falla", async () => {
  const mockRepo: TenantRepository = {
    guardar: async (_tenant) => ({ ok: false, error: { kind: "persistence_failure", cause: "DB down" } }),
    buscar: async (_id) => ({ ok: true, value: null }),
    buscarPorSlug: async (_slug) => ({ ok: true, value: null }),
  };
  const handler = new CrearTenantHandler(mockRepo);
  const result = await handler.ejecutar({
    name: "Test", slug: "test", plan: "lite_starter", ownerEmail: "anon@example.com",
  });
  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
});
