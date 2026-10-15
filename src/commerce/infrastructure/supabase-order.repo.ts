/**
 * HUB by Raisen — Repositorio Supabase de orders.
 * Persiste solo lo que OrderState declara (ignora columnas deuda S3.1-B).
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, OrderId, ContactId, QuoteId } from "../../shared/domain/ids.ts";
import type { OrderState, OrderStatus } from "../domain/order.entity.ts";
import type { OrderRepository, RepoError } from "../domain/commerce.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface OrderRow {
  id: string; tenant_id: string; contact_id: string; quote_id: string | null;
  status: string; total_amount: number; currency: string;
  ai_confidence: number | null; created_at: string;
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseOrderRepo implements OrderRepository {
  async guardar(order: OrderState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/orders`, { method: "POST", headers: h, body: JSON.stringify({ id: order.id, tenant_id: order.tenantId, contact_id: order.contactId, quote_id: order.quoteId, status: order.status, total_amount: order.totalAmount, currency: order.currency, ai_confidence: order.aiConfidence, created_at: order.createdAt.toISOString() }) });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscar(id: OrderId, tenantId: TenantId): Promise<Result<OrderState | null, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/orders?select=*&id=eq.${encodeURIComponent(String(id))}&tenant_id=eq.${encodeURIComponent(String(tenantId))}&limit=1`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as OrderRow[];
      if (!rows || rows.length === 0) return ok(null);
      return ok(this.toEntity(rows[0]!));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscarPorContacto(contactId: ContactId, tenantId: TenantId): Promise<Result<OrderState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/orders?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&contact_id=eq.${encodeURIComponent(String(contactId))}&order=created_at.desc`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as OrderRow[];
      return ok(rows.map((x) => this.toEntity(x)));
    } catch (e) { return err(mapErr(String(e))); }
  }

  private toEntity(r: OrderRow): OrderState {
    return {
      id: r.id as OrderId, tenantId: r.tenant_id as TenantId, contactId: r.contact_id as ContactId,
      quoteId: r.quote_id as QuoteId | null, status: r.status as OrderStatus,
      totalAmount: Number(r.total_amount), currency: r.currency,
      aiConfidence: r.ai_confidence, createdAt: new Date(r.created_at),
    };
  }
}