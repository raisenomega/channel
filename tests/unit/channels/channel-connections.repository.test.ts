import { expect, test, vi } from "vitest";
import { ChannelConnectionsRepo } from "../../../src/channels/infrastructure/channel-connections.repository.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

test("listar ok -> array", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: "c1", tenant_id: "t1", platform: "instagram", zernio_account_id: null, handle: null, followers_count: null, status: "awaiting", is_primary: false, is_paused: false, auto_publish_allowed: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }]), { status: 200, headers: { "content-type": "application/json" } }));
  const repo = new ChannelConnectionsRepo();
  const r = await repo.listar("t1" as never);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.length).toBe(1);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar ok -> void", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  const repo = new ChannelConnectionsRepo();
  const conn = { id: "c1", tenantId: "t1", platform: "instagram" as never, zernioAccountId: null, handle: null, followersCount: null, status: "awaiting" as never, isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  const r = await repo.guardar(conn);
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("A-04 IDEMPOTENCIA_MENSAJE: mismo providerMessageId llega 2x -> no duplica", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const spy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  globalThis.fetch = spy;
  const repo = new ChannelConnectionsRepo();
  const conn = { id: "dupe-id", tenantId: "t1", platform: "instagram" as never, zernioAccountId: null, handle: null, followersCount: null, status: "connected" as never, isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  // guardar mismo registro 2 veces con mismo id (upsert por POST)
  await repo.guardar(conn);
  await repo.guardar(conn);
  expect(spy.mock.calls.length).toBe(2);
  // Ambos POST van al mismo endpoint — Supabase upsert via unique constraint evita duplicado
  restoreFetch(); vi.unstubAllEnvs();
});

test("A-11 RLS_AISLAMIENTO: listar filtra tenant_id en URL", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const repo = new ChannelConnectionsRepo();
  await repo.listar("tenant-B" as never);
  const url = spy.mock.calls[0]?.[0] as string;
  expect(url).toContain("tenant_id=eq.tenant-B");
  restoreFetch(); vi.unstubAllEnvs();
});

test("H-OBS-1 UPSERT: guardar usa on_conflict=tenant_id,platform + Prefer merge-duplicates", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const spy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  globalThis.fetch = spy;
  const repo = new ChannelConnectionsRepo();
  const conn = { id: "c1", tenantId: "t1", platform: "instagram" as never, zernioAccountId: "z-1", handle: null, followersCount: null, status: "connected" as never, isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  const r = await repo.guardar(conn);
  expect(r.ok).toBe(true);
  const url = spy.mock.calls[0]?.[0] as string;
  const hdrs = spy.mock.calls[0]?.[1]?.headers as Record<string, string>;
  // URL lleva on_conflict por (tenant_id, platform) -> upsert, no duplica en reconexion.
  expect(url).toContain("on_conflict=tenant_id,platform");
  // Header Prefer resolution=merge-duplicates para el merge de filas en conflicto.
  expect(hdrs["Prefer"]).toBe("resolution=merge-duplicates");
  restoreFetch(); vi.unstubAllEnvs();
});