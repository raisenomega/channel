/**
 * HUB by Raisen — Credenciales Zernio desde Supabase Vault (Slide 4.2a).
 * R19: misma key que OMEGA (ZERNIO_API_KEY, ZERNIO_WEBHOOK_SECRET). C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export type CredentialsError = { readonly kind: "CREDENCIAL_AUSENTE"; readonly nombre: string };

export interface ZernioCredentials {
  readonly apiKey: string;
  readonly webhookSecret: string;
}

export class ZernioCredentialsRepository {
  async leer(): Promise<Result<ZernioCredentials, CredentialsError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "config_incompleta" });
    const apiKeyRow = await fetch(`${u}/rpc/get_secret`, { method: "POST", headers: h, body: JSON.stringify({ secret_name: "ZERNIO_API_KEY" }) });
    const webhookRow = await fetch(`${u}/rpc/get_secret`, { method: "POST", headers: h, body: JSON.stringify({ secret_name: "ZERNIO_WEBHOOK_SECRET" }) });
    if (!apiKeyRow.ok) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "ZERNIO_API_KEY" });
    if (!webhookRow.ok) return err({ kind: "CREDENCIAL_AUSENTE", nombre: "ZERNIO_WEBHOOK_SECRET" });
    return ok(Object.freeze({
      apiKey: String(await apiKeyRow.json()),
      webhookSecret: String(await webhookRow.json()),
    }));
  }
}