/**
 * HUB by Raisen — S-6 (Compuerta #100): el POST /tenants persiste el perfil del negocio saneado
 * en el INSERT (A-S-5-2: brand_tone valido se guarda; A-S-5-4: columnas quedan en la fila para
 * feed de CEREBRO). Defensa en profundidad: un brand_tone invalido se OMITE (NULL), nunca viola
 * el CHECK de 052. Vacios omitidos. Mock de supabase.client (captura el row insertado).
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
async function bearer(): Promise<string> {
  const t = await new SignJWT({ sub: "user-nuevo" }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(body: unknown, authorization: string): RequestContext {
  return { method: "POST", path: "/tenants", headers: { authorization }, body, rawBody: JSON.stringify(body), jwt: null, params: Object.freeze({}) };
}
async function call(body: unknown): Promise<{ status: number; row: Record<string, unknown> }> {
  const r = await rutaCrearTenant().handler(ctx(body, await bearer())) as HttpResponse;
  return { status: r.status ?? 200, row: db.inserts.find((i) => i.table === "tenants")?.row ?? {} };
}
const BASE = { name: "Zafacones Ramos", email: "owner@zafacones.pr", phone: "+17871234567" };

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.inserts.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-S-5-2: brand_tone='casual' valido + datos fisicos/fiscales -> se persisten en el insert", async () => {
  const { status, row } = await call({ ...BASE, brand_tone: "casual", street: "Calle 1", legal_name: "Zafacones LLC", brand_mission: "Reciclar PR" });
  expect(status).toBe(201);
  expect(row["brand_tone"]).toBe("casual");
  expect(row["street"]).toBe("Calle 1");
  expect(row["legal_name"]).toBe("Zafacones LLC");
  expect(row["brand_mission"]).toBe("Reciclar PR");
});

test("A-S-5-3: campos de perfil ausentes -> NO aparecen en el insert (NULL en DB, opcional)", async () => {
  const { row } = await call(BASE);
  for (const col of ["brand_tone", "street", "legal_name", "brand_mission", "expected_response_sla"]) {
    expect(row[col]).toBeUndefined();
  }
});

test("A-S-5-1 (defensa app): brand_tone='random' invalido -> OMITIDO del insert (nunca viola el CHECK)", async () => {
  const { status, row } = await call({ ...BASE, brand_tone: "random", expected_response_sla: "manana" });
  expect(status).toBe(201);
  expect(row["brand_tone"]).toBeUndefined();
  expect(row["expected_response_sla"]).toBeUndefined();
});

test("A-S-5-4: SLA valido + servicios se persisten para feed de CEREBRO", async () => {
  const { row } = await call({ ...BASE, expected_response_sla: "<4h", brand_services: "Venta de recipientes" });
  expect(row["expected_response_sla"]).toBe("<4h");
  expect(row["brand_services"]).toBe("Venta de recipientes");
});
