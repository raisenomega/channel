/**
 * HUB by Raisen — O-3/O-9 adversariales A-O-4..A-O-9 del callback Zernio (sin JWT, el
 * state firmado N-9 es el unico trust anchor). Deps stub + state firmado real.
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { rutaZernioCallback } from "../../../src/channels/presentation/routes/zernio-callback.routes.ts";
import { signState, nuevoNonce } from "../../../src/identity/infrastructure/oauth-state.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "oauth_state_secret_fortress_o3_test_32x";
const ORIGIN = "https://app.hub.test";
beforeEach(() => { vi.stubEnv("OAUTH_STATE_SECRET", SECRET); vi.stubEnv("CORS_ORIGINS_ALLOWLIST", `${ORIGIN},http://localhost:5173`); });
afterEach(() => vi.unstubAllEnvs());

function deps(over: Record<string, unknown> = {}) {
  return {
    noncesRepo: { consume: async () => true },
    tenantRepo: { buscar: async () => ({ ok: true as const, value: { zernioProfileId: "prof-A" } }) },
    connRepo: { guardar: vi.fn(async () => ({ ok: true as const, value: undefined })) },
    listOwnAccounts: async () => [{ id: "acc-1", platform: "whatsapp", handle: "@zafacones" }],
    ...over,
  } as never;
}
const ctx = (st: string, profileId = "prof-A", accountId = "acc-1"): RequestContext =>
  ({ path: `/channels/zernio/callback?st=${encodeURIComponent(st)}&profileId=${profileId}&accountId=${accountId}` }) as RequestContext;
async function signed(over: Record<string, unknown> = {}): Promise<string> {
  const r = await signState({ tenantId: "t-A", platform: "whatsapp", origin: ORIGIN, userId: "u", nonce: nuevoNonce(), ts: Date.now(), ...over });
  if (!r.ok) throw new Error("sign fallo"); return r.value;
}

test("A-O-4 state valido + profileId matching -> persist + redirect connected", async () => {
  const d = deps(); const r = await rutaZernioCallback(d).handler(ctx(await signed()));
  expect((r as { status?: number }).status).toBe(302);
  expect((r as { headers?: { location: string } }).headers?.location).toContain("status=connected");
  expect((d as { connRepo: { guardar: { mock: { calls: unknown[] } } } }).connRepo.guardar.mock.calls.length).toBe(1);
});
test("A-O-4b (#4 hardening) accountId NO pertenece al profile -> NO persiste + redirect error", async () => {
  const d = deps({ listOwnAccounts: async () => [{ id: "otra-cuenta", platform: "whatsapp", handle: "x" }] });
  const r = await rutaZernioCallback(d).handler(ctx(await signed(), "prof-A", "acc-ajena"));
  expect((r as { headers?: { location: string } }).headers?.location).toContain("status=error");
  expect((d as { connRepo: { guardar: { mock: { calls: unknown[] } } } }).connRepo.guardar.mock.calls.length).toBe(0);
});
test("A-O-5 profileId NO matching tenant.zernioProfileId -> abort sin persist + redirect error", async () => {
  const d = deps(); const r = await rutaZernioCallback(d).handler(ctx(await signed(), "prof-AJENO"));
  expect((r as { headers?: { location: string } }).headers?.location).toContain("status=error");
  expect((d as { connRepo: { guardar: { mock: { calls: unknown[] } } } }).connRepo.guardar.mock.calls.length).toBe(0);
});
test("A-O-6 state con firma alterada -> 401 state_signature_invalid", async () => {
  const st = await signed(); const bad = st.slice(0, -2) + (st.endsWith("aa") ? "bb" : "aa");
  const r = await rutaZernioCallback(deps()).handler(ctx(bad));
  expect((r as { status?: number }).status).toBe(401);
});
test("A-O-7 nonce replay (consume=false) -> 401 state_nonce_replayed", async () => {
  const r = await rutaZernioCallback(deps({ noncesRepo: { consume: async () => false } })).handler(ctx(await signed()));
  expect((r as { status?: number }).status).toBe(401);
  expect(JSON.stringify(r)).toContain("state_nonce_replayed");
});
test("A-O-8 state expirado (ts > 5 min) -> 401 state_expired", async () => {
  const r = await rutaZernioCallback(deps()).handler(ctx(await signed({ ts: Date.now() - 6 * 60 * 1000 })));
  expect((r as { status?: number }).status).toBe(401);
  expect(JSON.stringify(r)).toContain("state_expired");
});
test("A-O-9 origin NO en CORS_ORIGINS_ALLOWLIST -> 403 origin_rejected (anti open-redirect)", async () => {
  const r = await rutaZernioCallback(deps()).handler(ctx(await signed({ origin: "https://evil.test" })));
  expect((r as { status?: number }).status).toBe(403);
  expect(JSON.stringify(r)).toContain("origin_rejected");
});
