/**
 * HUB by Raisen — Q (JWKS ES256): verifica JWT asimetrico (Supabase ECC P-256) via JWKS
 * remoto, con fallback HS256 Legacy SOLO si el token declara alg=HS256 (transicion segura).
 * jose cachea el JWKS (TTL 10min) y re-fetchea ante kid desconocido pasado el cooldown.
 * Fail-closed: JWKS caido / firma invalida => error, nunca bypass. alg=none => error.
 * Unica referencia permitida a SUPABASE_JWT_SECRET (Compuerta #58). C4 <=75.
 */
import { jwtVerify, createRemoteJWKSet, decodeProtectedHeader, errors as joseErrors } from "jose";
import type { JWTPayload } from "jose";
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

export type JwtVerifyError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "token_expirado" }
  | { readonly kind: "firma_invalida" };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

/** URL del JWKS: SUPABASE_JWKS_URL explicito o derivado de SUPABASE_URL. null si faltan ambos. */
function jwksUrl(): string | null {
  const explicit = getEnv("SUPABASE_JWKS_URL");
  if (explicit) return explicit;
  const base = getEnv("SUPABASE_URL");
  return base ? `${base.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json` : null;
}

let cachedSet: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedUrl = "";
function jwks(url: string): ReturnType<typeof createRemoteJWKSet> {
  if (!cachedSet || cachedUrl !== url) { cachedSet = createRemoteJWKSet(new URL(url), { cacheMaxAge: 600_000, cooldownDuration: 30_000 }); cachedUrl = url; }
  return cachedSet;
}

// Q-7: contador del fallback HS256 (debe ser 0 en prod post-migracion; log solo en prod).
let hs256Fallbacks = 0;
export function getHs256FallbackCount(): number { return hs256Fallbacks; }

function mapError(e: unknown): JwtVerifyError {
  if (e instanceof joseErrors.JWTExpired) return { kind: "token_expirado" };
  return { kind: "firma_invalida" };
}

/** HS256 Legacy: solo para tokens alg=HS256 o header indecodificable (compat previa a Q). */
async function verifyHs256(token: string): Promise<Result<JWTPayload, JwtVerifyError>> {
  const secret = getEnv("SUPABASE_JWT_SECRET");
  if (!secret) return err({ kind: "config_incompleta" });
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    hs256Fallbacks += 1;
    if ((getEnv("NODE_ENV") ?? "") === "production") console.warn("[HUB][jwt] HS256 legacy fallback usado (Q-7) — debe ser 0 post-migracion");
    return ok(payload);
  } catch (e) { return err(mapError(e)); }
}

/** Verifica un JWT (ES256 via JWKS primario; HS256 Legacy como fallback). */
export async function verificarTokenJwt(token: string): Promise<Result<JWTPayload, JwtVerifyError>> {
  let alg: string | undefined;
  try { alg = decodeProtectedHeader(token).alg; } catch { alg = undefined; }
  if (alg === "none") return err({ kind: "firma_invalida" }); // A-Q-4: jamas aceptar
  if (alg === "ES256") {
    const url = jwksUrl();
    if (!url) return err({ kind: "config_incompleta" });
    try {
      const { payload } = await jwtVerify(token, jwks(url), { algorithms: ["ES256"] });
      return ok(payload);
    } catch (e) { return err(mapError(e)); } // A-Q-5: JWKS caido => fail-closed
  }
  return verifyHs256(token); // HS256 o header indecodificable => fallback legacy
}
