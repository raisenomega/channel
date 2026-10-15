/**
 * HUB by Raisen — Adapter Stripe Connect (PaymentGateway). Multi-tenant via
 * connected accounts. Reemplaza dead code S3.1-A. Fee 0 por ahora.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { OrderState } from "../domain/order.entity.ts";
import type { PaymentState } from "../domain/payment.entity.ts";
import type { PaymentGateway } from "../domain/commerce.repository.ts";
import type { PaymentError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import type { StripeApiClient } from "./stripe-api.client.ts";
import { MIN_MONTO } from "../domain/payment.entity.ts";

export class StripeAdapter implements PaymentGateway {
  constructor(
    private readonly configRepo: PaymentMethodsConfigRepo,
    private readonly client: StripeApiClient,
  ) {}

  async cobrar(order: OrderState, _metodo: string): Promise<Result<string, PaymentError>> {
    if (order.totalAmount < MIN_MONTO) return err({ kind: "cobro_fallido", cause: "monto_debajo_minimo" });
    const cfg = await this.configRepo.obtener(order.tenantId, "stripe");
    if (!cfg.ok || !cfg.value || !cfg.value.isActive) return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    const accountId = String(cfg.value.config["stripe_account_id"] ?? "");
    if (!accountId) return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    const pi = await this.client.crearPaymentIntent({
      amount: Math.round(order.totalAmount * 100),
      currency: order.currency.toLowerCase(),
      stripeAccount: accountId,
      idempotencyKey: `${order.id}_charge`,
      applicationFeeAmount: 0,
      metadata: { order_id: String(order.id) },
    });
    if (!pi.ok) return err({ kind: "cobro_fallido", cause: pi.error });
    return ok(pi.value.id);
  }
  /** Prepara un PaymentIntent listo para el frontend (Stripe Elements). Devuelve client_secret. */
  async preparar(order: OrderState): Promise<Result<{ paymentIntentId: string; clientSecret: string }, PaymentError>> {
    if (order.totalAmount < MIN_MONTO) return err({ kind: "cobro_fallido", cause: "monto_debajo_minimo" });
    const cfg = await this.configRepo.obtener(order.tenantId, "stripe");
    if (!cfg.ok || !cfg.value || !cfg.value.isActive) return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    const accountId = String(cfg.value.config["stripe_account_id"] ?? "");
    if (!accountId) return err({ kind: "cobro_fallido", cause: "sin_configuracion_tenant" });
    const pi = await this.client.crearPaymentIntent({
      amount: Math.round(order.totalAmount * 100),
      currency: order.currency.toLowerCase(),
      stripeAccount: accountId,
      idempotencyKey: `${order.id}_prepare`,
      applicationFeeAmount: 0,
      metadata: { order_id: String(order.id) },
    });
    if (!pi.ok) return err({ kind: "cobro_fallido", cause: pi.error });
    if (!pi.value.clientSecret) return err({ kind: "cobro_fallido", cause: "sin_client_secret" });
    return ok({ paymentIntentId: pi.value.id, clientSecret: pi.value.clientSecret });
  }

  async reembolsar(payment: PaymentState): Promise<Result<void, PaymentError>> {
    if (!payment.providerPaymentId) return err({ kind: "reembolso_fallido", cause: "sin_payment_intent" });
    const cfg = await this.configRepo.obtener(payment.tenantId, "stripe");
    if (!cfg.ok || !cfg.value) return err({ kind: "reembolso_fallido", cause: "sin_configuracion_tenant" });
    const accountId = String(cfg.value.config["stripe_account_id"] ?? "");
    if (!accountId) return err({ kind: "reembolso_fallido", cause: "sin_configuracion_tenant" });

    const refund = await this.client.crearRefund({
      paymentIntent: payment.providerPaymentId,
      stripeAccount: accountId,
      idempotencyKey: `${payment.id}_refund`,
    });
    if (!refund.ok) return err({ kind: "reembolso_fallido", cause: refund.error });
    return ok(undefined);
  }
}