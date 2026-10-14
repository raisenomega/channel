import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { OptInHandler, OptOutHandler } from "../../../src/compliance/application/opt-in.handler.ts";
import { ConsentRepository, RepoError } from "../../../src/compliance/domain/compliance.repository.ts";
import { ChannelType } from "../../../src/compliance/domain/compliance.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("OptInHandler â€” debe registrar opt-in cuando no hay registro previo", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok(null),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new OptInHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "email", "explicit");

  expect(result.ok).toBe(true);
  expect(result.value).toBe(undefined);
});

test("OptInHandler â€” debe registrar opt-in cuando ultimo registro era opt_out", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok({
      id: crypto.randomUUID(),
      tenantId: TID,
      contactId: CID,
      channel: "email" as ChannelType,
      action: "opt_out" as const,
      source: "explicit" as const,
      consentedAt: new Date(),
      expiresAt: null,
    }),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new OptInHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "email", "explicit");

  expect(result.ok).toBe(true);
});

test("OptInHandler â€” debe fallar con ya_opt_in si ultimo era opt_in", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok({
      id: crypto.randomUUID(),
      tenantId: TID,
      contactId: CID,
      channel: "email" as ChannelType,
      action: "opt_in" as const,
      source: "explicit" as const,
      consentedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86_400_000),
    }),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new OptInHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "email", "explicit");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("ya_opt_in");
});

test("OptInHandler â€” debe fallar si repo.guardar falla", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok(null),
    guardar: async (_r) => err({ kind: "persistence_failure", cause: "db_down" }),
  };

  const handler = new OptInHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "whatsapp", "explicit");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});

test("OptOutHandler â€” debe registrar opt-out siempre", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok(null),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new OptOutHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "sms");

  expect(result.ok).toBe(true);
});

test("OptOutHandler â€” debe fallar si guardar falla", async () => {
  const mockRepo: ConsentRepository = {
    buscarUltimo: async (_tid, _cid, _ch) => ok(null),
    guardar: async (_r) => err({ kind: "persistence_failure", cause: "timeout" }),
  };

  const handler = new OptOutHandler(mockRepo);
  const result = await handler.ejecutar(CID, TID, "sms");

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
