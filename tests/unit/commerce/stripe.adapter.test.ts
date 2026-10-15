import { expect, test, vi } from "vitest";
import { StripeAdapter } from "../../../src/commerce/infrastructure/stripe.adapter.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { PaymentMethodsConfigState } from "../../../src/commerce/domain/payment-methods-config.entity.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type { StripeApiClient } from "../../../src/commerce/infrastructure/stripe-api.client.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;
function order(monto: number): OrderState {
  return { id: "o1" as never, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: monto, currency: "USD", aiConfidence: null, createdAt: new Date() };
}
function config(accountId = "acct_1"): PaymentMethodsConfigState {
  return { tenantId: TID, provider: "stripe", env: "prod", config: { stripe_account_id: accountId, connect_type: "express" }, secretsEncrypted: {}, isActive: true };
}
const cfgRepo: PaymentMethodsConfigRepo = {
  obtener: async () => ok(config()),
  obtenerDecifrado: async () => ok({}),
  findByStripeAccountId: async () => ok(config()),
  guardar: async () => ok(undefined),
};

test("happy: cobrar crea PaymentIntent y devuelve pi_id", async () => {
  const client = { crearPaymentIntent: async () => ok({ id: "pi_abc", status: "requires_payment_method", amount: 1000 }) } as unknown as StripeApiClient;
  const adapter = new StripeAdapter(cfgRepo, client);
  const r = await adapter.cobrar(order(10), "card");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe("pi_abc");
});

test("adversarial 8: tenant sin config stripe -> sin_configuracion_tenant", async () => {
  const repo: PaymentMethodsConfigRepo = { ...cfgRepo, obtener: async () => ok(null) };
  const client = { crearPaymentIntent: async () => ok({ id: "x", status: "s", amount: 1 }) } as unknown as StripeApiClient;
  const r = await new StripeAdapter(repo, client).cobrar(order(10), "card");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_configuracion_tenant");
});

test("adversarial 9: amount centavos < 100 -> monto_debajo_minimo", async () => {
  const client = { crearPaymentIntent: async () => ok({ id: "x", status: "s", amount: 1 }) } as unknown as StripeApiClient;
  const r = await new StripeAdapter(cfgRepo, client).cobrar(order(0.99), "card");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("monto_debajo_minimo");
});

test("adversarial 13: reembolsar sin providerPaymentId -> sin_payment_intent", async () => {
  const client = { crearRefund: async () => ok({ id: "r" }) } as unknown as StripeApiClient;
  const payment = { id: "p1" as never, tenantId: TID, orderId: "o1" as never, amount: 10, currency: "USD", status: "completed", provider: "stripe", providerPaymentId: null, initiatedByType: "human" as const, netAmount: null, authTokenEncrypted: null, createdAt: new Date() };
  const r = await new StripeAdapter(cfgRepo, client).reembolsar(payment);
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("reembolso_fallido"); expect(r.error.cause).toBe("sin_payment_intent"); }
});

// ---- 3.2b-BIS: preparar() expone client_secret ----

function piClient(clientSecret = "pi_secret_abc"): StripeApiClient {
  return { crearPaymentIntent: async () => ok({ id: "pi_1", clientSecret, status: "requires_payment_method", amount: 1000 }) } as unknown as StripeApiClient;
}

test("preparar happy: devuelve paymentIntentId + clientSecret", async () => {
  const adapter = new StripeAdapter(cfgRepo, piClient("pi_secret_abc"));
  const r = await adapter.preparar(order(10));
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.paymentIntentId).toBe("pi_1"); expect(r.value.clientSecret).toBe("pi_secret_abc"); }
});

test("preparar tenant sin config -> sin_configuracion_tenant", async () => {
  const repo: PaymentMethodsConfigRepo = { ...cfgRepo, obtener: async () => ok(null) };
  const r = await new StripeAdapter(repo, piClient()).preparar(order(10));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_configuracion_tenant");
});

test("preparar idempotente: 2 llamadas mismo order -> mismo clientSecret (misma idempotency key)", async () => {
  const spy = vi.fn().mockResolvedValue(ok({ id: "pi_1", clientSecret: "pi_secret_same", status: "requires_payment_method", amount: 1000 }));
  const client = { crearPaymentIntent: spy } as unknown as StripeApiClient;
  const adapter = new StripeAdapter(cfgRepo, client);
  const a = await adapter.preparar(order(10));
  const b = await adapter.preparar(order(10));
  expect(a.ok && b.ok).toBe(true);
  if (a.ok && b.ok) {
    expect(a.value.clientSecret).toBe("pi_secret_same");
    expect(b.value.clientSecret).toBe(a.value.clientSecret);
  }
  const keys = spy.mock.calls.map((c) => (c[0] as { idempotencyKey: string }).idempotencyKey);
  expect(keys[0]).toBe("o1_prepare");
  expect(keys[1]).toBe("o1_prepare");
});

test("preparar cantidad < MIN -> monto_debajo_minimo", async () => {
  const r = await new StripeAdapter(cfgRepo, piClient()).preparar(order(0.99));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("monto_debajo_minimo");
});

test("preparar sin client_secret en respuesta -> error sin_client_secret", async () => {
  const client = { crearPaymentIntent: async () => ok({ id: "pi_2", clientSecret: "", status: "requires_payment_method", amount: 1000 }) } as unknown as StripeApiClient;
  const r = await new StripeAdapter(cfgRepo, client).preparar(order(10));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_client_secret");
});