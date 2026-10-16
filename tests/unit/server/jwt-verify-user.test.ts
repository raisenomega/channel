/**
 * HUB by Raisen — Hotfix G: parsearUserClaimsSinTenant + requireUserAuth (D3) y regresion de parsearJwtClaims.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { parsearUserClaimsSinTenant } from "../../../src/server/jwt-verify-user.ts";
import { parsearJwtClaims } from "../../../src/server/jwt-verify.ts";
import { requireUserAuth, requireTenantAuth } from "../../../src/server/auth-helpers.ts";
import type { HttpResponse, RequestContext } from "../../../src/server/server-types.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(claims: Record<string, unknown>, exp: string | number = "1h"): Promise<string> {
  const t = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setExpirationTime(exp).sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
const ctx = (authorization?: string): RequestContext => ({
  method: "POST", path: "/tenants", headers: authorization ? { authorization } : {}, body: null, rawBody: null, jwt: null, params: Object.freeze({}),
});

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); });
afterEach(() => { vi.unstubAllEnvs(); });

test("G-01 JWT sin tenant_id -> ok con tenantId null (usuario nuevo puede autenticarse)", async () => {
  const r = await parsearUserClaimsSinTenant(await bearer({ sub: "user-nuevo", email: "n@x.pr" }));
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.userId).toBe("user-nuevo"); expect(r.value.tenantId).toBeNull(); expect(r.value.email).toBe("n@x.pr"); expect(Object.isFrozen(r.value)).toBe(true); }
});

test("G-01b el mismo JWT sin tenant_id sigue siendo rechazado por parsearJwtClaims (rutas /tenants/:id)", async () => {
  const r = await parsearJwtClaims(await bearer({ sub: "user-nuevo" }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toEqual({ kind: "claims_faltantes", campo: "tenant_id" });
});

test("G-02 JWT sin sub -> claims_faltantes sub (no se acepta token anonimo)", async () => {
  const r = await parsearUserClaimsSinTenant(await bearer({ tenant_id: "t1" }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toEqual({ kind: "claims_faltantes", campo: "sub" });
});

test("G-02b tenant_id en app_metadata se propaga en ambos parsers", async () => {
  const auth = await bearer({ sub: "u1", app_metadata: { tenant_id: "t-meta" } });
  const user = await parsearUserClaimsSinTenant(auth);
  const tenant = await parsearJwtClaims(auth);
  expect(user.ok && user.value.tenantId).toBe("t-meta");
  expect(tenant.ok && tenant.value.tenantId).toBe("t-meta");
});

test("G-03a requireUserAuth sin header -> 401 token_ausente; expirado -> 401 token_expirado; firma mala -> 401", async () => {
  const sin = await requireUserAuth(ctx());
  expect(!sin.ok && (sin.error as HttpResponse).status).toBe(401);
  const past = Math.floor(Date.now() / 1000) - 60;
  const exp = await requireUserAuth(ctx(await bearer({ sub: "u1" }, past)));
  expect(!exp.ok && JSON.parse((exp.error as HttpResponse).body).error.kind).toBe("token_expirado");
  const mala = await requireUserAuth(ctx("Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.AAAA"));
  expect(!mala.ok && JSON.parse((mala.error as HttpResponse).body).error.kind).toBe("firma_invalida");
});

test("G-03b sin SUPABASE_JWT_SECRET -> 500 config_incompleta en requireUserAuth y requireTenantAuth (sintoma visto en prod)", async () => {
  const auth = await bearer({ sub: "u1", tenant_id: "t1" });
  vi.stubEnv("SUPABASE_JWT_SECRET", "");
  const u = await requireUserAuth(ctx(auth));
  const t = await requireTenantAuth(ctx(auth), "t1");
  expect(!u.ok && (u.error as HttpResponse).status).toBe(500);
  expect(!t.ok && (t.error as HttpResponse).status).toBe(500);
});
