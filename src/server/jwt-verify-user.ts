/**
 * HUB by Raisen — Claims de USUARIO sin exigir tenant_id (Hotfix G, decision D3).
 * Uso exclusivo: POST /tenants, donde el usuario autenticado aun no tiene tenant
 * (chicken-and-egg). Misma verificacion de firma/exp que parsearJwtClaims. C4 <=75.
 */
import { ok, err } from "../shared/domain/result.ts";
import type { Result } from "../shared/domain/result.ts";
import { verificarJwt, tenantIdDePayload } from "./jwt-verify.ts";
import type { JwtError } from "./jwt-verify.ts";

export interface UserClaims {
  readonly userId: string;
  /** null cuando el JWT todavia no trae tenant_id (usuario nuevo). */
  readonly tenantId: string | null;
  readonly email?: string;
  readonly exp: number;
}

export async function parsearUserClaimsSinTenant(authHeader: string | null): Promise<Result<UserClaims, JwtError>> {
  const v = await verificarJwt(authHeader);
  if (!v.ok) return v;
  const sub = v.value.sub;
  if (!sub) return err({ kind: "claims_faltantes", campo: "sub" });
  return ok(Object.freeze({
    userId: sub,
    tenantId: tenantIdDePayload(v.value),
    ...(v.value.email ? { email: String(v.value.email) } : {}),
    exp: v.value.exp ?? 0,
  }));
}
