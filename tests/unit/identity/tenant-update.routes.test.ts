/**
 * HUB by Raisen — R-3/R-4 adversariales A-R-3-1..4 de PATCH /tenants/:id (edit-number).
 * requireTenantAuth con :id == claim tenant_id. JWT HS256 firmado (pasa por el fallback de Q).
 * Deps inyectadas (sin DB): valida guard cross-tenant, E.164, y que el scope no se re-emite.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaActualizarTenant, type TenantUpdateDeps } from "../../../src/identity/presentation/tenant-update.routes.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import type { TenantState } from "../../../src/identity/domain/tenant.entity.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
beforeEach(() => vi.stubEnv("SUPABASE_JWT_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "user-1", tenant_id: tenantId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(id: string, body: unknown, authorization: string): RequestContext {
  return { method: "PATCH", path: `/tenants/${id}`, headers: { authorization }, body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({ id }) } as RequestContext;
}
function deps(over: Partial<TenantUpdateDeps> = {}): TenantUpdateDeps {
  return {
    buscar: async () => ({ ok: true as const, value: { id: "t-1", phone: null } as unknown as TenantState }),
    actualizarTelefono: vi.fn(async () => ({ ok: true as const, value: undefined })),
    ...over,
  };
}
const status = (r: unknown) => (r as { status: number }).status;

test("A-R-3-1: user A no puede PATCH el tenant de user B -> 403 tenant_mismatch", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-OTRO", { phone: "+17875551234" }, await bearer("t-1")));
  expect(status(r)).toBe(403);
  expect(JSON.stringify(r)).toContain("tenant_mismatch");
  expect((d.actualizarTelefono as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
});

test("A-R-3-2: phone sin + / no E.164 -> 400 telefono_invalido", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { phone: "7875551234" }, await bearer("t-1")));
  expect(status(r)).toBe(400);
  expect(JSON.stringify(r)).toContain("telefono_invalido");
  expect((d.actualizarTelefono as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
});

test("A-R-3-3: :id en URL == claim pero tenant inexistente -> 404 tenant_not_found", async () => {
  const d = deps({ buscar: async () => ({ ok: true as const, value: null }) });
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { phone: "+17875551234" }, await bearer("t-1")));
  expect(status(r)).toBe(404);
  expect(JSON.stringify(r)).toContain("tenant_not_found");
});

test("A-R-3-4: PATCH exitoso -> 200, persiste phone, NO re-emite token/session/tenant (scope intacto)", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { phone: "+17875551234" }, await bearer("t-1")));
  expect(status(r)).toBe(200);
  expect((d.actualizarTelefono as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["t-1", "+17875551234"]);
  const body = JSON.parse((r as { body: string }).body);
  expect(body).toEqual({ ok: true, id: "t-1", phone: "+17875551234" });
  expect(body).not.toHaveProperty("token");
  expect(body).not.toHaveProperty("session");
  expect(body).not.toHaveProperty("tenant");
});
