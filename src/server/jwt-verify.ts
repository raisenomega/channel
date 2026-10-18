/**
 * HUB by Raisen — Verificacion de JWT + extraccion de claims. Delega la verificacion de
 * firma a jwt-jwks-verify (Q: ES256 via JWKS primario + fallback HS256 Legacy).
 * Jamas acepta token sin firma valida ni expirado. Jamas loguea el token. C4 <=75.
 * Hotfix G: verificarJwt + tenantIdDePayload se comparten con jwt-verify-user.ts.
 */
import type { JWTPayload } from "jose";
import { verificarTokenJwt } from "../identity/infrastructure/jwt-jwks-verify.ts";
import { ok, err } from "../shared/domain/result.ts";
import type { Result } from "../shared/domain/result.ts";

export interface JwtClaims {
  readonly userId: string;
  readonly tenantId: string;
  readonly email?: string;
  readonly exp: number;
}

export type JwtError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "token_ausente" }
  | { readonly kind: "token_expirado" }
  | { readonly kind: "firma_invalida" }
  | { readonly kind: "claims_faltantes"; readonly campo: string };

/** Verifica "Bearer <jwt>" (firma ES256/HS256 + exp) y devuelve el payload crudo. */
export async function verificarJwt(authHeader: string | null): Promise<Result<JWTPayload, JwtError>> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return err({ kind: "token_ausente" });
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return err({ kind: "token_ausente" });
  // JwtVerifyError (config_incompleta|token_expirado|firma_invalida) es subconjunto de JwtError.
  return verificarTokenJwt(token);
}

/** tenant_id desde app_metadata (Supabase) o raiz del payload; null si no existe. */
export function tenantIdDePayload(payload: JWTPayload): string | null {
  const metadata = payload.app_metadata as Record<string, unknown> | undefined;
  const t = (metadata?.tenant_id ?? payload.tenant_id) as string | undefined;
  return t ? String(t) : null;
}

export async function parsearJwtClaims(authHeader: string | null): Promise<Result<JwtClaims, JwtError>> {
  const v = await verificarJwt(authHeader);
  if (!v.ok) return v;
  const sub = v.value.sub;
  if (!sub) return err({ kind: "claims_faltantes", campo: "sub" });
  const tenantId = tenantIdDePayload(v.value);
  if (!tenantId) return err({ kind: "claims_faltantes", campo: "tenant_id" });

  return ok(Object.freeze({
    userId: sub,
    tenantId,
    ...(v.value.email ? { email: String(v.value.email) } : {}),
    exp: v.value.exp ?? 0,
  }));
}
