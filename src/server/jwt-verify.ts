/**
 * HUB by Raisen — Verificación de JWT (Supabase HS256) + extracción de claims.
 * Usa jose. Jamás acepta token sin firma válida ni expirado.
 * Jamás loguea el token. C4 ≤75 lineas.
 */
import { jwtVerify, errors as joseErrors } from "jose";
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

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export async function parsearJwtClaims(authHeader: string | null): Promise<Result<JwtClaims, JwtError>> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return err({ kind: "token_ausente" });

  const secret = getEnv("SUPABASE_JWT_SECRET");
  if (!secret) return err({ kind: "config_incompleta" });

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return err({ kind: "token_ausente" });

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });

    const sub = payload.sub as string | undefined;
    if (!sub) return err({ kind: "claims_faltantes", campo: "sub" });
    const metadata = payload.app_metadata as Record<string, unknown> | undefined;
    const tenantId = (metadata?.tenant_id ?? payload.tenant_id) as string | undefined;
    if (!tenantId) return err({ kind: "claims_faltantes", campo: "tenant_id" });

    return ok(Object.freeze({
      userId: sub,
      tenantId,
      ...(payload.email ? { email: String(payload.email) } : {}),
      exp: payload.exp ?? 0,
    }));
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) return err({ kind: "token_expirado" });
    if (e instanceof joseErrors.JWSSignatureVerificationFailed) return err({ kind: "firma_invalida" });
    return err({ kind: "firma_invalida" });
  }
}