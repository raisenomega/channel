import { expect, test, vi } from "vitest";
import { StripeApiClient } from "../../../src/commerce/infrastructure/stripe-api.client.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const client = new StripeApiClient("sk_test", "2024-10-28.acacia");

test("crearPaymentIntent: headers correctos (auth, version, account, idempotency)", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "pi_1", status: "requires_payment_method", amount: 1000 }), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const r = await client.crearPaymentIntent({ amount: 1000, currency: "usd", stripeAccount: "acct_x", idempotencyKey: "o1_charge" });
  expect(r.ok).toBe(true);
  const [url, opts] = spy.mock.calls[0] as [string, RequestInit];
  expect(String(url)).toContain("/payment_intents");
  const headers = opts.headers as Record<string, string>;
  expect(headers["Authorization"]).toBe("Bearer sk_test");
  expect(headers["Stripe-Version"]).toBe("2024-10-28.acacia");
  expect(headers["Stripe-Account"]).toBe("acct_x");
  expect(headers["Idempotency-Key"]).toBe("o1_charge");
  restoreFetch();
});

test("adversarial 10: crearPaymentIntent status 401 -> http_401", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  const r = await client.crearPaymentIntent({ amount: 1000, currency: "usd", stripeAccount: "acct_x", idempotencyKey: "k" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("http_401");
  restoreFetch();
});

test("crearRefund envia payment_intent + account", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "re_1" }), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const r = await client.crearRefund({ paymentIntent: "pi_x", stripeAccount: "acct_y", idempotencyKey: "p1_refund" });
  expect(r.ok).toBe(true);
  const [, opts] = spy.mock.calls[0] as [string, RequestInit];
  const headers = opts.headers as Record<string, string>;
  expect(headers["Idempotency-Key"]).toBe("p1_refund");
  restoreFetch();
});

test("crearAccountLink retorna url", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: "https://connect.stripe.com/setup/abc" }), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const r = await client.crearAccountLink({ account: "acct_z", refreshUrl: "https://x/refresh", returnUrl: "https://x/return" });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.url).toContain("stripe.com");
  restoreFetch();
});