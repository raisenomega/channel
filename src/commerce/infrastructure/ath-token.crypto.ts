/**
 * HUB by Raisen — Cifrado/descifrado del auth_token transitorio de ATH (3.2a-BIS).
 * Usa las RPC encrypt_secret/decrypt_secret (pgpg + aes256, clave app.enc_key),
 * el mismo esquema que payment_methods_config.secrets_encrypted.
 * Nunca loguea tokens. C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export type AuthTokenCryptoError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "cifrado_fallido"; readonly cause: string }
  | { readonly kind: "descifrado_fallido"; readonly cause: string };

export interface AuthTokenCrypto {
  cifrar(token: string): Promise<Result<string, AuthTokenCryptoError>>;
  descifrar(cipher: string): Promise<Result<string, AuthTokenCryptoError>>;
}

export class SupabaseAuthTokenCrypto implements AuthTokenCrypto {
  async cifrar(token: string): Promise<Result<string, AuthTokenCryptoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ kind: "config_incompleta" });
    try {
      const r = await fetch(`${u}/rpc/encrypt_secret`, { method: "POST", headers: h, body: JSON.stringify({ plain_text: token }) });
      if (!r.ok) return err({ kind: "cifrado_fallido", cause: `http_${r.status}` });
      return ok(await r.json() as string);
    } catch (e) { return err({ kind: "cifrado_fallido", cause: String(e) }); }
  }

  async descifrar(cipher: string): Promise<Result<string, AuthTokenCryptoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ kind: "config_incompleta" });
    try {
      const r = await fetch(`${u}/rpc/decrypt_secret`, { method: "POST", headers: h, body: JSON.stringify({ cipher_b64: cipher }) });
      if (!r.ok) return err({ kind: "descifrado_fallido", cause: `http_${r.status}` });
      return ok(await r.json() as string);
    } catch (e) { return err({ kind: "descifrado_fallido", cause: String(e) }); }
  }
}