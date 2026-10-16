/**
 * HUB by Raisen — ZernioSyncHandler (Hotfix G D4: GET /v1/accounts?platform= + filtro por enlaces del tenant).
 */
import { expect, test, vi } from "vitest";
import { ZernioSyncHandler } from "../../../src/channels/application/zernio-sync.handler.ts";
import type { ChannelConnectionsRepo } from "../../../src/channels/infrastructure/channel-connections.repository.ts";
import type { ChannelConnection } from "../../../src/channels/domain/social-account.entity.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const enlace = (platform: ChannelConnection["platform"], zernioAccountId: string | null): ChannelConnection => ({
  id: "c1", tenantId: "t1", platform, zernioAccountId, handle: null, followersCount: null, status: "awaiting",
  isPrimary: true, isPaused: false, autoPublishAllowed: false, createdAt: "", updatedAt: "",
});
function repo(enlaces: ChannelConnection[], falla = false): ChannelConnectionsRepo {
  return { listar: async () => falla ? err("http_500") : ok(enlaces), guardar: async () => ok(undefined) } as unknown as ChannelConnectionsRepo;
}
const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
function mockAccounts(accounts: Array<Record<string, unknown>>): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accounts }), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = fn;
  return fn;
}

test("happy: cuenta enlazada al tenant y activa -> connected + handle + followers; Zernio filtrado por platform", async () => {
  const fn = mockAccounts([{ _id: "acc-ig", platform: "instagram", username: "@miNegocio", followers_count: 1200, isActive: true }]);
  const r = await new ZernioSyncHandler("apikey", repo([enlace("instagram", "acc-ig")])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.status).toBe("connected"); expect(r.value.handle).toBe("@miNegocio"); expect(r.value.followersCount).toBe(1200); }
  expect(String(fn.mock.calls[0]?.[0])).toBe("https://api.zernio.io/v1/accounts?platform=instagram");
  restoreFetch();
});

test("A-10 NOT_IN_PROFILE: cuenta de otra plataforma -> not_in_profile", async () => {
  mockAccounts([{ _id: "acc-fb", platform: "facebook", isActive: true }]);
  const r = await new ZernioSyncHandler("apikey", repo([enlace("facebook", "acc-fb")])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("not_in_profile");
  restoreFetch();
});

test("G-10 R20: cuenta de OTRO tenant (id no enlazado) -> not_in_profile, jamas connected", async () => {
  mockAccounts([{ _id: "acc-ajena", platform: "instagram", username: "@otroNegocio", isActive: true }]);
  const r = await new ZernioSyncHandler("apikey", repo([enlace("instagram", "acc-ig")])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("not_in_profile");
  restoreFetch();
});

test("G-10b tenant sin enlaces -> not_in_profile aunque Zernio tenga cuentas", async () => {
  mockAccounts([{ _id: "acc-ig", platform: "instagram", isActive: true }]);
  const r = await new ZernioSyncHandler("apikey", repo([])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("not_in_profile");
  restoreFetch();
});

test("platform invalida -> platform_invalida sin llamar a Zernio", async () => {
  const fn = mockAccounts([]);
  const r = await new ZernioSyncHandler("apikey", repo([])).ejecutar("t1", "myspace");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("platform_invalida");
  expect(fn).not.toHaveBeenCalled();
  restoreFetch();
});

test("zernio http error -> zernio_error", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
  const r = await new ZernioSyncHandler("apikey", repo([enlace("instagram", "acc-ig")])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("zernio_error");
  restoreFetch();
});

test("repo falla -> persistence_error antes de llamar a Zernio", async () => {
  const fn = mockAccounts([]);
  const r = await new ZernioSyncHandler("apikey", repo([], true)).ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("persistence_error");
  expect(fn).not.toHaveBeenCalled();
  restoreFetch();
});

test("followersCount ausente -> null; isActive false -> awaiting", async () => {
  mockAccounts([{ _id: "acc-ig", platform: "instagram", isActive: false }]);
  const r = await new ZernioSyncHandler("apikey", repo([enlace("instagram", "acc-ig")])).ejecutar("t1", "instagram");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.followersCount).toBeNull(); expect(r.value.status).toBe("awaiting"); }
  restoreFetch();
});
