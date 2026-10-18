/**
 * HUB by Raisen — S-10: PATCH /tenants/:id extendido a editar datos del negocio (name + perfil),
 * ademas del phone (R-3/R-4). Scope-safe (requireTenantAuth). A-S-10 edit: name + brand voice se
 * mandan a actualizarPerfil (saneado); phone opcional; enum invalido omitido. JWT HS256 (fallback Q).
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
    actualizarPerfil: vi.fn(async () => ({ ok: true as const, value: undefined })),
    ...over,
  };
}
const status = (r: unknown) => (r as { status: number }).status;
const perfilMock = (d: TenantUpdateDeps) => d.actualizarPerfil as ReturnType<typeof vi.fn>;
const phoneMock = (d: TenantUpdateDeps) => d.actualizarTelefono as ReturnType<typeof vi.fn>;

test("A-S-10-edit-1: PATCH con name + brand voice (sin phone) -> 200, actualizarPerfil con cols saneadas, phone NO llamado", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { name: "Raisen.dev", brand_tone: "profesional", brand_mission: "Servir PyMEs", street: "Calle 2" }, await bearer("t-1")));
  expect(status(r)).toBe(200);
  expect(phoneMock(d).mock.calls.length).toBe(0);
  expect(perfilMock(d).mock.calls[0]).toEqual(["t-1", { brand_tone: "profesional", brand_mission: "Servir PyMEs", street: "Calle 2", name: "Raisen.dev" }]);
});

test("A-S-10-edit-2: enum invalido (brand_tone='x') se OMITE; name+phone persisten", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { name: "Zafacones", phone: "+17875551234", brand_tone: "x" }, await bearer("t-1")));
  expect(status(r)).toBe(200);
  expect(phoneMock(d).mock.calls[0]).toEqual(["t-1", "+17875551234"]);
  expect(perfilMock(d).mock.calls[0]).toEqual(["t-1", { name: "Zafacones" }]);
});

test("A-S-10-edit-3: body sin name ni perfil (solo phone) -> actualizarPerfil NO se llama (R-3 flow intacto)", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-1", { phone: "+17875551234" }, await bearer("t-1")));
  expect(status(r)).toBe(200);
  expect(perfilMock(d).mock.calls.length).toBe(0);
  expect(JSON.parse((r as { body: string }).body)).toEqual({ ok: true, id: "t-1", phone: "+17875551234" });
});

test("A-S-10-edit-4: cross-tenant sigue 403 (scope anchor intacto)", async () => {
  const d = deps();
  const r = await rutaActualizarTenant(d).handler(ctx("t-OTRO", { name: "x" }, await bearer("t-1")));
  expect(status(r)).toBe(403);
  expect(perfilMock(d).mock.calls.length).toBe(0);
});
