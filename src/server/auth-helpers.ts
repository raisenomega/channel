/**
 * HUB by Raisen — Compuerta #17: autenticacion JWT obligatoria por handler HTTP.
 * requireTenantAuth(ctx, pathTenantId?) centraliza parsearJwtClaims + match del tenant
 * del path contra el claim. El error es una HttpResponse lista para retornar:
 *   401 token ausente/expirado/firma invalida · 403 tenant_mismatch · 500 config_incompleta.
 * Nunca loguea el token. C4 <=75.
 */
import type { HttpResponse, RequestContext } from "./server-types.ts";
import { parsearJwtClaims } from "./jwt-verify.ts";
import type { JwtClaims } from "./jwt-verify.ts";
import { ok, err } from "../shared/domain/result.ts";
import type { Result } from "../shared/domain/result.ts";

/** Header Authorization crudo (con "Bearer "), que es lo que parsearJwtClaims espera. */
export function authHeader(ctx: RequestContext): string | null {
  const raw = ctx.headers["authorization"] ?? ctx.headers["Authorization"] ?? null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function jsonResponse(status: number, payload: Record<string, unknown>): HttpResponse {
  return { status, contentType: "application/json", body: JSON.stringify(payload) };
}

export async function requireTenantAuth(
  ctx: RequestContext,
  pathTenantId?: string,
): Promise<Result<JwtClaims, HttpResponse>> {
  const claims = await parsearJwtClaims(authHeader(ctx));
  if (!claims.ok) {
    const status = claims.error.kind === "config_incompleta" ? 500 : 401;
    return err(jsonResponse(status, { ok: false, error: claims.error }));
  }
  if (pathTenantId !== undefined && claims.value.tenantId !== pathTenantId) {
    return err(jsonResponse(403, { ok: false, error: { kind: "tenant_mismatch" } }));
  }
  return ok(claims.value);
}
