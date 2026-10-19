/**
 * HUB by Raisen — PATCH /tenants/:id/channels/:platform {connected} (toggle conectado/desconectado).
 * Apagar -> actualizarEstado 'disconnected'; encender -> 'connected'. Scope-safe (403 cross-tenant).
 * JWT HS256 (pasa por el fallback de Q). Repo mockeado (sin DB).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaToggleCanal } from "../../../src/channels/presentation/routes/channel-toggle.routes.ts";
import type { ChannelConnectionsRepo } from "../../../src/channels/infrastructure/channel-connections.repository.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
beforeEach(() => vi.stubEnv("SUPABASE_JWT_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "u-1", tenant_id: tenantId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(id: string, platform: string, body: unknown, authorization: string): RequestContext {
  return { method: "PATCH", path: `/tenants/${id}/channels/${platform}`, headers: { authorization }, body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({ id, platform }) } as RequestContext;
}
function repo(): ChannelConnectionsRepo {
  return { actualizarEstado: vi.fn(async () => ({ ok: true as const, value: undefined })) } as unknown as ChannelConnectionsRepo;
}
const estadoMock = (r: ChannelConnectionsRepo) => (r as unknown as { actualizarEstado: ReturnType<typeof vi.fn> }).actualizarEstado;
const status = (x: unknown) => (x as { status?: number }).status;

test("toggle OFF (connected:false) -> actualizarEstado 'disconnected'", async () => {
  const r = repo();
  const res = await rutaToggleCanal(r).handler(ctx("t-1", "facebook", { connected: false }, await bearer("t-1")));
  expect(estadoMock(r).mock.calls[0]).toEqual(["t-1", "facebook", "disconnected"]);
  expect(JSON.stringify(res)).toContain("disconnected");
});

test("toggle ON (connected:true) -> actualizarEstado 'connected' (sin re-OAuth)", async () => {
  const r = repo();
  await rutaToggleCanal(r).handler(ctx("t-1", "instagram", { connected: true }, await bearer("t-1")));
  expect(estadoMock(r).mock.calls[0]).toEqual(["t-1", "instagram", "connected"]);
});

test("cross-tenant -> 403, NO toca el repo", async () => {
  const r = repo();
  const res = await rutaToggleCanal(r).handler(ctx("t-OTRO", "facebook", { connected: false }, await bearer("t-1")));
  expect(status(res)).toBe(403);
  expect(estadoMock(r).mock.calls.length).toBe(0);
});
