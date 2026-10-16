/**
 * HUB by Raisen — Credenciales Zernio: Supabase Vault primero, env fallback (Hotfix B).
 * R19: misma key que OMEGA (ZERNIO_API_KEY, ZERNIO_WEBHOOK_SECRET).
 * Si Vault responde ok, env se ignora. Nunca loguea valores. Zero throw. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { getEnv, supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export type CredentialsError = { readonly kind: "CREDENCIAL_AUSENTE"; readonly nombre: string };

export interface ZernioCredentials {
  readonly apiKey: string;
  readonly webhookSecret: string;
}

const VAULT_TIMEOUT_MS = 4000;

export class ZernioCredentialsRepository {
  /** Vault primero; si falla, env. Si ambos faltan, retorna el error original del Vault. */
  async leer(): Promise<Result<ZernioCredentials, CredentialsError>> {
    const vault = await this.leerVault();
    if (vault.ok) return vault;
    const apiKey = getEnv("ZERNIO_API_KEY") ?? "";
    const webhookSecret = getEnv("ZERNIO_WEBHOOK_SECRET") ?? "";
    if (apiKey && webhookSecret) return ok(Object.freeze({ apiKey, webhookSecret }));
    return vault;
  }

  private async leerVault(): Promise<Result<ZernioCredentials, CredentialsError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "config_incompleta" });
    try {
      const apiKeyRow = await this.getSecret(u, h, "ZERNIO_API_KEY");
      const webhookRow = await this.getSecret(u, h, "ZERNIO_WEBHOOK_SECRET");
      if (!apiKeyRow.ok) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "ZERNIO_API_KEY" });
      if (!webhookRow.ok) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "ZERNIO_WEBHOOK_SECRET" });
      return ok(Object.freeze({
        apiKey: String(await apiKeyRow.json()),
        webhookSecret: String(await webhookRow.json()),
      }));
    } catch {
      return err({ kind: "CREDENCIAL_AUSENTE", nombre: "vault_inaccesible" });
    }
  }

  private getSecret(u: string, h: Record<string, string>, nombre: string): Promise<Response> {
    return fetch(`${u}/rpc/get_secret`, {
      method: "POST", headers: h, body: JSON.stringify({ secret_name: nombre }),
      signal: AbortSignal.timeout(VAULT_TIMEOUT_MS),
    });
  }
}
