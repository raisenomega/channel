import { expect, test, vi } from "vitest";
import { rutaStripeWebhook } from "../../../src/commerce/presentation/routes/stripe-webhook.routes.ts";
import type { StripeWebhookHandler } from "../../../src/commerce/infrastructure/stripe-webhook.handler.ts";
import type { StripeSignatureVerifier } from "../../../src/commerce/infrastructure/stripe-signature.verifier.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const okHandler = { procesar: async () => ok({ kind: "ignored" } as const) } as unknown as StripeWebhookHandler;
const verifierOk = { verify: async () => ok(undefined) } as unknown as StripeSignatureVerifier;
const verifierFail = { verify: async () => err("firma_invalida" as const) } as unknown as StripeSignatureVerifier;

function ctx(raw: string, sig?: string): RequestContext {
  return { method: "POST", path: "/webhooks/stripe", headers: sig ? { "stripe-signature": sig } : {}, body: null, rawBody: raw, jwt: null } as RequestContext;
}

test("adversarial 1: sin header Stripe-Signature -> header_ausente", async () => {
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: verifierOk });
  const res = await route.handler(ctx("{}"));
  expect((res as { error: { kind: string } }).error.kind).toBe("header_ausente");
});

test("adversarial 2: header malformado -> header_malformado (via verify)", async () => {
  const v = { verify: async () => err("header_malformado" as const) } as unknown as StripeSignatureVerifier;
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: v });
  const res = await route.handler(ctx("{}", "abc"));
  expect((res as { error: { kind: string } }).error.kind).toBe("header_malformado");
});

test("adversarial 4: firma invalida -> firma_invalida", async () => {
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: verifierFail });
  const res = await route.handler(ctx("{}", "t=1,v1=bad"));
  expect((res as { error: { kind: string } }).error.kind).toBe("firma_invalida");
});

test("adversarial 3: timestamp fuera de tolerancia -> timestamp_fuera_de_tolerancia", async () => {
  const v = { verify: async () => err("timestamp_fuera_de_tolerancia" as const) } as unknown as StripeSignatureVerifier;
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: v });
  const res = await route.handler(ctx("{}", "t=100,v1=x"));
  expect((res as { error: { kind: string } }).error.kind).toBe("timestamp_fuera_de_tolerancia");
});

test("adversarial 6: account no existe -> tenant_not_found", async () => {
  const handler = { procesar: async () => ok({ kind: "tenant_not_found" } as const) } as unknown as StripeWebhookHandler;
  const route = rutaStripeWebhook({ webhookHandler: handler, verifier: verifierOk });
  const res = await route.handler(ctx(JSON.stringify({ id: "e", type: "payment_intent.succeeded", account: "acct_zz" }), "t=1,v1=x"));
  expect((res as { error: { kind: string } }).error.kind).toBe("tenant_not_found");
});

test("happy: firma valida + event procesado -> ok", async () => {
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: verifierOk });
  const res = await route.handler(ctx("{}", "t=1,v1=x"));
  expect((res as { ok: boolean }).ok).toBe(true);
});

test("usa rawBody para verificar firma (no body parseado)", async () => {
  const verifySpy = vi.fn().mockResolvedValue(ok(undefined));
  const v = { verify: verifySpy } as unknown as StripeSignatureVerifier;
  const route = rutaStripeWebhook({ webhookHandler: okHandler, verifier: v });
  const raw = '{"id":"evt_1"}';
  await route.handler(ctx(raw, "sig"));
  const arg = verifySpy.mock.calls[0]?.[0];
  expect(arg).toBe(raw);
});