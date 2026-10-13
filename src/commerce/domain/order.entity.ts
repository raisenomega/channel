import { Result, err, ok } from "../../shared/domain/result.ts";
import { OrderId, ContactId, TenantId, QuoteId } from "../../shared/domain/ids.ts";

export type OrderStatus = "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderState {
  readonly id: OrderId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly quoteId: QuoteId | null;
  readonly status: OrderStatus;
  readonly totalAmount: number;
  readonly currency: string;
  readonly aiConfidence: number | null;
  readonly createdAt: Date;
}

export type OrderError =
  | { readonly kind: "total_invalido" }
  | { readonly kind: "transicion_invalida" };

const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped", "refunded" as never, "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const crearOrder = (
  contactId: ContactId,
  tenantId: TenantId,
  totalAmount: number,
  quoteId: QuoteId | null = null,
  aiConfidence: number | null = null,
): Result<OrderState, OrderError> => {
  if (totalAmount <= 0) return err({ kind: "total_invalido" });
  return ok(Object.freeze({
    id: crypto.randomUUID() as OrderId,
    tenantId, contactId, quoteId,
    status: "pending" as OrderStatus,
    totalAmount, currency: "USD",
    aiConfidence,
    createdAt: new Date(),
  }));
};

export const transicionarOrder = (
  order: OrderState,
  nuevoStatus: OrderStatus,
): Result<OrderState, OrderError> => {
  const permitidas = ORDER_TRANSITIONS[order.status];
  if (!permitidas?.includes(nuevoStatus)) {
    return err({ kind: "transicion_invalida" });
  }
  return ok(Object.freeze({ ...order, status: nuevoStatus }));
};