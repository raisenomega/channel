/**
 * HUB by Raisen — N-9 (FORTRESS): state OAuth firmado con HMAC-SHA256 + nonce single-use.
 * Primitivas puras y testeables (sign/verify) sobre crypto.subtle (patron del repo).
 * El nonce se consume via callback inyectado (oauthNoncesRepo.consume) -> testeable sin DB.
 * NOTA integracion: en el flujo Zernio el `state` lo genera Zernio; habilitar en vivo exige
 * confirmar que Zernio hace echo de un `state` custom (si no, rompe las conexiones). C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

export interface OAuthStatePayload {
  readonly tenantId: string;
  readonly platform: string;
  readonly origin: string;   // O-9: origin del iniciador, re-validado vs CORS allowlist (Compuerta #40)
  readonly userId: string;   // O-9: quien inicio el OAuth (auditoria)
  readonly nonce: string;
  readonly ts: number;
}
export type OAuthStateError =
  | { readonly kind: "state_secret_missing" } | { readonly kind: "state_malformed" }
  | { readonly kind: "state_signature_invalid" } | { readonly kind: "state_expired" }
  | { readonly kind: "state_nonce_replayed" };

function getSecret(): string | null {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const s = (d?.env?.get ? d.env.get("OAUTH_STATE_SECRET") : p?.env?.["OAUTH_STATE_SECRET"]) ?? "";
  return s.length >= 32 ? s : null;
}
const b64url = (s: string): string => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string): string => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
export const nuevoNonce = (): string => crypto.randomUUID();

function eqConst(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
  const buf = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)) as ArrayBuffer);
  return Array.from(buf).map((x: number) => x.toString(16).padStart(2, "0")).join("");
}

export async function signState(payload: OAuthStatePayload): Promise<Result<string, OAuthStateError>> {
  const secret = getSecret(); if (!secret) return err({ kind: "state_secret_missing" });
  const json = JSON.stringify(payload);
  return ok(`${b64url(json)}.${await hmacHex(secret, json)}`);
}

export async function verifyState(
  state: string,
  consume: (nonce: string) => Promise<boolean>,
  maxAgeMs = 300_000,
): Promise<Result<OAuthStatePayload, OAuthStateError>> {
  const secret = getSecret(); if (!secret) return err({ kind: "state_secret_missing" });
  const dot = state.lastIndexOf("."); if (dot <= 0) return err({ kind: "state_malformed" });
  const b64 = state.slice(0, dot); const sig = state.slice(dot + 1);
  let json: string; try { json = unb64url(b64); } catch { return err({ kind: "state_malformed" }); }
  if (!eqConst(sig, await hmacHex(secret, json))) return err({ kind: "state_signature_invalid" });
  let p: OAuthStatePayload; try { p = JSON.parse(json) as OAuthStatePayload; } catch { return err({ kind: "state_malformed" }); }
  if (typeof p.ts !== "number" || Date.now() - p.ts > maxAgeMs) return err({ kind: "state_expired" });
  if (!(await consume(p.nonce))) return err({ kind: "state_nonce_replayed" });
  return ok(p);
}
