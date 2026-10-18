/**
 * HUB by Raisen — S-1 (Compuerta #95) adversariales del fix persistence_failure "tenants_plan_check".
 * El backend inserta `plan` DIRECTO (no via RPC); el route debe blindar runtime contra el CHECK de 050:
 * plan ausente -> default 'esencial'; plan legacy/invalido -> 400 plan_invalido SIN tocar la DB.
 * Mock de supabase.client identico al harness de tenants.routes.test.ts (captura el row insertado).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  usersRow: null as Record<string, unknown> | null,
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
    update: (_patch: Record<string, unknown>) => ({ eq: async () => ({ data: null, error: null }) }),
  });
  const auth = { admin: { updateUserById: async () => ({ data: {}, error: null }) } };
  return { supabase: Object.assign(chain, { auth }) };
});
import { rutaCrearTenant } from "../../../src/identity/presentation/tenants.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearerSinTenant(): Promise<string> {
  const t = await new SignJWT({ sub: "user-nuevo" }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(body: unknown, authorization: string): RequestContext {
  return { method: "POST", path: "/tenants", headers: { authorization }, body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({}) };
}
async function call(body: unknown, authorization: string): Promise<{ status: number; json: Record<string, unknown> }> {
  const r = await rutaCrearTenant().handler(ctx(body, authorization)) as HttpResponse;
  return { status: r.status ?? 200, json: JSON.parse(r.body) as Record<string, unknown> };
}
const kind = (j: Record<string, unknown>): string => (j["error"] as { kind: string }).kind;
const tenantRow = (): Record<string, unknown> => db.inserts.find((i) => i.table === "tenants")!.row;
const BASE = { name: "Raisen.dev", email: "owner@raisen.dev", phone: "+17871234567" };

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.inserts.length = 0; db.usersRow = null; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-S-1-1: POST sin plan en body -> 201 e inserta plan='esencial' (default, nunca lite_*)", async () => {
  const r = await call(BASE, await bearerSinTenant());
  expect(r.status).toBe(201);
  expect(tenantRow()["plan"]).toBe("esencial");
});

test("A-S-1-2: POST con plan legacy 'lite_starter' -> 400 plan_invalido y NO toca la DB", async () => {
  const r = await call({ ...BASE, plan: "lite_starter" }, await bearerSinTenant());
  expect(r.status).toBe(400);
  expect(kind(r.json)).toBe("plan_invalido");
  expect(db.inserts).toHaveLength(0);
});

test("A-S-1-3: POST con plan='esencial' valido -> 201 e inserta ese plan", async () => {
  const r = await call({ ...BASE, plan: "esencial" }, await bearerSinTenant());
  expect(r.status).toBe(201);
  expect(tenantRow()["plan"]).toBe("esencial");
});

test("A-S-1-4: POST con plan='random_invalid' -> 400 plan_invalido sin insert", async () => {
  const r = await call({ ...BASE, plan: "random_invalid" }, await bearerSinTenant());
  expect(r.status).toBe(400);
  expect(kind(r.json)).toBe("plan_invalido");
  expect(db.inserts).toHaveLength(0);
});

test("A-S-1-5: plan valido no-default 'business' -> 201 e inserta 'business' (allow-list completa)", async () => {
  const r = await call({ ...BASE, plan: "business" }, await bearerSinTenant());
  expect(r.status).toBe(201);
  expect(tenantRow()["plan"]).toBe("business");
});
