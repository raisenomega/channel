/**
 * HUB by Raisen — POST /tenants/:id/channels/reconcile: sincroniza channel_connections con las
 * cuentas REALES de Zernio (por profileId) y las upserta como connected. Idempotente, scope-safe.
 * JWT HS256 (fallback de Q). Deps mockeadas (sin DB ni red a Zernio).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaChannelReconcile, type ReconcileDeps } from "../../../src/channels/presentation/routes/channel-reconcile.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
beforeEach(() => vi.stubEnv("SUPABASE_JWT_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "u-1", tenant_id: tenantId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(id: string, authorization: string): RequestContext {
  return { method: "POST", path: `/tenants/${id}/channels/reconcile`, headers: { authorization }, body: null, rawBody: "", jwt: null, params: Object.freeze({ id }) } as RequestContext;
}
type Acct = { id: string; platform: string; handle: string | null };
function build(accts: Acct[], profOk = true) {
  const guardar = vi.fn(async () => ({ ok: true as const, value: undefined }));
  const deps: ReconcileDeps = {
    profileService: { ensureProfileForTenant: vi.fn(async () => profOk ? { ok: true as const, value: { zernioProfileId: "p-1" } } : { ok: false as const, error: { kind: "zernio_no_configurado" } }) },
    connRepo: { guardar },
    listOwnAccounts: vi.fn(async () => accts),
  };
  return { deps, guardar };
}

test("upserta cada cuenta real de Zernio como connected + devuelve el conteo", async () => {
  const { deps, guardar } = build([{ id: "a-wa", platform: "whatsapp", handle: "wa" }, { id: "a-ig", platform: "instagram", handle: null }]);
  const res = await rutaChannelReconcile(deps).handler(ctx("t-1", await bearer("t-1"))) as { ok: boolean; reconciled: number };
  expect(res).toEqual({ ok: true, reconciled: 2 });
  expect(guardar).toHaveBeenCalledTimes(2);
  expect(guardar.mock.calls[0][0]).toMatchObject({ tenantId: "t-1", platform: "whatsapp", zernioAccountId: "a-wa", status: "connected" });
});

test("ignora plataformas fuera del CHECK de la tabla (ej. tiktok)", async () => {
  const { deps, guardar } = build([{ id: "x", platform: "tiktok", handle: null }, { id: "a-fb", platform: "facebook", handle: null }]);
  const res = await rutaChannelReconcile(deps).handler(ctx("t-1", await bearer("t-1"))) as { reconciled: number };
  expect(res.reconciled).toBe(1);
  expect(guardar).toHaveBeenCalledTimes(1);
});

test("sin profile Zernio -> reconciled 0 (nada que sincronizar)", async () => {
  const { deps, guardar } = build([], false);
  const res = await rutaChannelReconcile(deps).handler(ctx("t-1", await bearer("t-1"))) as { reconciled: number };
  expect(res.reconciled).toBe(0);
  expect(guardar).not.toHaveBeenCalled();
});

test("cross-tenant -> 403, NO toca el repo", async () => {
  const { deps, guardar } = build([{ id: "a", platform: "whatsapp", handle: null }]);
  const res = await rutaChannelReconcile(deps).handler(ctx("t-OTRO", await bearer("t-1")));
  expect((res as { status?: number }).status).toBe(403);
  expect(guardar).not.toHaveBeenCalled();
});
