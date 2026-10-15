/**
 * HUB by Raisen — Data sources Supabase para la landing pública (Slide 3.3).
 * Consulta tenant por slug (+branding), order por id/tenant (+notes) y items.
 * C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, OrderId } from "../../shared/domain/ids.ts";
import type { TenantBranding, OrderForPago, PagoOrderItem } from "../application/load-pago-page.handler.ts";
import type { PayLoadSources } from "../application/load-pago-page.handler.ts";
import type { QuoteId } from "../../shared/domain/ids.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface TenantRow { id: string; slug: string; name: string; branding_config?: Record<string, unknown> | null; }
interface OrderRow { id: string; tenant_id: string; status: string; total_amount: number; currency: string; notes: string | null; quote_id: string | null; }
interface ItemRow { description: string; quantity: number; unit_price: number; total: number | null; }
interface QuoteRow { id: string; }

export class PayDataSources implements PayLoadSources {
  async tenantBySlug(slug: string): Promise<Result<TenantBranding | null, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    const r = await fetch(`${u}/tenants?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`, { headers: h });
    if (!r.ok) return err(`http_${r.status}`);
    const rows = await r.json() as TenantRow[];
    if (!rows || rows.length === 0) return ok(null);
    const t = rows[0]!;
    const b = t.branding_config ?? {};
    return ok({
      id: t.id as TenantId, slug: t.slug, name: t.name,
      logoUrl: (b["logo_url"] as string | null) ?? null,
      primaryColor: (b["primary_color"] as string | null) ?? null,
    });
  }

  async orderById(id: OrderId, tenantId: TenantId): Promise<Result<OrderForPago | null, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    const r = await fetch(`${u}/orders?select=*&id=eq.${encodeURIComponent(String(id))}&tenant_id=eq.${encodeURIComponent(String(tenantId))}&limit=1`, { headers: h });
    if (!r.ok) return err(`http_${r.status}`);
    const rows = await r.json() as OrderRow[];
    if (!rows || rows.length === 0) return ok(null);
    const o = rows[0]!;
    return ok({
      id: o.id as OrderId, tenantId: o.tenant_id as TenantId, status: o.status,
      totalAmount: Number(o.total_amount), currency: o.currency,
      notes: o.notes, quoteId: o.quote_id as OrderForPago["quoteId"],
    });
  }

  async itemsByQuote(quoteId: QuoteId): Promise<Result<readonly PagoOrderItem[], string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    const q = await fetch(`${u}/quotes?select=id&id=eq.${encodeURIComponent(quoteId)}&limit=1`, { headers: h });
    if (!q.ok) return err(`http_${q.status}`);
    const qRows = await q.json() as QuoteRow[];
    if (!qRows || qRows.length === 0) return ok([]);
    const r = await fetch(`${u}/quote_line_items?select=*&quote_id=eq.${encodeURIComponent(quoteId)}`, { headers: h });
    if (!r.ok) return err(`http_${r.status}`);
    const rows = await r.json() as ItemRow[];
    return ok(Object.freeze(rows.map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unit_price), total: Number(i.total ?? i.unit_price * i.quantity) }))));
  }
}