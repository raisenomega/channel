/**
 * HUB by Raisen — Repositorio Supabase de payments.
 * Persiste y lee provider_payment_id (cierra deuda S3.1-C).
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, PaymentId, OrderId } from "../../shared/domain/ids.ts";
import type { PaymentState, PaymentStatus, InitiatedByType } from "../domain/payment.entity.ts";
import type { PaymentRepository, RepoError } from "../domain/commerce.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface PaymentRow {
  id: string; tenant_id: string; order_id: string; amount: number; currency: string;
  status: string; provider: string; provider_payment_id: string | null;
  initiated_by_type: string | null; created_at: string;
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabasePaymentRepo implements PaymentRepository {
  async guardar(payment: PaymentState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/payments`, { method: "POST", headers: h, body: JSON.stringify({ id: payment.id, tenant_id: payment.tenantId, order_id: payment.orderId, amount: payment.amount, currency: payment.currency, status: payment.status, provider: payment.provider, provider_payment_id: payment.providerPaymentId, initiated_by_type: payment.initiatedByType, created_at: payment.createdAt.toISOString() }) });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscar(id: PaymentId, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>> {
    return this.buscarUno(`id=${encodeURIComponent(String(id))}`, tenantId);
  }

  async buscarPorProviderPaymentId(providerPaymentId: string, tenantId: TenantId): Promise<Result<PaymentState | null, RepoError>> {
    return this.buscarUno(`provider_payment_id=${encodeURIComponent(providerPaymentId)}`, tenantId);
  }

  async buscarPorOrder(orderId: OrderId, tenantId: TenantId): Promise<Result<PaymentState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/payments?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&order_id=eq.${encodeURIComponent(String(orderId))}&order=created_at.desc`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as PaymentRow[];
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
      const rows = await r.json() as PaymentRow[];
      if (!rows || rows.length === 0) return ok(null);
      return ok(this.toEntity(rows[0]!));
    } catch (e) { return err(mapErr(String(e))); }
  }

  private toEntity(r: PaymentRow): PaymentState {
    return {
      id: r.id as PaymentId, tenantId: r.tenant_id as TenantId, orderId: r.order_id as OrderId,
      amount: Number(r.amount), currency: r.currency, status: r.status as PaymentStatus,
      provider: r.provider, providerPaymentId: r.provider_payment_id,
      initiatedByType: (r.initiated_by_type ?? "human") as InitiatedByType,
      createdAt: new Date(r.created_at),
    };
  }
}