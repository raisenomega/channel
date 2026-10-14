import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CannedResponseService, CannedError } from "../../../src/automation/application/canned-response.handler.ts";
import { CannedResponseRepository, RepoError } from "../../../src/automation/domain/automation.repository.ts";
import { CannedResponseState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const TID = crypto.randomUUID() as never;

const cannedFixture: CannedResponseState = Object.freeze({
  id: crypto.randomUUID(),
  tenantId: TID,
  shortcode: "saludo",
  content: "Â¡Hola! Bienvenido a Raisen. Â¿CÃ³mo podemos ayudarte?",
  category: "greeting",
});

test("CannedResponseService â€” debe retornar contenido cuando shortcode existe", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => ok(cannedFixture),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  expect(result.ok).toBe(true);
  expect(result.value).toBe(cannedFixture.content);
});

test("CannedResponseService â€” debe fallar con no_encontrado cuando shortcode no existe (null)", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => ok(null),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "inexistente");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("no_encontrado");
  expect(result.error.shortcode).toBe("inexistente");
});

test("CannedResponseService â€” debe fallar con persistence_failure cuando repo falla", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => err({ kind: "persistence_failure", cause: "db_timeout" }),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("db_timeout");
});

test("CannedResponseService â€” debe usar fallo_persistencia como cause por defecto", async () => {
  const mockRepo: CannedResponseRepository = {
    buscarPorShortcode: async (_tid, _sc) => err({ kind: "not_found" }),
    buscar: async (_tid) => ok([]),
    guardar: async (_r) => ok(undefined),
  };

  const service = new CannedResponseService(mockRepo);
  const result = await service.ejecutar(TID, "saludo");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("fallo_persistencia");
});
