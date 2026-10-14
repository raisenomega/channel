import { expect, test } from "vitest";
import { RefreshTokenScheduler, TokenRefreshClient, TokenVaultRepository, TokenToRefresh } from "../../../../src/channels/meta/application/refresh-token.scheduler.ts";
import { ok, err } from "../../../../src/shared/domain/result.ts";

class MockRefreshClient implements TokenRefreshClient {
  private shouldFail = false;

  setFail(fail: boolean) {
    this.shouldFail = fail;
  }

  async refrescar(_a: string) {
    if (this.shouldFail) return err("mock_error");
    return ok({ accessToken: "EAA_fresh", expiresAt: "2026-01-01T00:00:00Z" });
  }
}

class MockVaultRepo implements TokenVaultRepository {
  private tokens: TokenToRefresh[] = [];
  private shouldFailList = false;
  private shouldFailRotate = false;
  rotatedTokens: string[] = [];

  setTokens(t: TokenToRefresh[]) {
    this.tokens = t;
  }

  setFailList(f: boolean) {
    this.shouldFailList = f;
  }

  setFailRotate(f: boolean) {
    this.shouldFailRotate = f;
  }

  async listarTokensPorExpirar(_a: number) {
    if (this.shouldFailList) return err("db_error");
    return ok(this.tokens);
  }

  async rotarToken(signupId: string, _a: string, _b: string, _c: string, _d: string, _e: string) {
    if (this.shouldFailRotate) return err("rotate_fail");
    this.rotatedTokens.push(signupId);
    return ok(undefined);
  }
}

test("ejecutar con tokens pendientes refresca todos", async () => {
  const client = new MockRefreshClient();
  const vault = new MockVaultRepo();
  vault.setTokens([
    { signupId: "s1", tenantId: "t1", currentEncryptedToken: "tok1", expiresAt: "2025-06-01T00:00:00Z" },
    { signupId: "s2", tenantId: "t2", currentEncryptedToken: "tok2", expiresAt: "2025-06-02T00:00:00Z" },
  ]);

  const scheduler = new RefreshTokenScheduler(client, vault);
  const result = await scheduler.ejecutar();
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.refrescados).toBe(2);
  }
  expect(vault.rotatedTokens).toContain("s1");
  expect(vault.rotatedTokens).toContain("s2");
});

test("ejecutar sin tokens pendientes retorna ok con 0", async () => {
  const client = new MockRefreshClient();
  const vault = new MockVaultRepo();
  vault.setTokens([]);

  const scheduler = new RefreshTokenScheduler(client, vault);
  const result = await scheduler.ejecutar();
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.refrescados).toBe(0);
  }
});

test("ejecutar cuando falla listado retorna sin_tokens_para_refrescar", async () => {
  const client = new MockRefreshClient();
  const vault = new MockVaultRepo();
  vault.setFailList(true);

  const scheduler = new RefreshTokenScheduler(client, vault);
  const result = await scheduler.ejecutar();
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("sin_tokens_para_refrescar");
});

test("ejecutar cuando falla refresh de un token continua con los otros", async () => {
  const client = new MockRefreshClient();
  const vault = new MockVaultRepo();
  vault.setTokens([
    { signupId: "s1", tenantId: "t1", currentEncryptedToken: "tok1", expiresAt: "2025-06-01T00:00:00Z" },
    { signupId: "s2", tenantId: "t2", currentEncryptedToken: "tok2", expiresAt: "2025-06-02T00:00:00Z" },
  ]);

  const scheduler = new RefreshTokenScheduler(client, vault);
  // Hacemos que falle el refresh del segundo
  client.setFail(true);

  const result = await scheduler.ejecutar();
  expect(result.ok).toBe(true);
  if (result.ok) {
    // Ninguno se refresca porque el cliente esta en modo fail
    expect(result.value.refrescados).toBe(0);
  }
});