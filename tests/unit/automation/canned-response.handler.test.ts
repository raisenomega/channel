import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CannedResponseService, CannedError } from "../../../src/automation/application/canned-response.handler.ts";
import { CannedResponseRepository, RepoError } from "../../../src/automation/domain/automation.repository.ts";
import { CannedResponseState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const TID = crypto.randomUUID() as never;

const cannedFixture: CannedResponseState = Object.freeze({
  id: crypto.randomUUID(),
  tenantId: TID,
  shortcode: "saludo",
  content: "¡Hola! Bienvenido a Raisen. ¿Cómo podemos ayudarte?",
  category: "greeting",
});

Deno.test("CannedResponseService — debe retornar contenido cuando shortcode existe", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => ok(cannedFixture),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  assert(result.ok);
  assertEquals(result.value, cannedFixture.content);
});

Deno.test("CannedResponseService — debe fallar con no_encontrado cuando shortcode no existe (null)", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => ok(null),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "inexistente");

  assert(!result.ok);
  assertEquals(result.error.kind, "no_encontrado");
  assertEquals(result.error.shortcode, "inexistente");
});

Deno.test("CannedResponseService — debe fallar con persistence_failure cuando repo falla", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => err({ kind: "persistence_failure", cause: "db_timeout" }),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
  assertEquals(result.error.cause, "db_timeout");
});

Deno.test("CannedResponseService — debe usar fallo_persistencia como cause por defecto", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => err({ kind: "not_found" }),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
  assertEquals(result.error.cause, "fallo_persistencia");
});