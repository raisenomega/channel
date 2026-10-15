import { expect, test, vi } from "vitest";
import {
  intercambiarCodigo,
  refrescarToken,
} from "../../../../src/channels/meta/infrastructure/meta-oauth.client.ts";

const ORIGINAL_FETCH = globalThis.fetch;

function mockFetch(response: Response): void {
  globalThis.fetch = vi.fn().mockResolvedValue(response);
}

function restoreFetch(): void {
  globalThis.fetch = ORIGINAL_FETCH;
}

test("intercambiarCodigo: exito retorna token data", async () => {
  const fbBody = {
    access_token: "EAA_test_token",
    access_token_expires_in: 5184000,
    business_id: "bus_123",
    account_id: "acc_456",
  };
  mockFetch(new Response(JSON.stringify(fbBody), { status: 200, headers: { "content-type": "application/json" } }));
  const result = await intercambiarCodigo("auth_code_xyz", "app_123", "secret_abc", "https://example.com/cb");
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.accessToken).toBe("EAA_test_token");
    expect(result.value.expiresAt).toBeTruthy();
    expect(result.value.businessId).toBe("bus_123");
    expect(result.value.accountId).toBe("acc_456");
  }
  restoreFetch();
});

test("intercambiarCodigo: error HTTP retorna red", async () => {
  mockFetch(new Response(JSON.stringify({ error: { message: "invalid code" } }), {
    status: 400,
    headers: { "content-type": "application/json" },
  }));
  const result = await intercambiarCodigo("bad_code", "app_1", "secret_1", "https://example.com/cb");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("red");
  restoreFetch();
});

test("intercambiarCodigo: network error retorna red", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("network failure"));
  const result = await intercambiarCodigo("code", "app_1", "secret_1", "https://example.com/cb");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("red");
  restoreFetch();
});

test("refrescarToken: exito retorna nuevo token", async () => {
  const fbBody = {
    access_token: "EAA_refreshed",
    access_token_expires_in: 5184000,
    business_id: "bus_999",
    account_id: "acc_888",
  };
  mockFetch(new Response(JSON.stringify(fbBody), { status: 200, headers: { "content-type": "application/json" } }));
  const result = await refrescarToken("old_token", "app_1", "secret_1");
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.accessToken).toBe("EAA_refreshed");
  }
  restoreFetch();
});

test("refrescarToken: error HTTP retorna red", async () => {
  mockFetch(new Response(JSON.stringify({ error: { message: "token expired" } }), {
    status: 401,
    headers: { "content-type": "application/json" },
  }));
  const result = await refrescarToken("expired_token", "app_1", "secret_1");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("red");
  restoreFetch();
});

test("refrescarToken: network error retorna red", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("timeout"));
  const result = await refrescarToken("some_token", "app_1", "secret_1");
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.kind).toBe("red");
  restoreFetch();
});