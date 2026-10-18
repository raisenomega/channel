/**
 * HUB by Raisen — S-3 (Compuerta #97): el POST /tenants usa el email del JWT autenticado como
 * fuente de verdad e IGNORA body.email (spoofeable via DevTools). A-S-3-1: token.email != body.email
 * -> la fila owner se inserta con el email del token. A-S-3-2: sin email en token -> fallback a body.
 * Mock de supabase.client (captura el row insertado de users).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({ inserts: [] as Array<{ table: string; row: Record<string, unknown> }> }));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  let tabla = "";
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: (t: string) => { tabla = t; return chain; },
    select: self, eq: self, order: self, limit: self,
    single: async () => ({ data: null, error: { code: "PGRST116", message: "no rows" } }),
    insert: async (row: Record<string, unknown>) => { db.inserts.push({ table: tabla, row }); return { data: null, error: null }; },
    update: () => ({ eq: async () => ({ data: null, error: null }) }),
  });
  return { supabase: Object.assign(chain, { auth: { admin: { updateUserById: async () => ({ data: {}, error: null }) } } }) };
});
import { rutaCrearTenant } from "../../../src/identity/presentation/tenants.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(claims: Record<string, unknown>): Promise<string> {
  const t = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(body: unknown, authorization: string): RequestContext {
  return { method: "POST", path: "/tenants", headers: { authorization }, body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({}) };
}
async function call(body: unknown, claims: Record<string, unknown>): Promise<{ status: number; owner: Record<string, unknown> }> {
  const r = await rutaCrearTenant().handler(ctx(body, await bearer(claims))) as HttpResponse;
  return { status: r.status ?? 200, owner: db.inserts.find((i) => i.table === "users")?.row ?? {} };
}
const BASE = { name: "Raisen.dev", phone: "+17871234567" };

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.inserts.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-S-3-1: body.email spoofeado != token.email -> fila owner usa el email del TOKEN", async () => {
  const { status, owner } = await call(
    { ...BASE, email: "atacante@evil.com" },
    { sub: "user-nuevo", email: "real@raisen.dev" },
  );
  expect(status).toBe(201);
  expect(owner["email"]).toBe("real@raisen.dev");
  expect(owner["email"]).not.toBe("atacante@evil.com");
});

test("A-S-3-2: token sin email -> fallback a body.email (compat chicken-and-egg)", async () => {
  const { status, owner } = await call({ ...BASE, email: "owner@raisen.dev" }, { sub: "user-nuevo" });
  expect(status).toBe(201);
  expect(owner["email"]).toBe("owner@raisen.dev");
});
