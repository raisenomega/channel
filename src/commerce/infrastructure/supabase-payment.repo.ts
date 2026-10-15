/**
 * HUB by Raisen — Repositorio Supabase de payments.
 * Persiste/lee provider_payment_id, net_amount y auth_token_encrypted (3.2a-BIS).
 * guardar hace UPSERT por id (crea o actualiza). C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, PaymentId, OrderId } from "../../shared/domain/ids.ts";
import type { PaymentState, PaymentStatus, InitiatedByType } from "../domain/payment.entity.ts";
import type { PaymentRepository, RepoError } from "../domain/commerce.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";
interface Row {
  id: string; tenant_id: string; order_id: string; amount: number; currency: string;
  status: string; provider: string; provider_payment_id: string | null;
  initiated_by_type: string | null; net_amount: number | null;
  ath_auth_token_encrypted: string | null; created_at: string;
}
const mapErr = (e: string): RepoError => ({ kind: "persistence_failure", cause: e });

export class SupabasePaymentRepo implements PaymentRepository {
  async guardar(p: PaymentState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const ex = await this.buscarUno(`id=eq.${encodeURIComponent(String(p.id))}`, p.tenantId); if (!ex.ok) return err(ex.error);
      const body = JSON.stringify({
        id: p.id, tenant_id: p.tenantId, order_id: p.orderId, amount: p.amount, currency: p.currency,
        status: p.status, provider: p.provider, provider_payment_id: p.providerPaymentId,
        initiated_by_type: p.initiatedByType, net_amount: p.netAmount,
        ath_auth_token_encrypted: p.authTokenEncrypted, created_at: p.createdAt.toISOString(),
      });
      const url = ex.value ? `${u}/payments?id=eq.${encodeURIComponent(String(p.id))}` : `${u}/payments`; const r = await fetch(url, { method: ex.value ? "PATCH" : "POST", headers: h, body });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }
  async buscar(id: PaymentId, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>> {
    return this.buscarUno(`id=eq.${encodeURIComponent(String(id))}`, tenantId);
  }
  async buscarPorProviderPaymentId(pid: string, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>> {
    return this.buscarUno(`provider_payment_id=eq.${encodeURIComponent(pid)}`, tenantId);
  }
  async buscarPorOrder(orderId: OrderId, tenantId: TenantId): Promise<Result<PaymentState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/payments?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&order_id=eq.${encodeURIComponent(String(orderId))}&order=created_at.desc`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as Row[];
      return ok(rows.map((x) => this.toEntity(x)));
    } catch (e) { return err(mapErr(String(e))); }
  }
  private async buscarUno(filter: string, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/payments?select=*&${filter}&tenant_id=eq.${encodeURIComponent(String(tenantId))}&limit=1`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as Row[];
      if (!rows || rows.length === 0) return ok(null);
      return ok(this.toEntity(rows[0]!));
    } catch (e) { return err(mapErr(String(e))); }
  }
  private toEntity(r: Row): PaymentState {
    return {
      id: r.id as PaymentId, tenantId: r.tenant_id as TenantId, orderId: r.order_id as OrderId,
      amount: Number(r.amount), currency: r.currency, status: r.status as PaymentStatus,
      provider: r.provider, providerPaymentId: r.provider_payment_id,
      initiatedByType: (r.initiated_by_type ?? "human") as InitiatedByType,
      netAmount: r.net_amount ?? null, authTokenEncrypted: r.ath_auth_token_encrypted ?? null,
      createdAt: new Date(r.created_at),
    };
  }
}