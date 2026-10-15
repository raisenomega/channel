/**
 * HUB by Raisen — Handler webhook Stripe. Mapea eventos a PaymentState,
 * idempotencia por providerPaymentId. Nunca loguea crudos. C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { TenantId, OrderId } from "../../shared/domain/ids.ts";
import type { PaymentRepository, RepoError } from "../domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../application/payment-methods-config.repo.ts";
import { crearPayment, transicionarPayment } from "../domain/payment.entity.ts";
import type { PaymentStatus } from "../domain/payment.entity.ts";

export interface StripeEvent {
  readonly id: string;
  readonly type: string;
  readonly account?: string;
  readonly data: { readonly object: Record<string, unknown> };
}

export type WebhookResult =
  | { readonly kind: "ignored" }
  | { readonly kind: "created"; readonly paymentId: string }
  | { readonly kind: "duplicate" }
  | { readonly kind: "tenant_not_found" }
  | { readonly kind: "error"; readonly cause: string };

function repoErr(e: RepoError): string { return e.kind === "not_found" ? "not_found" : e.cause; }

export class StripeWebhookHandler {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly configRepo: PaymentMethodsConfigRepo,
  ) {}

  async procesar(event: StripeEvent): Promise<Result<WebhookResult, string>> {
    if (!event.account) return ok({ kind: "ignored" });
    const cfg = await this.configRepo.findByStripeAccountId(event.account);
    if (!cfg.ok) return err(repoErr(cfg.error));
    if (!cfg.value) return ok({ kind: "tenant_not_found" });
    const tenantId = cfg.value.tenantId;

    if (event.type === "payment_intent.succeeded") return this.handleSucceeded(event, tenantId);
    if (event.type === "payment_intent.payment_failed") return this.setStatus(event, tenantId, "failed");
    if (event.type === "charge.refunded") return this.setStatus(event, tenantId, "refunded");
    if (event.type === "charge.disputed") return this.setStatus(event, tenantId, "disputed");
    return ok({ kind: "ignored" });
  }

  private async handleSucceeded(event: StripeEvent, tenantId: TenantId): Promise<Result<WebhookResult, string>> {
    const obj = event.data.object;
    const piId = String(obj.id ?? "");
    const dup = await this.paymentRepo.buscarPorProviderPaymentId(piId, tenantId);
    if (!dup.ok) return err(repoErr(dup.error));
    if (dup.value) return ok({ kind: "duplicate" });

    const orderId = String((obj.metadata as Record<string, unknown> | undefined)?.order_id ?? "");
    const amount = Number(obj.amount ?? 0) / 100;
    const payment = crearPayment(orderId as OrderId, tenantId, amount, "stripe", "human", piId);
    if (!payment.ok) return ok({ kind: "error", cause: payment.error.kind });
    const saved = await this.paymentRepo.guardar({ ...payment.value, status: "completed" });
    if (!saved.ok) return err(repoErr(saved.error));
    return ok({ kind: "created", paymentId: payment.value.id });
  }

  private async setStatus(event: StripeEvent, tenantId: TenantId, status: PaymentStatus): Promise<Result<WebhookResult, string>> {
    const piId = String(event.data.object.payment_intent ?? event.data.object.id ?? "");
    const existing = await this.paymentRepo.buscarPorProviderPaymentId(piId, tenantId);
    if (!existing.ok) return err(repoErr(existing.error));
    if (!existing.value) return ok({ kind: "duplicate" });
    const next = transicionarPayment(existing.value, status);
    if (!next.ok) return ok({ kind: "error", cause: next.error.kind });
    await this.paymentRepo.guardar({ ...existing.value, status });
    return ok({ kind: "created", paymentId: existing.value.id });
  }
}