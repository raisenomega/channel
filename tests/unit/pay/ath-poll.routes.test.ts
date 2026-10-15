import { expect, test } from "vitest";
import { rutaAthPoll, AthPollDeps } from "../../../src/pay/presentation/routes/ath-poll.routes.ts";
import { LoadPagoPageHandler } from "../../../src/pay/application/load-pago-page.handler.ts";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";
import type { PaymentRepository, OrderRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../../src/commerce/infrastructure/ath-token.crypto.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";

const TID = "tenant-A" as never;
const OID = "order-1" as never;

const loader: LoadPagoPageHandler = { ejecutar: async () => ok({ tenant: { id: TID, slug: "z", name: "Z", logoUrl: null, primaryColor: null }, order: { id: OID, tenantId: TID, status: "pending", totalAmount: 100, currency: "USD", notes: null, quoteId: null }, items: [] }) } as unknown as LoadPagoPageHandler;
const rateOk: RateLimiter = { check: async () => ok({ allowed: true, retryAfterSeconds: 0 }) } as unknown as RateLimiter;

function paymentRepo(estado: "pending" | "completed", matching = true): PaymentRepository {
  const item = { id: "p1" as never, tenantId: TID, orderId: matching ? OID : ("order-X" as never), amount: 100, currency: "USD", status: estado, provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human" as const, netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() };
  return { guardar: async () => ok(undefined), buscar: async () => ok(null), buscarPorOrder: async () => ok([]), buscarPorProviderPaymentId: async () => ok(item) } as unknown as PaymentRepository;
}
const orderRepo: OrderRepository = { guardar: async () => ok(undefined), buscar: async () => ok({ id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: 100, currency: "USD", aiConfidence: null, createdAt: new Date() }), buscarPorContacto: async () => ok([]) } as unknown as OrderRepository;
const cfgOk: PaymentMethodsConfigRepo = { obtener: async () => ok(null), obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }), guardar: async () => ok(undefined) };
const crypto: AuthTokenCrypto = { cifrar: async () => ok("enc"), descifrar: async () => ok("jwt") };

type AthApiEstado = "OPEN" | "CONFIRM" | "COMPLETED" | "CANCEL";

function makeClient(estado: AthApiEstado): (p: string, r: string) => AthMovilApiClient {
  return () => ({ buscarPago: async () => ok({ ecommerceId: "ECO-1", referenceNumber: "", estado, total: 100, fee: 0, netAmount: 100, date: "" }), autorizar: async () => ok({ ecommerceId: "ECO-1", referenceNumber: "REF-1", estado: "COMPLETED", total: 100, fee: 0, netAmount: 98, date: "" }) } as unknown as AthMovilApiClient);
}

function deps(estado: AthApiEstado, over: Partial<AthPollDeps> = {}, matching = true): AthPollDeps {
  return { loader, rateLimiter: rateOk, paymentRepo: paymentRepo("pending", matching), orderRepo, configRepo: cfgOk, crypto, makeClient: makeClient(estado), ...over };
}

function ctx(ecommerceId = "ECO-1"): RequestContext {
  return { method: "GET", path: `/pay/z/order-1/ath-poll?ecommerceId=${ecommerceId}`, headers: {}, body: null, rawBody: null, jwt: null } as RequestContext;
}

test("poll OPEN -> pending", async () => {
  const route = rutaAthPoll(deps("OPEN"));
  const res = await route.handler(ctx()) as { status: number; body: string };
  expect(res.status).toBe(200);
  expect(JSON.parse(res.body).estado).toBe("pending");
});

test("poll CANCEL -> failed", async () => {
  const route = rutaAthPoll(deps("CANCEL"));
  const res = await route.handler(ctx()) as { body: string };
  expect(JSON.parse(res.body).estado).toBe("failed");
});

test("poll CONFIRM -> autorizar -> completed con referenceNumber", async () => {
  const route = rutaAthPoll(deps("CONFIRM"));
  const res = await route.handler(ctx()) as { body: string };
  const j = JSON.parse(res.body);
  expect(j.estado).toBe("completed");
  expect(j.referenceNumber).toBe("REF-1");
});

test("poll COMPLETED directo -> completed", async () => {
  const route = rutaAthPoll(deps("COMPLETED"));
  const res = await route.handler(ctx()) as { body: string };
  expect(JSON.parse(res.body).estado).toBe("completed");
});

test("adversarial: ecommerceId de otro order/tenant -> pending (mismatch)", async () => {
  const route = rutaAthPoll(deps("COMPLETED", {}, false));
  const res = await route.handler(ctx("ECO-X")) as { body: string };
  // lookup por ecommerceId ECO-X en tenant devuelve pending item de ECO-1 (mock confunde) -> se trata como pending
  expect(JSON.parse(res.body).estado).toBe("pending");
});

test("adversarial: rate limited -> 429", async () => {
  const rl: RateLimiter = { check: async () => err("rate_limited") } as unknown as RateLimiter;
  const route = rutaAthPoll(deps("OPEN", { rateLimiter: rl }));
  const res = await route.handler(ctx()) as { status: number };
  expect(res.status).toBe(429);
});