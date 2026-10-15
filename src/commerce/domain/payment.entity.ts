import { Result, err, ok } from "../../shared/domain/result.ts";
import { PaymentId, OrderId, TenantId } from "../../shared/domain/ids.ts";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";
export type InitiatedByType = "human" | "ai_agent" | "automation";

export const MIN_MONTO = 1.00;

export interface PaymentState {
  readonly id: PaymentId;
  readonly tenantId: TenantId;
  readonly orderId: OrderId;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: string;
  readonly providerPaymentId: string | null;
  readonly initiatedByType: InitiatedByType;
  readonly createdAt: Date;
}

export type PaymentError =
  | { readonly kind: "monto_invalido" }
  | { readonly kind: "monto_debajo_minimo" }
  | { readonly kind: "transicion_invalida" };

const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  pending: ["completed", "failed"],
  completed: ["refunded", "disputed"],
  failed: ["pending"],
  refunded: [],
  disputed: ["refunded", "completed"],
};

export const crearPayment = (
  orderId: OrderId,
  tenantId: TenantId,
  amount: number,
  provider: string,
  initiatedByType: InitiatedByType = "human",
  providerPaymentId: string | null = null,
): Result<PaymentState, PaymentError> => {
  if (!Number.isFinite(amount) || amount <= 0) return err({ kind: "monto_invalido" });
  if (amount < MIN_MONTO) return err({ kind: "monto_debajo_minimo" });
  return ok(Object.freeze({
    id: crypto.randomUUID() as PaymentId,
    tenantId, orderId, amount,
    currency: "USD",
    status: "pending" as PaymentStatus,
    provider, providerPaymentId, initiatedByType,
    createdAt: new Date(),
  }));
};

export const transicionarPayment = (
  payment: PaymentState,
  nuevoStatus: PaymentStatus,
): Result<PaymentState, PaymentError> => {
  const permitidas = PAYMENT_TRANSITIONS[payment.status];
  if (!permitidas?.includes(nuevoStatus)) {
    return err({ kind: "transicion_invalida" });
  }
  return ok(Object.freeze({ ...payment, status: nuevoStatus }));
};