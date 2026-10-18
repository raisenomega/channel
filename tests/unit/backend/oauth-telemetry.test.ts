/**
 * HUB by Raisen — V-vigía (Compuerta #138): telemetría trackable. El helper parsea/genera request_id
 * y el callback propaga ?req= en el 302 (para correlacionar backend <-> navegador). A-V-vig-1/2.
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { nuevoReqId, reqIdDeQuery } from "../../../src/channels/infrastructure/oauth-telemetry.ts";
import { rutaZernioCallback } from "../../../src/channels/presentation/routes/zernio-callback.routes.ts";
import { signState, nuevoNonce } from "../../../src/identity/infrastructure/oauth-state.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

test("A-V-vig-1: reqIdDeQuery extrae ?req= (o '-' si ausente); nuevoReqId es no vacio", () => {
  expect(reqIdDeQuery("/x?req=abc123&y=1")).toBe("abc123");
  expect(reqIdDeQuery("/x?y=1")).toBe("-");
  expect(reqIdDeQuery("/x")).toBe("-");
  expect(nuevoReqId().length).toBeGreaterThan(8);
});

const SECRET = "oauth_state_secret_fortress_o3_test_32x";
const ORIGIN = "https://app.hub.test";
beforeEach(() => { vi.stubEnv("OAUTH_STATE_SECRET", SECRET); vi.stubEnv("CORS_ORIGINS_ALLOWLIST", ORIGIN); });
afterEach(() => vi.unstubAllEnvs());

function deps() {
  return {
    noncesRepo: { consume: async () => true },
    tenantRepo: { buscar: async () => ({ ok: true as const, value: { zernioProfileId: "prof-A" } }) },
    connRepo: { guardar: vi.fn(async () => ({ ok: true as const, value: undefined })) },
    listOwnAccounts: async () => [{ id: "acc-1", platform: "facebook", handle: "@fb" }],
  } as never;
}

test("A-V-vig-2: el 302 del callback propaga &req= (trackable end-to-end)", async () => {
  const st = await signState({ tenantId: "t-A", platform: "facebook", origin: ORIGIN, userId: "u", nonce: nuevoNonce(), ts: Date.now() });
  if (!st.ok) throw new Error("sign fallo");
  const c = { path: `/channels/zernio/callback?st=${encodeURIComponent(st.value)}&step=select_page&tempToken=T&connect_token=C` } as RequestContext;
  const r = await rutaZernioCallback(deps()).handler(c);
  const locn = (r as { headers?: { location: string } }).headers?.location ?? "";
  expect(locn).toContain("oauth=needs_page");
  expect(locn).toMatch(/[?&]req=[0-9a-f-]{8,}/i); // req_id propagado en el redirect
});
