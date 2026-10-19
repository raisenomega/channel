/**
 * HUB by Raisen — GET /tenants/:id/connected-accounts: solo devuelve canales USABLES
 * (channel_connections.status === 'connected'). Un canal desconectado (toggle off) queda FUERA
 * -> HUB no lo usa, aunque siga enlazado en Zernio. Mock de fetch (Zernio) + repo con 2 enlaces.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaConnectedAccounts, type ChannelsDeps } from "../../../src/channels/presentation/channels.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
const ORIGINAL_FETCH = globalThis.fetch;
beforeEach(() => vi.stubEnv("SUPABASE_JWT_SECRET", SECRET));
afterEach(() => { vi.unstubAllEnvs(); globalThis.fetch = ORIGINAL_FETCH; });

async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "u-1", tenant_id: tenantId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
const enlace = (platform: string, zernioAccountId: string, status: string) => ({
  id: platform, tenantId: "t1", platform, zernioAccountId, handle: null, followersCount: null, status,
  isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: "", updatedAt: "",
});
function deps(): ChannelsDeps {
  return {
    zernioApiKey: "k",
    repo: { listar: async () => ({ ok: true as const, value: [enlace("facebook", "acc-C", "connected"), enlace("instagram", "acc-D", "disconnected")] }) },
  } as unknown as ChannelsDeps;
}

test("connected-accounts: excluye el canal DESCONECTADO (toggle off); incluye el connected", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accounts: [
    { _id: "acc-C", platform: "facebook", isActive: true }, { _id: "acc-D", platform: "instagram", isActive: true },
  ] }), { status: 200, headers: { "content-type": "application/json" } }));
  const ctx = { method: "GET", path: "/tenants/t1/connected-accounts", headers: { authorization: await bearer("t1") }, body: null, rawBody: "", jwt: null, params: Object.freeze({ id: "t1" }) } as RequestContext;
  const res = await rutaConnectedAccounts(deps()).handler(ctx) as { ok: boolean; items: Array<{ zernio_account_id: string }> };
  expect(res.ok).toBe(true);
  expect(res.items.map((i) => i.zernio_account_id)).toEqual(["acc-C"]); // acc-D (disconnected) FUERA
});
