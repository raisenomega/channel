import { expect, test, vi } from "vitest";

const ORIGINAL_FETCH = globalThis.fetch;

function mockFetch(response: Response): void {
  globalThis.fetch = vi.fn().mockResolvedValue(response);
}

function restoreFetch(): void {
  globalThis.fetch = ORIGINAL_FETCH;
}

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("guardar: POST exitoso retorna ok", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
  const prevFetch = globalThis.fetch;
  globalThis.fetch = fetchFn;
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "EAA_token_real", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(true);
  if (fetchFn.mock.calls.length > 0) {
    const body = JSON.parse(fetchFn.mock.calls[0][1]?.body ?? "{}");
    expect(body.encrypted_nonce).toBeDefined();
    expect(body.encrypted_token).toBeDefined();
    expect(body.encrypted_token).not.toContain("EAA");
  }
  globalThis.fetch = prevFetch;
  vi.unstubAllEnvs();
});

test("guardar: POST 401 retorna persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  mockFetch(new Response(null, { status: 401 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "token", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(false);
  restoreFetch();
  vi.unstubAllEnvs();
});

test("guardar: sin META_TOKEN_ENCRYPTION_KEY falla", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  mockFetch(new Response(null, { status: 201 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  const result = await repo.guardar("sig_1", "tenant_1", "token", "2025-12-31T00:00:00Z");
  expect(result.ok).toBe(false);
  restoreFetch();
  vi.unstubAllEnvs();
});

test("obtenerTokenPlano: roundtrip encrypt -> decrypt", async () => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test_service_role_key");
  vi.stubEnv("META_TOKEN_ENCRYPTION_KEY", TEST_KEY);
  const record = {
    id: "rec_1",
    tenantId: "tenant_1",
    signupId: "sig_1",
    encryptedNonce: "ab".repeat(24),
    encryptedToken: "deadbeef",
    keyVersion: 1,
    tokenType: "system_user",
    expiresAt: "2025-12-31T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    rotatedAt: null,
  };
  mockFetch(new Response(JSON.stringify([record]), { status: 200 }));
  const { TokenVaultRepository } = await import("../../../../src/channels/meta/infrastructure/token-vault.repo.ts");
  const repo = new TokenVaultRepository();
  // buscarToken existe
  const busqueda = await repo.buscarToken("sig_1");
  expect(busqueda.ok).toBe(true);
  if (busqueda.ok) {
    expect(busqueda.value.signupId).toBe("sig_1");
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