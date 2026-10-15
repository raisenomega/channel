/**
 * HUB by Raisen — Integration test Stripe (Slide 3.2b).
 * Flujo: webhook payment_intent.succeeded -> persist pago completed + idempotencia.
 */
import { expect, test } from "vitest";
import { StripeWebhookHandler } from "../../../src/commerce/infrastructure/stripe-webhook.handler.ts";
import type { PaymentRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import { ok } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;

class MemoryPaymentRepo implements PaymentRepository {
  items: PaymentState[] = [];
  async guardar(p: PaymentState): Promise<Result<void, string>> {
    const idx = this.items.findIndex((x) => x.id === p.id);
    if (idx >= 0) this.items[idx] = p; else this.items.push(p);
    return ok(undefined);
  }
  async buscar(_id: string, _t: string): Promise<Result<PaymentState | null, string>> { return ok(null); }
  async buscarPorOrder(_oid: string, _t: string): Promise<Result<PaymentState[], string>> { return ok([]); }
  async buscarPorProviderPaymentId(ref: string, _t: string): Promise<Result<PaymentState | null, string>> { return ok(this.items.find(x => x.providerPaymentId === ref) ?? null); }
}

const cfgRepo: PaymentMethodsConfigRepo = {
  obtener: async () => ok(null),
  obtenerDecifrado: async () => ok({}),
  findByStripeAccountId: async () => ok({ tenantId: TID, provider: "stripe" as const, env: "prod" as const, config: { stripe_account_id: "acct_x" }, secretsEncrypted: {}, isActive: true }),
  guardar: async () => ok(undefined),
};

test("payment_intent.succeeded persiste pago completed + idempotencia", async () => {
  const repo = new MemoryPaymentRepo();
  const handler = new StripeWebhookHandler(repo, cfgRepo);
  const event = { id: "evt_1", type: "payment_intent.succeeded", account: "acct_x", data: { object: { id: "pi_1", amount: 1000, metadata: { order_id: "order-1" } } } };

  const r1 = await handler.procesar(event);
  expect(r1.ok).toBe(true);
  if (r1.ok) {
    expect(r1.value.kind).toBe("created");
    expect(repo.items.length).toBe(1);
    expect(repo.items[0].providerPaymentId).toBe("pi_1");
    expect(repo.items[0].status).toBe("completed");
    expect(repo.items[0].amount).toBe(10);
  }

  const r2 = await handler.procesar(event);
  expect(r2.ok).toBe(true);
  if (r2.ok) expect(r2.value.kind).toBe("duplicate");
  expect(repo.items.length).toBe(1);
});

test("account no configurado -> tenant_not_found", async () => {
  const repoConfig: PaymentMethodsConfigRepo = { ...cfgRepo, findByStripeAccountId: async () => ok(null) };
  const handler = new StripeWebhookHandler(new MemoryPaymentRepo(), repoConfig);
  const r = await handler.procesar({ id: "e", type: "payment_intent.succeeded", account: "acct_unknown", data: { object: { id: "pi" } } });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.kind).toBe("tenant_not_found");
});

test("evento no relevante -> ignored", async () => {
  const handler = new StripeWebhookHandler(new MemoryPaymentRepo(), cfgRepo);
  const r = await handler.procesar({ id: "e", type: "ping", account: "acct_x", data: { object: {} } });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.kind).toBe("ignored");
});

test("charge.refunded -> pago a refunded", async () => {
  const repo = new MemoryPaymentRepo();
  repo.items.push({ id: "p1" as never, tenantId: TID, orderId: "o1" as never, amount: 10, currency: "USD", status: "completed", provider: "stripe", providerPaymentId: "pi_r", initiatedByType: "human", createdAt: new Date() });
  const handler = new StripeWebhookHandler(repo, cfgRepo);
  const r = await handler.procesar({ id: "e", type: "charge.refunded", account: "acct_x", data: { object: { payment_intent: "pi_r" } } });
  expect(r.ok).toBe(true);
  expect(repo.items[0].status).toBe("refunded");
});