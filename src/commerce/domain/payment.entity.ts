import { Result, err, ok } from "../../shared/domain/result.ts";
import { PaymentId, OrderId, TenantId } from "../../shared/domain/ids.ts";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";
export type InitiatedByType = "human" | "ai_agent" | "automation";

export const MIN_MONTO = 1.00;
export const MAX_MONTO = 1500.00;

export interface PaymentState {
  readonly id: PaymentId; readonly tenantId: TenantId; readonly orderId: OrderId;
  readonly amount: number; readonly currency: string; readonly status: PaymentStatus;
  readonly provider: string; readonly providerPaymentId: string | null;
  readonly initiatedByType: InitiatedByType;
  readonly netAmount: number | null; readonly authTokenEncrypted: string | null;
  readonly createdAt: Date;
}

export type PaymentError =
  | { readonly kind: "monto_invalido" }
  | { readonly kind: "monto_debajo_minimo" }
  | { readonly kind: "monto_sobre_maximo" }
  | { readonly kind: "transicion_invalida" };

const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  pending: ["completed", "failed"], completed: ["refunded", "disputed"], failed: ["pending"],
  refunded: [], disputed: ["refunded", "completed"],
};

export const crearPayment = (
  orderId: OrderId, tenantId: TenantId, amount: number, provider: string,
  initiatedByType: InitiatedByType = "human", providerPaymentId: string | null = null,
  metadata: { readonly netAmount?: number | null; readonly authTokenEncrypted?: string | null } = {},
): Result<PaymentState, PaymentError> => {
  if (!Number.isFinite(amount) || amount <= 0) return err({ kind: "monto_invalido" });
  if (amount < MIN_MONTO) return err({ kind: "monto_debajo_minimo" });
  if (amount > MAX_MONTO) return err({ kind: "monto_sobre_maximo" });
  return ok(Object.freeze({
    id: crypto.randomUUID() as PaymentId, tenantId, orderId, amount, currency: "USD",
    status: "pending" as PaymentStatus, provider, providerPaymentId, initiatedByType,
    netAmount: metadata.netAmount ?? null, authTokenEncrypted: metadata.authTokenEncrypted ?? null,
    createdAt: new Date(),
  }));
};

export const transicionarPayment = (
  payment: PaymentState, nuevoStatus: PaymentStatus,
): Result<PaymentState, PaymentError> => {
  const permitidas = PAYMENT_TRANSITIONS[payment.status];
  if (!permitidas?.includes(nuevoStatus)) return err({ kind: "transicion_invalida" });
  return ok(Object.freeze({ ...payment, status: nuevoStatus }));
};

/** Confirma un cobro ATH: fija COMPLETED, netAmount y limpia el authToken transitorio. */
export const confirmarPaymentAth = (
  payment: PaymentState, providerPaymentId: string, netAmount: number,
): Result<PaymentState, PaymentError> => {
  const trans = transicionarPayment(payment, "completed");
  if (!trans.ok) return trans;
  return ok(Object.freeze({ ...trans.value, providerPaymentId, netAmount, authTokenEncrypted: null }));
};