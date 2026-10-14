/**
 * HUB by Raisen — TokenVaultRepository: guarda y recupera tokens encriptados.
 * Encriptacion XChaCha20-Poly1305 real. Clave desde META_TOKEN_ENCRYPTION_KEY.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { encriptarToken, desencriptarToken } from "../../../shared/infrastructure/encryption.ts";
import type { TokenRecord } from "./token-vault.types.ts";
import type { VaultError } from "./token-vault.types.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

function baseURL(): string | null { return getEnv("SUPABASE_URL") ?? null; }
function authHeaders(): Record<string, string> | null {
  const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return k ? { apikey: k, Authorization: `Bearer ${k}` } : null;
}

export class TokenVaultRepository {
  async guardar(signupId: string, tenantId: string, tokenPlano: string, expiresAt: string): Promise<Result<void, VaultError>> {
    const enc = encriptarToken(tokenPlano);
    if (!enc.ok) return err({ kind: "persistence_failure", cause: `encriptacion:${enc.error.kind}` });
    const base = baseURL();
    const hdrs = authHeaders();
    if (!base || !hdrs) return err({ kind: "persistence_failure", cause: "config_incompleta" });
    try {
      const res = await fetch(`${base}/signup_tokens`, {
        method: "POST",
        headers: { ...hdrs!, "content-type": "application/json" },
        body: JSON.stringify({ signup_id: signupId, tenant_id: tenantId, encrypted_nonce: enc.value.nonce, encrypted_token: enc.value.ciphertext, token_type: "system_user", expires_at: expiresAt }),
      });
      if (!res.ok) return err({ kind: "persistence_failure", cause: res.status === 401 || res.status === 403 ? "no_autorizado" : `http_${res.status}` });
      return ok(undefined);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async buscarToken(signupId: string): Promise<Result<TokenRecord, VaultError>> {
    const base = baseURL();
    const hdrs = authHeaders();
    if (!base || !hdrs) return err({ kind: "persistence_failure", cause: "config_incompleta" });
    try {
      const url = `${base}/signup_tokens?select=*&signup_id=eq.${encodeURIComponent(signupId)}&order=created_at.desc&limit=1`;
      const res = await fetch(url, { headers: hdrs });
      if (!res.ok) return err({ kind: "persistence_failure", cause: `http_${res.status}` });
      const rows = (await res.json()) as TokenRecord[];
      if (!rows || rows.length === 0) return err({ kind: "sin_token" });
      return ok<TokenRecord>(rows[0] as TokenRecord);
    } catch (e) { return err({ kind: "persistence_failure", cause: String(e) }); }
  }

  async obtenerTokenPlano(signupId: string): Promise<Result<string, VaultError>> {
    const rec = await this.buscarToken(signupId);
    if (!rec.ok) return rec;
    const dec = desencriptarToken({ nonce: rec.value.encryptedNonce, ciphertext: rec.value.encryptedToken });
    if (!dec.ok) return err({ kind: "desencriptacion_fallo", cause: dec.error.kind });
    return ok(dec.value);
  }
}