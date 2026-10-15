/**
 * HUB by Raisen — Carga de datos para la landing pública de cobro (Slide 3.3).
 * Orquesta: tenant por slug (+ branding) + order por id/tenant + items si hay quote.
 * Reglas: order.status !== 'pending' -> err "orden_ya_procesada". C4 ≤75.
 */
import { err, ok } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId, OrderId, QuoteId } from "../../shared/domain/ids.ts";

export interface TenantBranding {
  readonly id: TenantId;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly primaryColor: string | null;
}
export interface PagoOrderItem { readonly description: string; readonly quantity: number; readonly unitPrice: number; readonly total: number; }
export interface OrderForPago {
  readonly id: OrderId;
  readonly tenantId: TenantId;
  readonly status: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly notes: string | null;
  readonly quoteId: QuoteId | null;
}
export interface PagoPageLoad {
  readonly tenant: TenantBranding;
  readonly order: OrderForPago;
  readonly items: readonly PagoOrderItem[];
}

export type LoadPagoError =
  | { readonly kind: "tenant_no_encontrado" }
  | { readonly kind: "order_no_encontrada" }
  | { readonly kind: "orden_ya_procesada" }
  | { readonly kind: "persistence_error"; readonly cause: string };

export interface PayLoadSources {
  readonly tenantBySlug: (slug: string) => Promise<Result<TenantBranding | null, string>>;
  readonly orderById: (id: OrderId, tenantId: TenantId) => Promise<Result<OrderForPago | null, string>>;
  readonly itemsByQuote: (quoteId: QuoteId) => Promise<Result<readonly PagoOrderItem[], string>>;
}

export class LoadPagoPageHandler {
  constructor(private readonly src: PayLoadSources) {}

  async ejecutar(slug: string, orderId: OrderId): Promise<Result<PagoPageLoad, LoadPagoError>> {
    const t = await this.src.tenantBySlug(slug);
    if (!t.ok) return err({ kind: "persistence_error", cause: t.error });
    if (!t.value) return err({ kind: "tenant_no_encontrado" });
    const o = await this.src.orderById(orderId, t.value.id);
    if (!o.ok) return err({ kind: "persistence_error", cause: o.error });
    if (!o.value) return err({ kind: "order_no_encontrada" });
    if (o.value.status !== "pending") return err({ kind: "orden_ya_procesada" });
    let items: readonly PagoOrderItem[] = [];
    if (o.value.quoteId) {
      const i = await this.src.itemsByQuote(o.value.quoteId);
      if (!i.ok) return err({ kind: "persistence_error", cause: i.error });
      items = i.value;
    }
    return ok(Object.freeze({ tenant: t.value, order: o.value, items }));
  }
}