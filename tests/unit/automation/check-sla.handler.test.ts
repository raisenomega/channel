import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CheckSLAHandler, CheckSLACommand } from "../../../src/automation/application/check-sla.handler.ts";
import { SLAPolicyRepository, RepoError } from "../../../src/automation/domain/automation.repository.ts";
import { SLAPolicyState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const TID = crypto.randomUUID() as never;
const CONV_ID = crypto.randomUUID();

const politicaUrgente: SLAPolicyState = Object.freeze({
  id: "pol-1",
  tenantId: TID,
  name: "Urgente",
  firstResponseSeconds: 60,
  resolutionSeconds: 300,
  priority: "urgent",
  isActive: true,
});

const politicaNormal: SLAPolicyState = Object.freeze({
  id: "pol-2",
  tenantId: TID,
  name: "Normal",
  firstResponseSeconds: 600,
  resolutionSeconds: 3600,
  priority: "low",
  isActive: true,
});

const ALL_POLICIES: SLAPolicyState[] = [politicaUrgente, politicaNormal];

test("CheckSLAHandler â€” debe retornar politica si elapsed excede firstResponseSeconds", async () => {
  const mockSlaRepo: SLAPolicyRepository = {
    buscarActivas: async (_tid) => ok(ALL_POLICIES),
    guardar: async (_p) => ok(undefined),
  };

  const handler = new CheckSLAHandler(mockSlaRepo);
  const cmd: CheckSLACommand = {
    tenantId: TID,
    conversationId: CONV_ID,
    elapsedSeconds: 120, // supera los 60s de politicaUrgente
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value !== null).toBe(true);
  expect(result.value!.id).toBe("pol-1");
});

test("CheckSLAHandler â€” debe retornar null si ningun elapsed supera politicas", async () => {
  const mockSlaRepo: SLAPolicyRepository = {
    buscarActivas: async (_tid) => ok(ALL_POLICIES),
    guardar: async (_p) => ok(undefined),
  };

  const handler = new CheckSLAHandler(mockSlaRepo);
  const cmd: CheckSLACommand = {
    tenantId: TID,
    conversationId: CONV_ID,
    elapsedSeconds: 30, // no supera ninguna
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value).toBe(null);
});

test("CheckSLAHandler â€” debe retornar la primera politica que se cumple (por orden)", async () => {
  const policiesOrdenadas = [politicaNormal, politicaUrgente]; // normal first
  const mockSlaRepo: SLAPolicyRepository = {
    buscarActivas: async (_tid) => ok(policiesOrdenadas),
    guardar: async (_p) => ok(undefined),
  };

  const handler = new CheckSLAHandler(mockSlaRepo);
  const cmd: CheckSLACommand = {
    tenantId: TID,
    conversationId: CONV_ID,
    elapsedSeconds: 500, // supera normal (600? no) -> supera urgente (60? si)
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  // Normal tiene 600s, 500 no lo supera, Urgente 60s si -> debe devolver Urgente
  expect(result.value!.id).toBe("pol-1");
});

test("CheckSLAHandler â€” debe fallar con persistence_failure si repo falla", async () => {
  const mockSlaRepo: SLAPolicyRepository = {
    buscarActivas: async (_tid) => err({ kind: "persistence_failure", cause: "timeout" }),
    guardar: async (_p) => ok(undefined),
  };

  const handler = new CheckSLAHandler(mockSlaRepo);
  const cmd: CheckSLACommand = {
    tenantId: TID,
    conversationId: CONV_ID,
    elapsedSeconds: 10,
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("timeout");
});

test("CheckSLAHandler â€” debe fallar con causa por defecto si repo no da cause", async () => {
  const mockSlaRepo: SLAPolicyRepository = {
    buscarActivas: async (_tid) => err({ kind: "not_found" }),
    guardar: async (_p) => ok(undefined),
  };

  const handler = new CheckSLAHandler(mockSlaRepo);
  const cmd: CheckSLACommand = {
    tenantId: TID,
    conversationId: CONV_ID,
    elapsedSeconds: 10,
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
  expect(result.error.cause).toBe("fallo_persistencia");
});
