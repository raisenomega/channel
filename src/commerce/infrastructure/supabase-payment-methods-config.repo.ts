/**
 * HUB by Raisen — Repositorio Supabase de configuracion de metodos de pago.
 * Lee credenciales cifradas y las descifra via RPC. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { PaymentMethodsConfigState, PaymentProvider } from "../domain/payment-methods-config.entity.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import type { RepoError } from "../domain/commerce.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface Row { tenant_id: string; provider: string; config: Record<string, unknown> | null; secrets_encrypted: Record<string, unknown> | null; is_active: boolean; }
type R<T> = Result<T, RepoError>;
type B = { u: string; h: Record<string, string> } | null;
const mapErr = (e: string): RepoError => ({ kind: "persistence_failure", cause: e });
const base = (): B => { const u = supabaseBase(); const h = supabaseHdrs(); return u && h ? { u, h } : null; };
const toState = (c: Row): PaymentMethodsConfigState => ({
  tenantId: c.tenant_id as TenantId, provider: c.provider as PaymentProvider,
  env: (c.config?.env ?? "sandbox") as PaymentMethodsConfigState["env"],
  config: Object.freeze((c.config ?? {}) as Record<string, unknown>),
  secretsEncrypted: Object.freeze((c.secrets_encrypted ?? {}) as Record<string, string>),
  isActive: c.is_active,
});

export class SupabasePaymentMethodsConfigRepo implements PaymentMethodsConfigRepo {
  private async fetchRow(b: NonNullable<B>, query: string): Promise<R<PaymentMethodsConfigState | null>> {
    try {
      const r = await fetch(`${b.u}/payment_methods_config?${query}`, { headers: b.h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as Row[];
      return rows && rows.length > 0 ? ok(toState(rows[0]!)) : ok(null);
    } catch (e) { return err(mapErr(String(e))); }
  }

  private async buscarBase(query: string): Promise<R<PaymentMethodsConfigState | null>> {
    const b = base();
    if (!b) return err(mapErr("config_incompleta"));
    return this.fetchRow(b, query);
  }

  async obtener(tenantId: TenantId, provider: string): Promise<R<PaymentMethodsConfigState | null>> {
    return this.buscarBase(`select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&provider=eq.${encodeURIComponent(provider)}&limit=1`);
  }

  async findByStripeAccountId(stripeAccountId: string): Promise<R<PaymentMethodsConfigState | null>> {
    return this.buscarBase(`select=*&provider=eq.stripe&config->>stripe_account_id=eq.${encodeURIComponent(stripeAccountId)}&limit=1`);
  }

  async obtenerDecifrado(tenantId: TenantId, provider: string): Promise<R<Record<string, string>>> {
    const cfg = await this.obtener(tenantId, provider);
    if (!cfg.ok) return cfg;
    if (!cfg.value) return err({ kind: "not_found" });
    const b = base();
    if (!b) return err(mapErr("config_incompleta"));
    const out: Record<string, string> = {};
    for (const [k, cipher] of Object.entries(cfg.value.secretsEncrypted)) {
      try {
        const r = await fetch(`${b.u}/rpc/decrypt_secret`, { method: "POST", headers: b.h, body: JSON.stringify({ cipher_b64: String(cipher).replace(/^\$pgp_enc_/, "") }) });
        if (!r.ok) return err(mapErr("decryption_failed"));
        out[k] = await r.json() as string;
      } catch { return err(mapErr("decryption_failed")); }
    }
    return ok(Object.freeze(out));
  }

  async guardar(config: PaymentMethodsConfigState): Promise<R<void>> {
    const b = base();
    if (!b) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${b.u}/payment_methods_config`, { method: "POST", headers: b.h, body: JSON.stringify({ tenant_id: config.tenantId, provider: config.provider, config: { ...config.config, env: config.env }, secrets_encrypted: config.secretsEncrypted, is_active: config.isActive }) });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }
}