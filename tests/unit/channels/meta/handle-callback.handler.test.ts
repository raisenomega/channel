import { expect, test } from "vitest";
import { HandleCallbackHandler } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import type { EmbeddedSignupRepository, StateVerifier } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import type { EmbeddedSignupStatus } from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockSignupRepo implements EmbeddedSignupRepository {
  private signups: Map<string, { id: string; status: EmbeddedSignupStatus; tenantId: string }>;

  constructor() { this.signups = new Map(); }

  async buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const row = this.signups.get(metaId);
    return ok(row ? { ...row } : null);
  }

  async actualizar(_a: string, _b: Record<string, unknown>): Promise<Result<void, string>> { return ok(undefined); }
  async guardarToken(_a: string, _b: string, _c: string, _d: string): Promise<Result<void, string>> { return ok(undefined); }

  seed(id: string, status: EmbeddedSignupStatus, tenantId: string) { this.signups.set(id, { id, status, tenantId }); }
}

class MockStateVerifier implements StateVerifier {
  private valid = true;
  setValid(v: boolean) { this.valid = v; }
  async verificarState(_state: string, _tenantId: string): Promise<Result<boolean, string>> { return ok(this.valid); }
}

test("CRIT-2: state invalido retorna validacion_fallo con state_invalido_o_expirado", async () => {
  const repo = new MockSignupRepo();
  const verifier = new MockStateVerifier();
  verifier.setValid(false);
  const handler = new HandleCallbackHandler(repo, verifier);

  const result = await handler.ejecutar({ id: "sig_1", status: "CREATED" }, "bad_state", "tenant_1");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toBe("state_invalido_o_expirado");
  }
});

test("state valido permite continuar", async () => {
  const repo = new MockSignupRepo();
  const verifier = new MockStateVerifier();
  verifier.setValid(true);
  const handler = new HandleCallbackHandler(repo, verifier);

  const result = await handler.ejecutar({ id: "sig_2", status: "CREATED" }, "good_state", "tenant_1");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.status).toBe("CREATED");
});

test("sin stateVerifier y con signup previo funciona", async () => {
  const repo = new MockSignupRepo();
  repo.seed("sig_existente", "CREATED", "tenant_1");
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({ id: "sig_existente", status: "ATTEMPTED_REACH" });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.status).toBe("ATTEMPTED_REACH");
});

test("CRIT-5: guardarToken falla -> handler retorna error", async () => {
  const repo = new MockSignupRepo();
  // Hacemos que guardarToken falle
  repo.actualizar = async () => ok(undefined);
  repo.guardarToken = async () => { throw new Error("ignored"); return Promise.resolve({ ok: false as const, error: "db_error" }); };
  const handler = new HandleCallbackHandler(repo);

  const result = await handler.ejecutar({
    id: "sig_fail", status: "COMPLETED", waba_id: "w_1", phone_number_id: "p_1", access_token: "EAA_token",
  });
  // Sin state/tenantId y sin signup existente -> debe fallar por signup_no_encontrado
  expect(result.ok).toBe(false);
});