/**
 * HUB by Raisen — Hotfix G (G-05): drafts.routes con requireTenantAuth.
 * Regresion: antes extractJwt+parsearJwtClaims eran incompatibles y la ruta denegaba SIEMPRE.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaDraftsPending, rutaDraftsReject } from "../../../src/cognition/presentation/drafts.routes.ts";
import type { DraftsDeps } from "../../../src/cognition/presentation/drafts.routes.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "u1", tenant_id: tenantId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
const llamadas: string[] = [];
const deps = {
  repo: { listarPendientes: async (tid: string) => { llamadas.push(tid); return ok([{ id: "d1" }]); } },
  approve: {}, reject: { ejecutar: async () => ok({ id: "d1", status: "rejected" }) }, send: {}, feedback: {},
} as unknown as DraftsDeps;
function ctx(method: "GET" | "POST", path: string, params: Record<string, string>, authorization?: string, body: unknown = null): RequestContext {
  return { method, path, headers: authorization ? { authorization } : {}, body, rawBody: null, jwt: null, params: Object.freeze(params) };
}

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); llamadas.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

test("G-05 REGRESION: header Bearer real valido -> la ruta YA NO deniega; lista pendientes del tenant del claim", async () => {
  const r = await rutaDraftsPending(deps).handler(ctx("GET", "/tenants/t1/drafts/pending", { id: "t1" }, await bearer("t1"))) as { ok: boolean; drafts: unknown[] };
  expect(r.ok).toBe(true);
  expect(r.drafts).toHaveLength(1);
  expect(llamadas).toEqual(["t1"]);
});

test("G-05b sin header -> 401 token_ausente como HttpResponse, sin tocar el repo", async () => {
  const r = await rutaDraftsPending(deps).handler(ctx("GET", "/tenants/t1/drafts/pending", { id: "t1" })) as HttpResponse;
  expect(r.status).toBe(401);
  expect(JSON.parse(r.body).error.kind).toBe("token_ausente");
  expect(llamadas).toEqual([]);
});

test("G-05c R20: JWT de t1 pidiendo drafts de t2 -> 403 tenant_mismatch, sin tocar el repo", async () => {
  const r = await rutaDraftsPending(deps).handler(ctx("GET", "/tenants/t2/drafts/pending", { id: "t2" }, await bearer("t1"))) as HttpResponse;
  expect(r.status).toBe(403);
  expect(JSON.parse(r.body).error.kind).toBe("tenant_mismatch");
  expect(llamadas).toEqual([]);
});

test("G-05d reject con JWT valido y razon corta -> 400 reason_too_short (la logica de negocio corre tras auth)", async () => {
  const r = await rutaDraftsReject(deps).handler(ctx("POST", "/tenants/t1/drafts/d1/reject", { id: "t1", draftId: "d1" }, await bearer("t1"), { reason: "corta" })) as { status?: number; error: { kind: string } };
  expect(r.status).toBe(400);
  expect(r.error.kind).toBe("reason_too_short");
});
