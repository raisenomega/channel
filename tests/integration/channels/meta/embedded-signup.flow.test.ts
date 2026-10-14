/**
 * HUB by Raisen — Integration tests for Embedded Signup Meta (Slice 1).
 * Flujo: init signup (persiste state + signup) → callback webhook con state.
 * Verifica CRIT-2 (state invalido rechazado) y CRIT-6 (init persiste).
 */
import { expect, test } from "vitest";
import { InitSignupHandler, InitSignupRepository } from "../../../../src/channels/meta/application/init-signup.handler.ts";
import { HandleCallbackHandler, EmbeddedSignupRepository, StateVerifier } from "../../../../src/channels/meta/application/handle-callback.handler.ts";
import { EmbeddedSignupStatus } from "../../../../src/channels/meta/domain/embedded-signup.entity.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MemoryAllInOneRepo implements EmbeddedSignupRepository, InitSignupRepository, StateVerifier {
  private signups: Array<{ id: string; tenantId: string; status: EmbeddedSignupStatus }> = [];
  private states: Array<{ state: string; tenantId: string; expiresAt: Date }> = [];

  async buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const s = this.signups.find(s => s.id === metaId);
    return ok(s ? { ...s } : null);
  }

  async actualizar(_signupId: string, _data: Record<string, unknown>): Promise<Result<void, string>> { return ok(undefined); }
  async guardarToken(_a: string, _b: string, _c: string, _d: string): Promise<Result<void, string>> { return ok(undefined); }

  async guardarState(tenantId: string, state: string, _appId: string, _callbackUrl: string, _expiresAt: string): Promise<Result<void, string>> {
    this.states.push({ state, tenantId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    return ok(undefined);
  }

  async crearSignup(tenantId: string, signupId: string, _state: string): Promise<Result<void, string>> {
    this.signups.push({ id: signupId, tenantId, status: "CREATED" });
    return ok(undefined);
  }

  async verificarState(state: string, tenantId: string): Promise<Result<boolean, string>> {
    const s = this.states.find(s => s.state === state && s.tenantId === tenantId);
    if (!s) return ok(false);
    return ok(s.expiresAt > new Date());
  }

  reset() { this.signups = []; this.states = []; }
}

test("CRIT-6: InitSignupHandler persiste state y signup, callback los encuentra", async () => {
  const repo = new MemoryAllInOneRepo();
  const initHandler = new InitSignupHandler(repo);
  const callbackHandler = new HandleCallbackHandler(repo, repo);

  const cmd = { tenantId: "tenant_int", callbackUrl: "https://app.com/meta/callback", appId: "123456789012345" };
  const initResult = await initHandler.ejecutar(cmd);
  expect(initResult.ok).toBe(true);
  if (!initResult.ok) return;

  // State y signup fueron persistidos
  expect(repo.states.length).toBe(1);
  expect(repo.signups.length).toBe(1);

  const { state, signupId, url } = initResult.value;
  expect(url).toContain("state=");
  expect(state).toBeTruthy();
  expect(signupId).toBeTruthy();

  // Verificar que el signup existe en el repo
  const buscar = await repo.buscarPorMetaId(signupId);
  expect(buscar.ok).toBe(true);
  if (buscar.ok) {
    expect(buscar.value).not.toBeNull();
  }

  // Ahora callback con state valido
  const cbResult = await callbackHandler.ejecutar({ id: signupId, status: "CREATED" }, state, "tenant_int");
  expect(cbResult.ok).toBe(true);
  if (cbResult.ok) expect(cbResult.value.status).toBe("CREATED");
});

test("CRIT-2: callback con state invalido retorna 403 equivalente", async () => {
  const repo = new MemoryAllInOneRepo();
  const callbackHandler = new HandleCallbackHandler(repo, repo);

  const result = await callbackHandler.ejecutar({ id: "sig_no_state", status: "CREATED" }, "state_falso", "tenant_x");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.kind).toBe("validacion_fallo");
    expect(result.error.cause).toBe("state_invalido_o_expirado");
  }
});

test("CRIT-4: callback sin signup previo y sin tenantId retorna error", async () => {
  const repo = new MemoryAllInOneRepo();
  const callbackHandler = new HandleCallbackHandler(repo);

  const result = await callbackHandler.ejecutar({ id: "brand_new_no_state", status: "CREATED" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("signup_no_encontrado");
});

test("CRIT-5: COMPLETED con token fluye si state es valido e init existe", async () => {
  const repo = new MemoryAllInOneRepo();
  const initHandler = new InitSignupHandler(repo);
  const callbackHandler = new HandleCallbackHandler(repo, repo);

  const initResult = await initHandler.ejecutar({ tenantId: "t_complete", callbackUrl: "https://x.com/cb", appId: "123" });
  expect(initResult.ok).toBe(true);
  if (!initResult.ok) return;
  const { state, signupId } = initResult.value;

  const cbResult = await callbackHandler.ejecutar({
    id: signupId, status: "COMPLETED", waba_id: "w_1", phone_number_id: "p_1", access_token: "EAA_real_token",
  }, state, "t_complete");
  expect(cbResult.ok).toBe(true);
  if (cbResult.ok) expect(cbResult.value.status).toBe("COMPLETED");
});