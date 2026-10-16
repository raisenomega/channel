/**
 * HUB by Raisen — Hotfix F-urgente: adversariales A-01..A-03 POST /tenants (Compuerta #17).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({ inserts: [] as unknown[] }));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: self, select: self, eq: self, order: self, limit: self,
    insert: async (row: unknown) => { db.inserts.push(row); return { data: null, error: null }; },
  });
  return { supabase: chain };
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
const bearer = (): Promise<string> => sign({ sub: "user-1", tenant_id: "tenant-1" }, SECRET);

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

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.inserts.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-01 POST_TENANTS_SIN_JWT_401: sin Authorization -> 401 token_ausente y NO toca la DB", async () => {
  const r = await call(BODY_OK);
  expect(r.status).toBe(401);
  expect(kind(r.json)).toBe("token_ausente");
  expect(db.inserts).toHaveLength(0);
});

test("A-01b firma invalida -> 401 firma_invalida (ni 200 ni 500), sin insert", async () => {
  const r = await call(BODY_OK, await sign({ sub: "u", tenant_id: "t" }, OTHER_SECRET));
  expect(r.status).toBe(401);
  expect(kind(r.json)).toBe("firma_invalida");
  expect(db.inserts).toHaveLength(0);
});

test("A-02 POST_TENANTS_BODY_INCOMPLETO_400: body {} con JWT valido -> 400 campos_incompletos (NO 200)", async () => {
  const r = await call({}, await bearer());
  expect(r.status).toBe(400);
  expect(r.json["ok"]).toBe(false);
  expect(kind(r.json)).toBe("campos_incompletos");
  expect(db.inserts).toHaveLength(0);
});

test("A-02b body null (sin JSON parseable) -> 400, sin crash", async () => {
  const r = await call(null, await bearer());
  expect(r.status).toBe(400);
  expect(kind(r.json)).toBe("campos_incompletos");
});

test("A-03 POST_TENANTS_HAPPY_201: JWT valido + body completo -> 201, id uuid, primary_phone, 1 insert en tenants", async () => {
  const r = await call({ ...BODY_OK, primary_phone: "+17879990000" }, await bearer());
  expect(r.status).toBe(201);
  expect(r.json["ok"]).toBe(true);
  expect(String(r.json["id"])).toMatch(/^[0-9a-f-]{36}$/);
  expect(r.json["primary_phone"]).toBe("+17879990000");
  expect(db.inserts).toHaveLength(1);
  expect((db.inserts[0] as { slug: string }).slug).toBe("zafacones-ramos");
});
