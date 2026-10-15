/**
 * HUB by Raisen — Integration test flujo de pago (Slide 3.3).
 * Landing -> ath-charge -> ath-poll completado -> payment persist.
 */
import { expect, test } from "vitest";
import { LoadPagoPageHandler, PayLoadSources } from "../../../src/pay/application/load-pago-page.handler.ts";
import { rutaAthCharge } from "../../../src/pay/presentation/routes/charge-ath.routes.ts";
import { rutaAthPoll } from "../../../src/pay/presentation/routes/ath-poll.routes.ts";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";
import { generarCsrf } from "../../../src/pay/infrastructure/csrf-token.ts";
import type { PaymentRepository, OrderRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../../src/commerce/infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";
import { ok } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

process.env["CSRF_SECRET"] = "c".repeat(64);

const TID = "tenant-A" as never;
const OID = "order-1" as never;
const PAYLOAD = { tenant: { id: TID, slug: "zafacones", name: "Zafacones", logoUrl: null, primaryColor: null }, order: { id: OID, tenantId: TID, status: "pending", totalAmount: 100, currency: "USD", notes: null, quoteId: null }, items: [] };

const sources: PayLoadSources = {
  tenantBySlug: async () => ok(PAYLOAD.tenant),
  orderById: async () => ok(PAYLOAD.order),
  itemsByQuote: async () => ok([]),
};
const loader = new LoadPagoPageHandler(sources);
const rateOk: RateLimiter = { check: async () => ok({ allowed: true, retryAfterSeconds: 0 }) } as unknown as RateLimiter;

class MemoryPayRepo implements PaymentRepository {
  items: Array<{ providerPaymentId: string; orderId: string; tenantId: string; status: string; netAmount: number | null; authTokenEncrypted: string | null }> = [];
  async guardar(p: { providerPaymentId: string; orderId: string; tenantId: string; status: string; netAmount: number | null; authTokenEncrypted: string | null }) { this.items = this.items.map(x => x.providerPaymentId === p.providerPaymentId ? p : x); if (!this.items.some(x => x.providerPaymentId === p.providerPaymentId)) this.items.push(p); return ok(undefined); }
  async buscar() { return ok(null); }
  async buscarPorOrder() { return ok([]); }
  async buscarPorProviderPaymentId(pid: string) { return ok(this.items.find(x => x.providerPaymentId === pid) ?? null); }
}
const orderRepo: OrderRepository = { guardar: async () => ok(undefined), buscar: async () => ok({ id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: 100, currency: "USD", aiConfidence: null, createdAt: new Date() }), buscarPorContacto: async () => ok([]) } as unknown as OrderRepository;
const cfgOk: PaymentMethodsConfigRepo = { obtener: async () => ok(null), obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }), guardar: async () => ok(undefined) };
const crypto: AuthTokenCrypto = { cifrar: async () => ok("enc"), descifrar: async () => ok("jwt") };

function makeClient(estado: "CONFIRM"): (p: string, r: string) => AthMovilApiClient {
  return () => ({ buscarPago: async () => ok({ ecommerceId: "ECO-FLOW", referenceNumber: "", estado, total: 100, fee: 0, netAmount: 98, date: "" }), autorizar: async () => ok({ ecommerceId: "ECO-FLOW", referenceNumber: "REF-FLOW", estado: "COMPLETED", total: 100, fee: 0, netAmount: 98, date: "" }), crearPago: async () => ok({ ecommerceId: "ECO-FLOW", authToken: "jwt" }) } as unknown as AthMovilApiClient);
}

test("flujo completo: ath-charge crea pending; ath-poll CONFIRM completa con referenceNumber", async () => {
  const payRepo = new MemoryPayRepo();
  payRepo.items.push({ providerPaymentId: "ECO-FLOW", orderId: "order-1", tenantId: "tenant-A", status: "pending", netAmount: null, authTokenEncrypted: "enc" });

  const charge = rutaAthCharge({ loader, rateLimiter: rateOk, adapter: { cobrar: async () => ok("ECO-FLOW"), reembolsar: async () => ok(undefined) } as never });
  const csrf = await generarCsrf("order-1");
  const token = csrf.ok ? csrf.value : "";
  const chargeRes = await charge.handler({ method: "POST", path: "/pay/zafacones/order-1/ath-charge", headers: { "x-csrf-token": token }, body: { phoneNumber: "7875551234" }, rawBody: "", jwt: null } as never) as { status: number; body: string };
  expect(chargeRes.status).toBe(200);
  expect(JSON.parse(chargeRes.body).ecommerceId).toBe("ECO-FLOW");

  const poll = rutaAthPoll({ loader, rateLimiter: rateOk, paymentRepo: payRepo as never, orderRepo, configRepo: cfgOk, crypto, makeClient: makeClient("CONFIRM") as never });
  const pollCtx = { method: "GET", path: "/pay/zafacones/order-1/ath-poll?ecommerceId=ECO-FLOW", headers: {}, body: null, rawBody: null, jwt: null } as never;
  const pollRes = await poll.handler(pollCtx) as { status: number; body: string };
  expect(pollRes.status).toBe(200);
  const j = JSON.parse(pollRes.body);
  expect(j.estado).toBe("completed");
  expect(j.referenceNumber).toBe("REF-FLOW");
  const persisted = payRepo.items.find(x => x.providerPaymentId === "REF-FLOW");
  expect(persisted?.status).toBe("completed");
  expect(persisted?.netAmount).toBe(98);
});