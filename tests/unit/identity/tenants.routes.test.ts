/**
 * HUB by Raisen — POST /tenants: Hotfix F (A-01..A-03) + Hotfix G (chicken-and-egg D3, 1 tenant/usuario D1).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  updates: [] as Array<{ table: string; patch: Record<string, unknown> }>,
  usersRow: null as Record<string, unknown> | null,
  adminCalls: [] as Array<{ userId: string; attrs: Record<string, unknown> }>,
}));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  let tabla = "";
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: (t: string) => { tabla = t; return chain; },
    select: self, eq: self, order: self, limit: self,
    single: async () => db.usersRow ? { data: db.usersRow, error: null } : { data: null, error: { code: "PGRST116", message: "no rows" } },
    insert: async (row: Record<string, unknown>) => { db.inserts.push({ table: tabla, row }); return { data: null, error: null }; },
    update: (patch: Record<string, unknown>) => { db.updates.push({ table: tabla, patch }); return { eq: async () => ({ data: null, error: null }) }; },
  });
  const auth = { admin: { updateUserById: async (userId: string, attrs: Record<string, unknown>) => { db.adminCalls.push({ userId, attrs }); return { data: {}, error: null }; } } };
  return { supabase: Object.assign(chain, { auth }) };
});
import { rutaCrearTenant } from "../../../src/identity/presentation/tenants.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
const OTHER_SECRET = "otro-secret-distinto-largo-32-chars-minimo";

async function sign(claims: Record<string, unknown>, secret: string): Promise<string> {
  const t = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  return `Bearer ${t}`;
}
const bearerConTenant = (): Promise<string> => sign({ sub: "user-1", tenant_id: "tenant-1" }, SECRET);
const bearerSinTenant = (): Promise<string> => sign({ sub: "user-nuevo" }, SECRET);

function ctx(body: unknown, authorization?: string): RequestContext {
  return {
    method: "POST", path: "/tenants", headers: authorization ? { authorization } : {},
    body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({}),
  };
}
async function call(body: unknown, authorization?: string): Promise<{ status: number; json: Record<string, unknown> }> {
  const r = await rutaCrearTenant().handler(ctx(body, authorization)) as HttpResponse;
  return { status: r.status ?? 200, json: JSON.parse(r.body) as Record<string, unknown> };
}
const kind = (j: Record<string, unknown>): string => (j["error"] as { kind: string }).kind;
const BODY_OK = { name: "Zafacones Ramos", email: "owner@zafacones.pr", phone: "+17871234567" };

beforeEach(() => {
  vi.stubEnv("SUPABASE_JWT_SECRET", SECRET);
  db.inserts.length = 0; db.updates.length = 0; db.adminCalls.length = 0; db.usersRow = null;
});
afterEach(() => { vi.unstubAllEnvs(); });

test("A-01 POST_TENANTS_SIN_JWT_401: sin Authorization -> 401 token_ausente y NO toca la DB", async () => {
  const r = await call(BODY_OK);
  expect(r.status).toBe(401);
  expect(kind(r.json)).toBe("token_ausente");
  expect(db.inserts).toHaveLength(0);
});

test("A-01b firma invalida -> 401 firma_invalida, sin insert", async () => {
  const r = await call(BODY_OK, await sign({ sub: "u" }, OTHER_SECRET));
  expect(r.status).toBe(401);
  expect(kind(r.json)).toBe("firma_invalida");
  expect(db.inserts).toHaveLength(0);
});

test("A-02 POST_TENANTS_BODY_INCOMPLETO_400: body {} con JWT valido -> 400 campos_incompletos (NO 200)", async () => {
  const r = await call({}, await bearerConTenant());
  expect(r.status).toBe(400);
  expect(kind(r.json)).toBe("campos_incompletos");
  expect(db.inserts).toHaveLength(0);
});

test("G-03 CHICKEN_AND_EGG: JWT valido SIN tenant_id (usuario nuevo) -> 201 y app_metadata.tenant_id escrito", async () => {
  const r = await call(BODY_OK, await bearerSinTenant());
  expect(r.status).toBe(201);
  expect(String(r.json["id"])).toMatch(/^[0-9a-f-]{36}$/);
  expect(db.inserts.map((i) => i.table)).toEqual(["tenants", "users"]);
  const owner = db.inserts[1]!.row;
  expect(owner["id"]).toBe("user-nuevo");
  expect(owner["role"]).toBe("owner");
  expect(owner["tenant_id"]).toBe(r.json["id"]);
  expect(db.adminCalls).toEqual([{ userId: "user-nuevo", attrs: { app_metadata: { tenant_id: r.json["id"] } } }]);
});

test("G-04 UN_TENANT_POR_USUARIO: users.tenant_id ya existe -> 409 tenant_ya_existe, sin insert", async () => {
  db.usersRow = { id: "user-1", tenant_id: "tenant-1", email: "owner@zafacones.pr", role: "owner", is_active: true, created_at: "2026-10-16T00:00:00Z" };
  const r = await call(BODY_OK, await bearerConTenant());
  expect(r.status).toBe(409);
  expect(kind(r.json)).toBe("tenant_ya_existe");
  expect(db.inserts).toHaveLength(0);
  expect(db.adminCalls).toHaveLength(0);
});

test("G-04b fila users existente SIN tenant -> se enlaza con update (no insert duplicado) -> 201", async () => {
  db.usersRow = { id: "user-nuevo", tenant_id: null, email: "owner@zafacones.pr", role: "agent", is_active: true, created_at: "2026-10-16T00:00:00Z" };
  const r = await call(BODY_OK, await bearerSinTenant());
  expect(r.status).toBe(201);
  expect(db.inserts.map((i) => i.table)).toEqual(["tenants"]);
  expect(db.updates).toEqual([{ table: "users", patch: { tenant_id: r.json["id"], role: "owner" } }]);
});
