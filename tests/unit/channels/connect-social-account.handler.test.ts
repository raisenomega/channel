import { expect, test, vi } from "vitest";
import { ConnectSocialAccountHandler } from "../../../src/channels/application/connect-social-account.handler.ts";

const handler = new ConnectSocialAccountHandler("apikey", "https://hub.test");

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

test("connect-url ok -> auth_url", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ auth_url: "https://zern.io/oauth?p=instagram" }), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await handler.ejecutar("t1", "instagram");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.authUrl).toContain("zern.io");
  restoreFetch();
});

test("A-08 TENANT_INEXISTENTE: Zernio rechaza tenant no existente -> zernio_error (404)", async () => {
  // Zernio retorna 404 cuando el tenant no existe en su sistema
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
  const r = await handler.ejecutar("tenant-inexistente", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("zernio_error");
  restoreFetch();
});

test("A-09 PLATFORM_INVALIDA: platform invalida -> platform_invalida", async () => {
  const r = await handler.ejecutar("t1", "tiktok");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("platform_invalida");
});

test("zernio http error -> zernio_error", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
  const r = await handler.ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("zernio_error");
  restoreFetch();
});