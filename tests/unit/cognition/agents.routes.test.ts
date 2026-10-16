/**
 * HUB by Raisen — Hotfix F-urgente: adversariales A-04..A-06 GET /tenants/:id/agents/status.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, filtros: [] as unknown[] }));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: self, select: self, order: self, limit: self,
    eq: (col: string, val: unknown) => { db.filtros.push([col, val]); return chain; },
    then: (resolve: (v: unknown) => void) => resolve({ data: db.rows, error: null }),
  });
  return { supabase: chain };
});
import { rutaAgentStatus } from "../../../src/cognition/presentation/agents.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "user-1", tenant_id: tenantId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(pathTenant: string, authorization?: string): RequestContext {
  return {
    method: "GET", path: `/tenants/${pathTenant}/agents/status`, headers: authorization ? { authorization } : {},
    body: null, rawBody: null, jwt: null, params: Object.freeze({ id: pathTenant }),
  };
}
type AgentsOk = { ok: boolean; agents: Array<{ name: string; online: boolean }> };

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.rows = []; db.filtros = []; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-04 GET_AGENTS_SIN_JWT_401: sin token -> 401 token_ausente y sin query a la DB", async () => {
  const r = await rutaAgentStatus().handler(ctx("tenant-1")) as HttpResponse;
  expect(r.status).toBe(401);
  expect(JSON.parse(r.body).error.kind).toBe("token_ausente");
  expect(db.filtros).toHaveLength(0);
});

test("A-05 GET_AGENTS_TENANT_MISMATCH_403: JWT de tenant-1 pidiendo tenant-2 -> 403 tenant_mismatch, sin query", async () => {
  const r = await rutaAgentStatus().handler(ctx("tenant-2", await bearer("tenant-1"))) as HttpResponse;
  expect(r.status).toBe(403);
  expect(JSON.parse(r.body).error.kind).toBe("tenant_mismatch");
  expect(db.filtros).toHaveLength(0);
});

test("A-06 GET_AGENTS_TENANT_MATCH_200: match -> 7 agentes, filtro tenant_id del CLAIM, thao online", async () => {
  db.rows = [{ agent_name: "thao", created_at: "2026-10-16T12:00:00Z" }];
  const r = await rutaAgentStatus().handler(ctx("tenant-1", await bearer("tenant-1"))) as AgentsOk;
  expect(r.ok).toBe(true);
  expect(r.agents).toHaveLength(7);
  expect(r.agents.find((a) => a.name === "thao")?.online).toBe(true);
  expect(r.agents.filter((a) => a.online)).toHaveLength(1);
  expect(db.filtros).toEqual([["tenant_id", "tenant-1"]]);
});
