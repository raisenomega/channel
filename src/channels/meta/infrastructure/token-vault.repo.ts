/**
 * HUB by Raisen — TokenVaultRepository: almacena tokens encriptados en Supabase.
 * Encriptacion XChaCha20-Poly1305 real (no placeholder).
 * Clave maestra desde META_TOKEN_ENCRYPTION_KEY (32 bytes hex).
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import { encriptarToken } from "../../../shared/infrastructure/encryption.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(name: string): string | undefined {
  const deno = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  if (deno?.env?.get) return deno.env.get(name);
  return process.env[name];
}

function supabaseRestBase(): string | null {
  const v = getEnv("SUPABASE_URL");
  return v ?? null;
}

function supabaseAuthHeaders(): Record<string, string> | null {
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return null;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export interface TokenRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly signupId: string;
  readonly encryptedNonce: string;    // hex del nonce XChaCha20
  readonly encryptedToken: string;    // hex del ciphertext (incluye tag Poly1305)
  readonly tokenType: string;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly rotatedAt: string | null;
}

export type VaultError =
  | { readonly kind: "persistence_failure"; readonly cause: string }
  | { readonly kind: "sin_token" };

export class TokenVaultRepository {
  async guardar(
    signupId: string,
    tenantId: string,
    tokenPlano: string,
    expiresAt: string,
  ): Promise<Result<void, VaultError>> {
    const encriptado = encriptarToken(tokenPlano);
    if (!encriptado.ok) return err({ kind: "persistence_failure", cause: `encriptacion:${encriptado.error.kind}` });

    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) return err({ kind: "persistence_failure", cause: "config_incompleta" });
    try {
      const res = await fetch(`${base}/signup_tokens`, {
        method: "POST",
        headers: { ...headers!, "content-type": "application/json" },
        body: JSON.stringify({
          signup_id: signupId,
          tenant_id: tenantId,
          encrypted_nonce: encriptado.value.nonce,
          encrypted_token: encriptado.value.ciphertext,
          token_type: "system_user",
          expires_at: expiresAt,
        }),
      });
      if (!res.ok) {
        const errBody = res.status === 401 || res.status === 403 ? "no_autorizado" : `http_${res.status}`;
        return err({ kind: "persistence_failure", cause: errBody });
      }
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarToken(signupId: string): Promise<Result<TokenRecord, VaultError>> {
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) return err({ kind: "persistence_failure", cause: "config_incompleta" });
    try {
      const url = `${base}/signup_tokens?select=*&signup_id=eq.${encodeURIComponent(signupId)}&order=created_at.desc&limit=1`;
      const res = await fetch(url, { headers });
      if (!res.ok) return err({ kind: "persistence_failure", cause: `http_${res.status}` });
      const rows = (await res.json()) as TokenRecord[];
      if (!rows || rows.length === 0) return err({ kind: "sin_token" });
      return ok<TokenRecord>(rows[0] as TokenRecord);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}