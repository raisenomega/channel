import { expect, test, vi } from "vitest";

const ORIGINAL_FETCH = globalThis.fetch;

function mockFetch(response: Response): void {
  globalThis.fetch = vi.fn().mockResolvedValue(response);
}

function restoreFetch(): void {
  globalThis.fetch = ORIGINAL_FETCH;
}

test("guardar: POST exitoso retorna ok", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 201 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "enc_data", "iv_abc", "tag_xyz", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(true);
  restoreFetch();
  vi.unstubAllEnvs();
});

test("guardar: POST 401 retorna persistence_failure no_autorizado", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 401 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "enc", "iv", "tag", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("no_autorizado");
  restoreFetch();
  vi.unstubAllEnvs();
});

test("guardar: POST 403 retorna persistence_failure no_autorizado", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 403 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "enc", "iv", "tag", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("no_autorizado");
  restoreFetch();
  vi.unstubAllEnvs();
});

test("guardar: POST 500 retorna persistence_failure http_500", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 500 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "enc", "iv", "tag", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.cause).toBe("http_500");
  restoreFetch();
  vi.unstubAllEnvs();
});

test("buscarToken: existe retorna TokenRecord", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  const record = {
    id: "rec_1",
    tenantId: "tenant_1",
    signupId: "sig_1",
    encryptedToken: "enc_data",
    tokenEncryptedIv: "iv_abc",
    tokenEncryptedTag: "tag_xyz",
    tokenType: "system_user",
    expiresAt: "2025-12-31T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    rotatedAt: null,
  };
  mockFetch(new Response(JSON.stringify([record]), { status: 200 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.buscarToken("sig_1");
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.signupId).toBe("sig_1");
    expect(result.value.tokenType).toBe("system_user");
  }
  restoreFetch();
  vi.unstubAllEnvs();
});

test("buscarToken: sin resultados retorna sin_token", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(JSON.stringify([]), { status: 200 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.buscarToken("sig_inexistente");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("sin_token");
  restoreFetch();
  vi.unstubAllEnvs();
});

test("buscarToken: error HTTP retorna persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 500 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.buscarToken("sig_err");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("persistence_failure");
  restoreFetch();
  vi.unstubAllEnvs();
});