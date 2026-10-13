import { Result, err, ok } from "../../shared/domain/result.ts";
import { QuoteId, ContactId, TenantId } from "../../shared/domain/ids.ts";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type CreateByType = "human" | "ai_agent";

export interface QuoteLineItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
}

export interface QuoteState {
  readonly id: QuoteId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly mode: "lite" | "nucleo_synced";
  readonly status: QuoteStatus;
  readonly totalAmount: number;
  readonly currency: string;
  readonly items: readonly QuoteLineItem[];
  readonly createdByType: CreateByType;
  readonly createdAt: Date;
}

export type QuoteError =
  | { readonly kind: "items_vacios" }
  | { readonly kind: "item_sin_descripcion" }
  | { readonly kind: "cantidad_invalida" }
  | { readonly kind: "precio_invalido" };

export const crearQuote = (
  contactId: ContactId,
  tenantId: TenantId,
  items: readonly QuoteLineItem[],
  createdByType: CreateByType = "human",
  mode: "lite" | "nucleo_synced" = "lite",
): Result<QuoteState, QuoteError> => {
  if (!items || items.length === 0) return err({ kind: "items_vacios" });
  for (const item of items) {
    if (!item.description?.trim()) return err({ kind: "item_sin_descripcion" });
    if (item.quantity < 1) return err({ kind: "cantidad_invalida" });
    if (item.unitPrice < 0) return err({ kind: "precio_invalido" });
  }
  const total = items.reduce((sum, i) => sum + i.total, 0);
  return ok(Object.freeze({
    id: crypto.randomUUID() as QuoteId,
    tenantId, contactId, mode,
    status: "draft" as QuoteStatus,
    totalAmount: total,
    currency: "USD",
    items: Object.freeze(items),
    createdByType,
    createdAt: new Date(),
  }));
};

export const aceptarQuote = (quote: QuoteState): QuoteState =>
  Object.freeze({ ...quote, status: "accepted" as QuoteStatus });

export const rechazarQuote = (quote: QuoteState): QuoteState =>
  Object.freeze({ ...quote, status: "rejected" as QuoteStatus });