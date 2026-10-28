/**
 * HUB by Raisen — Hotfix F-urgente: adversariales A-07..A-09 GET /tenants/:id/activity/recent.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";

const db = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, filtros: [] as unknown[] }));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: self, select: self, order: self, limit: self, neq: self,
    eq: (col: string, val: unknown) => { db.filtros.push([col, val]); return chain; },
    then: (resolve: (v: unknown) => void) => resolve({ data: db.rows, error: null }),
  });
  return { supabase: chain };
});
import { rutaRecentActivity } from "../../../src/notifications/presentation/activity.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(tenantId: string, exp: string | number = "1h"): Promise<string> {
  const t = await new SignJWT({ sub: "user-1", tenant_id: tenantId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp).sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(pathTenant: string, authorization?: string): RequestContext {
  return {
    method: "GET", path: `/tenants/${pathTenant}/activity/recent`, headers: authorization ? { authorization } : {},
    body: null, rawBody: null, jwt: null, params: Object.freeze({ id: pathTenant }),
  };
}
type EventsOk = { ok: boolean; events: Array<Record<string, string>> };

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); db.rows = []; db.filtros = []; });
afterEach(() => { vi.unstubAllEnvs(); });

test("A-07 GET_ACTIVITY_SIN_JWT_401: sin token -> 401, sin query", async () => {
  const r = await rutaRecentActivity().handler(ctx("tenant-1")) as HttpResponse;
  expect(r.status).toBe(401);
  expect(JSON.parse(r.body).error.kind).toBe("token_ausente");
  expect(db.filtros).toHaveLength(0);
});

test("A-07b token expirado -> 401 token_expirado", async () => {
  const past = Math.floor(Date.now() / 1000) - 60;
  const r = await rutaRecentActivity().handler(ctx("tenant-1", await bearer("tenant-1", past))) as HttpResponse;
  expect(r.status).toBe(401);
  expect(JSON.parse(r.body).error.kind).toBe("token_expirado");
});

test("A-08 GET_ACTIVITY_TENANT_MISMATCH_403: JWT tenant-1 pide tenant-2 -> 403, sin query (R20 cero cross-tenant)", async () => {
  db.rows = [{ id: "e1", event_type: "x", label: "secreto de tenant-2", created_at: "2026-10-16T00:00:00Z" }];
  const r = await rutaRecentActivity().handler(ctx("tenant-2", await bearer("tenant-1"))) as HttpResponse;
  expect(r.status).toBe(403);
  expect(r.body).not.toContain("secreto de tenant-2");
  expect(db.filtros).toHaveLength(0);
});

test("A-09 GET_ACTIVITY_TENANT_MATCH_200: match -> eventos mapeados, filtro tenant_id del CLAIM", async () => {
  db.rows = [{ id: "e1", event_type: "draft", label: "Thao genero draft", created_at: "2026-10-16T00:00:00Z" }];
  const r = await rutaRecentActivity().handler(ctx("tenant-1", await bearer("tenant-1"))) as EventsOk;
  expect(r.ok).toBe(true);
  expect(r.events).toEqual([{ id: "e1", type: "draft", label: "Thao genero draft", timestamp: "2026-10-16T00:00:00Z", conversationId: null, consultaId: null, agentSlug: null }]);
  expect(db.filtros).toEqual([["tenant_id", "tenant-1"]]);
});

test("A-09b metadata.conversationId se mapea al evento (para abrir la conversacion desde la card)", async () => {
  db.rows = [{ id: "e2", event_type: "escalation", label: "Escalacion a humano", created_at: "2026-10-16T00:00:00Z", metadata: { conversationId: "conv-9" } }];
  const r = await rutaRecentActivity().handler(ctx("tenant-1", await bearer("tenant-1"))) as EventsOk;
  expect(r.events[0]).toMatchObject({ type: "escalation", conversationId: "conv-9" });
});
