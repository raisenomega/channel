/**
 * HUB by Raisen — Repositorio Supabase de quotes (con line items eager).
 * guardar: 2 fetches (quotes + quote_line_items DELETE+INSERT bulk).
 * buscar: 2 fetches (quotes + quote_line_items WHERE quote_id).
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, QuoteId, ContactId } from "../../shared/domain/ids.ts";
import type { QuoteState, QuoteLineItem, QuoteStatus, CreateByType } from "../domain/quote.entity.ts";
import type { QuoteRepository, RepoError } from "../domain/commerce.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface QuoteRow {
  id: string; tenant_id: string; contact_id: string; mode: string; status: string;
  total_amount: number; currency: string; created_by_type: string | null; created_at: string;
}
interface LineRow {
  description: string; quantity: number; unit_price: number; total: number;
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseQuoteRepo implements QuoteRepository {
  async guardar(quote: QuoteState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const q = await fetch(`${u}/quotes`, { method: "POST", headers: h, body: JSON.stringify({ id: quote.id, tenant_id: quote.tenantId, contact_id: quote.contactId, mode: quote.mode, status: quote.status, total_amount: quote.totalAmount, currency: quote.currency, created_by_type: quote.createdByType, created_at: quote.createdAt.toISOString() }) });
      if (!q.ok) return err(mapErr(`http_${q.status}`));
      if (quote.items.length > 0) {
        const del = await fetch(`${u}/quote_line_items?quote_id=eq.${encodeURIComponent(String(quote.id))}`, { method: "DELETE", headers: h });
        if (!del.ok) return err(mapErr("line_items_divergent"));
        const ins = await fetch(`${u}/quote_line_items`, { method: "POST", headers: h, body: JSON.stringify(this.lineItemsBody(quote.id, quote.items)) });
        if (!ins.ok) return err(mapErr("line_items_divergent"));
      }
      return ok(undefined);
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscar(id: QuoteId, tenantId: TenantId): Promise<Result<QuoteState | null, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const qUrl = `${u}/quotes?select=*&id=eq.${encodeURIComponent(String(id))}&tenant_id=eq.${encodeURIComponent(String(tenantId))}&limit=1`;
      const q = await fetch(qUrl, { headers: h });
      if (!q.ok) return err(mapErr(`http_${q.status}`));
      const qRows = await q.json() as QuoteRow[];
      if (!qRows || qRows.length === 0) return ok(null);
      const iUrl = `${u}/quote_line_items?select=*&quote_id=eq.${encodeURIComponent(String(id))}`;
      const i = await fetch(iUrl, { headers: h });
      if (!i.ok) return err(mapErr(`http_${i.status}`));
      const iRows = await i.json() as LineRow[];
      return ok(this.toEntity(qRows[0]!, iRows));
    } catch (e) { return err(mapErr(String(e))); }
  }

  private lineItemsBody(quoteId: QuoteId, items: readonly QuoteLineItem[]): Array<Record<string, unknown>> {
    return items.map((it) => ({ quote_id: quoteId, description: it.description, quantity: it.quantity, unit_price: it.unitPrice }));
  }

  private toEntity(r: QuoteRow, items: LineRow[]): QuoteState {
    const lineItems: readonly QuoteLineItem[] = Object.freeze(items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: Number(i.unit_price), total: Number(i.total) })));
    return {
      id: r.id as QuoteId, tenantId: r.tenant_id as TenantId, contactId: r.contact_id as ContactId,
      mode: r.mode as "lite" | "nucleo_synced", status: r.status as QuoteStatus,
      totalAmount: Number(r.total_amount), currency: r.currency,
      items: lineItems, createdByType: (r.created_by_type ?? "human") as CreateByType,
      createdAt: new Date(r.created_at),
    };
  }
}