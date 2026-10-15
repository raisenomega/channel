/**
 * HUB by Raisen — Repositorio Supabase de configuracion de metodos de pago.
 * Lee credenciales cifradas y las descifra via RPC decrypt_secret.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { RepoError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigState, PaymentProvider, PaymentEnv } from "../domain/payment-methods-config.entity.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface ConfigRow {
  tenant_id: string; provider: string; config: Record<string, unknown> | null;
  secrets_encrypted: Record<string, unknown> | null; is_active: boolean;
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabasePaymentMethodsConfigRepo implements PaymentMethodsConfigRepo {
  async obtener(tenantId: TenantId, provider: string): Promise<Result<PaymentMethodsConfigState | null, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/payment_methods_config?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&provider=eq.${encodeURIComponent(provider)}&limit=1`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as ConfigRow[];
      if (!rows || rows.length === 0) return ok(null);
      const c = rows[0]!;
      return ok({
        tenantId: c.tenant_id as TenantId,
        provider: c.provider as PaymentProvider,
        env: (c.config?.env ?? "sandbox") as PaymentEnv,
        secretsEncrypted: Object.freeze((c.secrets_encrypted ?? {}) as Record<string, string>),
        isActive: c.is_active,
      });
    } catch (e) { return err(mapErr(String(e))); }
  }

  async obtenerDecifrado(tenantId: TenantId, provider: string): Promise<Result<Record<string, string>, RepoError>> {
    const cfg = await this.obtener(tenantId, provider);
    if (!cfg.ok) return cfg;
    if (!cfg.value) return err({ kind: "not_found" });
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    const out: Record<string, string> = {};
    try {
      for (const [key, cipher] of Object.entries(cfg.value.secretsEncrypted)) {
        const sinPrefijo = String(cipher).replace(/^\$pgp_enc_/, "");
        const r = await fetch(`${u}/rpc/decrypt_secret`, { method: "POST", headers: h, body: JSON.stringify({ cipher_b64: sinPrefijo }) });
        if (!r.ok) return err(mapErr("decryption_failed"));
        const data = await r.json() as string;
        out[key] = data;
      }
      return ok(Object.freeze(out));
    } catch { return err(mapErr("decryption_failed")); }
  }

  async guardar(config: PaymentMethodsConfigState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/payment_methods_config`, { method: "POST", headers: h, body: JSON.stringify({ tenant_id: config.tenantId, provider: config.provider, config: { env: config.env }, secrets_encrypted: config.secretsEncrypted, is_active: config.isActive }) });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }
}