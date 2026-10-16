import { expect, test, vi } from "vitest";
import { ZernioSyncHandler } from "../../../src/channels/application/zernio-sync.handler.ts";
import { ChannelConnectionsRepo } from "../../../src/channels/infrastructure/channel-connections.repository.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const dummyRepo: ChannelConnectionsRepo = { listar: async () => ok([]), guardar: async () => ok(undefined) } as unknown as ChannelConnectionsRepo;
const handler = new ZernioSyncHandler("apikey", dummyRepo);

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

function mockConnected(items: Array<{ platform: string; status?: string; handle?: string; followers_count?: number }>) {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items }), { status: 200, headers: { "content-type": "application/json" } }));
}

test("happy: cuenta en profile -> connected + handle", async () => {
  mockConnected([{ platform: "instagram", status: "connected", handle: "@miNegocio", followers_count: 1200 }]);
  const r = await handler.ejecutar("t1", "instagram");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.status).toBe("connected"); expect(r.value.handle).toBe("@miNegocio"); expect(r.value.followersCount).toBe(1200); }
  restoreFetch();
});

test("A-10 NOT_IN_PROFILE: cuenta no esta en profile -> not_in_profile", async () => {
  mockConnected([{ platform: "facebook", status: "connected" }]);
  const r = await handler.ejecutar("t1", "instagram");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("not_in_profile");
  restoreFetch();
});

test("platform invalida -> platform_invalida", async () => {
  const r = await handler.ejecutar("t1", "myspace");
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

test("followersCount null -> se propaga null", async () => {
  mockConnected([{ platform: "instagram", status: "connected" }]);
  const r = await handler.ejecutar("t1", "instagram");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.followersCount).toBeNull();
  restoreFetch();
});

test("cuenta en connected -> status connected + handle", async () => {
  mockConnected([{ platform: "facebook", status: "connected", handle: "@miPagina" }]);
  const r = await handler.ejecutar("t1", "facebook");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.status).toBe("connected"); expect(r.value.handle).toBe("@miPagina"); }
  restoreFetch();
});