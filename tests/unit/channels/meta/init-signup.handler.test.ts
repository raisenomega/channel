import { expect, test } from "vitest";
import { InitSignupHandler, InitSignupCommand, InitSignupRepository } from "../../../../src/channels/meta/application/init-signup.handler.ts";
import { ok } from "../../../../src/shared/domain/result.ts";
import type { Result } from "../../../../src/shared/domain/result.ts";

class MockInitRepo implements InitSignupRepository {
  states: Array<{ tenantId: string; state: string; appId: string; callbackUrl: string; expiresAt: string }> = [];
  signups: Array<{ tenantId: string; signupId: string; state: string }> = [];
  failNext = "none";

  setFail(mode: "none" | "state" | "signup") { this.failNext = mode; }

  async guardarState(tenantId: string, state: string, appId: string, callbackUrl: string, expiresAt: string): Promise<Result<void, string>> {
    if (this.failNext === "state") return { ok: false as const, error: "db_error" };
    this.states.push({ tenantId, state, appId, callbackUrl, expiresAt });
    return ok(undefined);
  }

  async crearSignup(tenantId: string, signupId: string, state: string): Promise<Result<void, string>> {
    if (this.failNext === "signup") return { ok: false as const, error: "db_error" };
    this.signups.push({ tenantId, signupId, state });
    return ok(undefined);
  }
}

test("ejecutar persiste state y signup, retorna URL OAuth", async () => {
  const repo = new MockInitRepo();
  const handler = new InitSignupHandler(repo);
  const cmd: InitSignupCommand = { tenantId: "tenant_abc", callbackUrl: "https://example.com/callback", appId: "123456789" };

  const result = await handler.ejecutar(cmd);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.url).toContain("https://www.facebook.com/v22.0/dialog/embedded_signup");
    expect(result.value.url).toContain("app_id=123456789");
    expect(result.value.state).toBeTruthy();
    expect(result.value.signupId).toBeTruthy();
  }
  expect(repo.states.length).toBe(1);
  expect(repo.signups.length).toBe(1);
  expect(repo.states[0].tenantId).toBe("tenant_abc");
  expect(repo.signups[0].tenantId).toBe("tenant_abc");
});

test("fallo al guardar state retorna persistence_failure", async () => {
  const repo = new MockInitRepo();
  repo.setFail("state");
  const handler = new InitSignupHandler(repo);
  const result = await handler.ejecutar({ tenantId: "t1", callbackUrl: "https://x.com/cb", appId: "123" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("persistence_failure");
});

test("fallo al crear signup retorna persistence_failure", async () => {
  const repo = new MockInitRepo();
  repo.setFail("signup");
  const handler = new InitSignupHandler(repo);
  const result = await handler.ejecutar({ tenantId: "t1", callbackUrl: "https://x.com/cb", appId: "123" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("persistence_failure");
});

test("tenantId vacio retorna tenant_requerido", async () => {
  const repo = new MockInitRepo();
  const handler = new InitSignupHandler(repo);
  const result = await handler.ejecutar({ tenantId: "", callbackUrl: "https://x.com/cb", appId: "123" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("tenant_requerido");
});

test("appId vacio retorna app_id_invalido", async () => {
  const repo = new MockInitRepo();
  const handler = new InitSignupHandler(repo);
  const result = await handler.ejecutar({ tenantId: "t1", callbackUrl: "https://x.com/cb", appId: "" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("app_id_invalido");
});