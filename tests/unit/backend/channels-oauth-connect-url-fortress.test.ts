/**
 * HUB by Raisen — O-3 adversarial A-O-3: connect-url exige tenant del path == claim.
 * JWT del tenant A con :tenantId=B en el path -> 403 (Compuerta #17 tenant_mismatch).
 */
import { expect, test, vi } from "vitest";
vi.mock("../../../src/server/jwt-verify.ts", async (orig) => {
  const actual = await (orig() as Promise<Record<string, unknown>>);
  return { ...actual, parsearJwtClaims: async () => ({ ok: true, value: { userId: "u", tenantId: "t-A", exp: 0 } }) };
});
import { rutaChannelConnectUrl } from "../../../src/channels/presentation/routes/connect-url.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const ctx = (id: string): RequestContext =>
  ({ path: `/tenants/${id}/channels/whatsapp/connect-url`, headers: {}, params: {} }) as RequestContext;

test("A-O-3 JWT tenant A pero :tenantId=B en el path -> 403 tenant_mismatch (sin tocar Zernio)", async () => {
  const r = await rutaChannelConnectUrl({} as never).handler(ctx("t-B"));
  expect((r as { status?: number }).status).toBe(403);
  expect(JSON.stringify(r)).toContain("tenant_mismatch");
});

test("A-O-3b connect-url con mismo tenant pasa el guard de auth (llega a ensureProfile)", async () => {
  // deps minimos: ensureProfile stub ok para confirmar que el 403 NO se dispara con tenant correcto.
  const deps = {
    profileService: { ensureProfileForTenant: async () => ({ ok: false as const, error: { kind: "zernio_no_configurado" as const } }) },
    noncesRepo: { registrar: async () => ({ ok: true as const, value: undefined }) },
    apiKey: "", redirectBase: "https://cb.test",
  } as never;
  const r = await rutaChannelConnectUrl(deps).handler(ctx("t-A"));
  // tenant correcto -> pasa auth -> ensureProfile devuelve 503 (no 403): prueba que el guard no bloquea al tenant valido.
  expect((r as { status?: number }).status).toBe(503);
});
