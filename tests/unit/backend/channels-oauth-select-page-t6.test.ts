/**
 * HUB by Raisen — T-6 (causa raiz del OAuth FB stuck, confirmada por Zernio support): el callback
 * step=select_page de Zernio NO trae profileId todavia. Antes, el guard de match de profileId (L42)
 * bailaba con "error" ANTES de stashear -> picker nunca abria -> el POST a Zernio nunca llegaba.
 * Fix: select_page se maneja ANTES del guard (trust anchor = state firmado). A-T-6-1/1b + TTL.
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { rutaZernioCallback } from "../../../src/channels/presentation/routes/zernio-callback.routes.ts";
import { signState, nuevoNonce } from "../../../src/identity/infrastructure/oauth-state.ts";
import { getPending, stashPending } from "../../../src/channels/infrastructure/oauth-pending-stash.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "oauth_state_secret_fortress_o3_test_32x";
const ORIGIN = "https://app.hub.test";
beforeEach(() => { vi.stubEnv("OAUTH_STATE_SECRET", SECRET); vi.stubEnv("CORS_ORIGINS_ALLOWLIST", ORIGIN); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

function deps() {
  return {
    noncesRepo: { consume: async () => true },
    tenantRepo: { buscar: async () => ({ ok: true as const, value: { zernioProfileId: "prof-A" } }) },
    connRepo: { guardar: vi.fn(async () => ({ ok: true as const, value: undefined })) },
    listOwnAccounts: async () => [{ id: "acc-1", platform: "facebook", handle: "@fb" }],
  } as never;
}
async function signed(over: Record<string, unknown> = {}): Promise<string> {
  const r = await signState({ tenantId: "t-A", platform: "facebook", origin: ORIGIN, userId: "u-fb", nonce: nuevoNonce(), ts: Date.now(), ...over });
  if (!r.ok) throw new Error("sign fallo"); return r.value;
}
const loc = (r: unknown): string => (r as { headers?: { location: string } }).headers?.location ?? "";

test("A-T-6-1: step=select_page SIN profileId (como lo manda Zernio) -> stash connect_token + needs_page", async () => {
  const st = await signed({ tenantId: "t-T6a", userId: "u-T6a" });
  const c = { path: `/channels/zernio/callback?st=${encodeURIComponent(st)}&step=select_page&tempToken=TT6&connect_token=CT6` } as RequestContext;
  const r = await rutaZernioCallback(deps()).handler(c);
  expect(loc(r)).toContain("oauth=needs_page");
  expect(loc(r)).not.toContain("TT6"); // tokens NUNCA en la URL
  const p = getPending("u-T6a", "t-T6a", "facebook");
  expect(p?.connectToken).toBe("CT6");
  expect(p?.tempToken).toBe("TT6");
});

test("A-T-6-1b: step=select_page con profileId que NO matchea -> igual stashea (profileId irrelevante aqui)", async () => {
  const st = await signed({ tenantId: "t-T6b", userId: "u-T6b" });
  const c = { path: `/channels/zernio/callback?st=${encodeURIComponent(st)}&profileId=prof-AJENO&step=select_page&tempToken=T2&connect_token=C2` } as RequestContext;
  const r = await rutaZernioCallback(deps()).handler(c);
  expect(loc(r)).toContain("oauth=needs_page");
  expect(getPending("u-T6b", "t-T6b", "facebook")?.connectToken).toBe("C2");
});

test("A-T-6-regresion: NO select_page + profileId mismatch -> sigue dando error (aislamiento intacto)", async () => {
  const st = await signed({ tenantId: "t-T6c", userId: "u-T6c" });
  const c = { path: `/channels/zernio/callback?st=${encodeURIComponent(st)}&profileId=prof-AJENO&accountId=acc-1` } as RequestContext;
  const r = await rutaZernioCallback(deps()).handler(c);
  expect(loc(r)).toContain("oauth=error");
});

test("A-T-6-4: el stash respeta TTL >=15min; expirado -> getPending null (recovery via timeout T-4)", () => {
  vi.useFakeTimers();
  stashPending("u-ttl", "t-ttl", "facebook", "TT", "CT", null);
  vi.advanceTimersByTime(14 * 60_000); // 14 min: aun vigente
  expect(getPending("u-ttl", "t-ttl", "facebook")?.connectToken).toBe("CT");
  vi.advanceTimersByTime(2 * 60_000); // total 16 min: expirado
  expect(getPending("u-ttl", "t-ttl", "facebook")).toBeNull();
});
