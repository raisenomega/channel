/**
 * HUB by Raisen — Compuerta #17: autenticacion JWT obligatoria por handler HTTP.
 * requireTenantAuth(ctx, pathTenantId?) verifica firma + resuelve tenant (M-6:
 * claim fast-path -> fallback sub->users.tenant_id inyectado en bootstrap) + match
 * del tenant del path. requireUserAuth(ctx) exige JWT valido sin tenant (POST /tenants).
 *   401 token ausente/expirado/firma invalida/claims_faltantes · 403 tenant_mismatch · 500 config.
 * Nunca loguea el token. C4 <=75.
 */
import type { HttpResponse, RequestContext } from "./server-types.ts";
import { verificarJwt, parsearJwtClaims } from "./jwt-verify.ts";
import type { JwtClaims, JwtError } from "./jwt-verify.ts";
import { resolverTenantId } from "./tenant-resolver.ts";
import { parsearUserClaimsSinTenant } from "./jwt-verify-user.ts";
import type { UserClaims } from "./jwt-verify-user.ts";
import { ok, err } from "../shared/domain/result.ts";
import type { Result } from "../shared/domain/result.ts";

export function authHeader(ctx: RequestContext): string | null {
  const raw = ctx.headers["authorization"] ?? ctx.headers["Authorization"] ?? null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function jsonResponse(status: number, payload: Record<string, unknown>): HttpResponse {
  return { status, contentType: "application/json", body: JSON.stringify(payload) };
}

function fallaAuth(error: JwtError): HttpResponse {
  return jsonResponse(error.kind === "config_incompleta" ? 500 : 401, { ok: false, error });
}

// M-6: fallback DB (sub->users.tenant_id) inyectado por el composition root (bootstrap).
// Default null => solo claim (comportamiento previo; tests sin DB quedan intactos).
let tenantFallback: ((sub: string) => Promise<string | null>) | null = null;
export function setTenantFallback(fn: (sub: string) => Promise<string | null>): void {
  tenantFallback = fn;
}

function matchTenant(claims: JwtClaims, pathTenantId?: string): Result<JwtClaims, HttpResponse> {
  if (pathTenantId !== undefined && claims.tenantId !== pathTenantId) {
    return err(jsonResponse(403, { ok: false, error: { kind: "tenant_mismatch" } }));
  }
  return ok(claims);
}

export async function requireTenantAuth(
  ctx: RequestContext,
  pathTenantId?: string,
): Promise<Result<JwtClaims, HttpResponse>> {
  // Camino primario (mock-compat con tests que mockean parsearJwtClaims).
  const claims = await parsearJwtClaims(authHeader(ctx));
  if (claims.ok) return matchTenant(claims.value, pathTenantId);
  // M-6: solo si el unico faltante es tenant_id, intentar fallback sub->users.tenant_id.
  if (claims.error.kind === "claims_faltantes" && claims.error.campo === "tenant_id") {
    const v = await verificarJwt(authHeader(ctx));
    if (v.ok) {
      const tid = await resolverTenantId(v.value, tenantFallback ?? (async () => null));
      if (tid) {
        return matchTenant(Object.freeze({
          userId: String(v.value.sub), tenantId: tid,
          ...(v.value.email ? { email: String(v.value.email) } : {}), exp: v.value.exp ?? 0,
        }), pathTenantId);
      }
    }
  }
  return err(fallaAuth(claims.error));
}

export async function requireUserAuth(ctx: RequestContext): Promise<Result<UserClaims, HttpResponse>> {
  const claims = await parsearUserClaimsSinTenant(authHeader(ctx));
  if (!claims.ok) return err(fallaAuth(claims.error));
  return ok(claims.value);
}
