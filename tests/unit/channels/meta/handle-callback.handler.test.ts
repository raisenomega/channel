import { expect, test } from "vitest";
import { HandleCallbackHandler } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import type { EmbeddedSignupRepository, StateResolver } from "../../../../src/channels/meta/application/embedded-signup.repo.ts";
import type { EmbeddedSignupStatus } from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockSignupRepo implements EmbeddedSignupRepository {
  private signups = new Map<string, { id: string; status: EmbeddedSignupStatus; tenantId: string }>();

  async buscarPorId(signupId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const s = this.signups.get(signupId);
    return ok(s ? { ...s } : null);
  }
  async actualizar(_a: string, _b: Record<string, unknown>): Promise<Result<void, string>> { return ok(undefined); }
  async guardarToken(_a: string, _b: string, _c: string, _d: string): Promise<Result<void, string>> { return ok(undefined); }
  seed(id: string, status: EmbeddedSignupStatus, tenantId: string) { this.signups.set(id, { id, status, tenantId }); }
}

class MockStateResolver implements StateResolver {
  private data: { signupId: string; tenantId: string } | null = { signupId: "sig_test", tenantId: "tenant_test" };
  setResult(d: { signupId: string; tenantId: string } | null) { this.data = d; }
  async verificarYConsumirState(_state: string): Promise<Result<{ signupId: string; tenantId: string } | null, string>> { return ok(this.data); }
}

test("state valido + signup existente -> exito", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_test", "CREATED", "tenant_test");
  const resolver = new MockStateResolver();
  const handler = new HandleCallbackHandler(repo, resolver);

  const result = await handler.ejecutar({ id: "any", status: "ATTEMPTED_REACH" }, "valid_state");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.status).toBe("ATTEMPTED_REACH");
});

test("state invalido (resolver retorna null) -> error", async () => {
  const repo = new MockSignupRepo();
  const resolver = new MockStateResolver();
  resolver.setResult(null);
  const handler = new HandleCallbackHandler(repo, resolver);

  const result = await handler.ejecutar({ id: "any", status: "CREATED" }, "bad_state");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("state_invalido_o_expirado");
});

test("state vacio -> error state_requerido", async () => {
  const repo = new MockSignupRepo();
  const resolver = new MockStateResolver();
  const handler = new HandleCallbackHandler(repo, resolver);

  const result = await handler.ejecutar({ id: "any", status: "CREATED" }, "");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("state_requerido");
});

test("signup no existe -> error signup_no_encontrado", async () => {
  const repo = new MockSignupRepo();
  const resolver = new MockStateResolver();
  const handler = new HandleCallbackHandler(repo, resolver);

  const result = await handler.ejecutar({ id: "any", status: "CREATED" }, "valid_state");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("signup_no_encontrado");
});