import { expect, test } from "vitest";
import { HandleCallbackHandler, EmbeddedSignupRepository } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import { EmbeddedSignupStatus } from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockSignupRepo implements EmbeddedSignupRepository {
  private signups: Map<string, { id: string; status: EmbeddedSignupStatus; tenantId: string }>;

  constructor() {
    this.signups = new Map();
  }

  async buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const row = this.signups.get(metaId);
    if (!row) return ok(null);
    return ok({ ...row });
  }

  async actualizar(_a: string, _b: Record<string, unknown>): Promise<Result<void, string>> {
    return ok(undefined);
  }

  async guardarToken(_a: string, _b: string, _c: string, _d: string, _e: string, _f: string): Promise<Result<void, string>> {
    return ok(undefined);
  }

  seed(id: string, status: EmbeddedSignupStatus, tenantId: string) {
    this.signups.set(id, { id, status, tenantId });
  }
}

test("HandleCallbackHandler con payload CREATED valido", async () => {
  const repo = new MockSignupRepo();
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "sig_ok",
    status: "CREATED",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.status).toBe("CREATED");
  }
});

test("HandleCallbackHandler transiciona ATTEMPTED_REACH si existe signup previo CREATED", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_trans", "CREATED", "tenant_abc");
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "sig_trans",
    status: "ATTEMPTED_REACH",
    waba_id: "waba_001",
    phone_number_id: "phone_001",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.status).toBe("ATTEMPTED_REACH");
  }
});

test("HandleCallbackHandler COMPLETED con todos los campos requeridos", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_complete", "ATTEMPTED_REACH", "tenant_abc");
  const handler = new HandleCallbackHandler(repo);

  const payload = {
    id: "sig_complete",
    status: "COMPLETED",
    waba_id: "waba_002",
    phone_number_id: "phone_002",
    access_token: "EAA_complete_token",
    access_token_expires_at: "2026-01-15T00:00:00Z",
  };

  const result = await handler.ejecutar(payload);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.status).toBe("COMPLETED");
    expect(result.value.wabaId).toBe("waba_002");
  }
});

test("HandleCallbackHandler rechaza transicion invalida (COMPLETED -> DELETED)", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_bad", "COMPLETED", "tenant_err");
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "sig_bad",
    status: "DELETED",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toContain("transicion_invalida");
  }
});

test("HandleCallbackHandler rechaza COMPLETED sin access_token", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_no_token", "ATTEMPTED_REACH", "tenant_abc");
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "sig_no_token",
    status: "COMPLETED",
    waba_id: "w_1",
    phone_number_id: "p_1",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toBe("token_incompleto");
  }
});

test("HandleCallbackHandler signup nuevo (no existe en repo) genera nuevo ID", async () => {
  const repo = new MockSignupRepo();
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "brand_new",
    status: "CREATED",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.signupId).toBeTruthy();
    expect(result.value.status).toBe("CREATED");
  }
});