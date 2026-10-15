import { expect, test } from "vitest";
import { AthMovilAdapter } from "../../../src/commerce/infrastructure/ath-movil.adapter.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { PaymentRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type { AuthTokenCrypto } from "../../../src/commerce/infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;
const CID = "contact-1" as never;

function order(monto: number): OrderState {
  return { id: "o1" as never, tenantId: TID, contactId: CID, quoteId: null, status: "confirmed", totalAmount: monto, currency: "USD", aiConfidence: null, createdAt: new Date() };
}

function crypto(cifra = "enc-jwt", okDecifra = true): AuthTokenCrypto {
  return {
    cifrar: async () => ok(cifra),
    descifrar: async () => (okDecifra ? ok("jwt") : err({ kind: "descifrado_fallido", cause: "x" })),
  };
}

class MemoryPayRepo implements PaymentRepository {
  items: PaymentState[] = [];
  async guardar(p: PaymentState) { this.items.push(p); return ok(undefined); }
  async buscar() { return ok(null); }
  async buscarPorOrder() { return ok([]); }
  async buscarPorProviderPaymentId() { return ok(null); }
}

function clientStub(ecommerceId = "ECO-REAL", authToken = "auth.jwt"): (pub: string, prv: string) => AthMovilApiClient {
  return () => ({
    crearPago: async () => ok({ ecommerceId, authToken }),
    actualizarTelefono: async () => ok(undefined),
    buscarPago: async () => ok({ ecommerceId, referenceNumber: "", estado: "CONFIRM", total: 0, fee: 0, netAmount: 0, date: "" }),
    autorizar: async () => ok({ ecommerceId, referenceNumber: "", estado: "COMPLETED", total: 0, fee: 0, netAmount: 0, date: "" }),
  } as unknown as AthMovilApiClient);
}

function repo(over?: Partial<PaymentMethodsConfigRepo>): PaymentMethodsConfigRepo {
  return { obtener: async () => ok(null), obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }), guardar: async () => ok(undefined), ...over };
}

test("adversarial 1: cobrar total 0.99 → monto_debajo_minimo", async () => {
  const adapter = new AthMovilAdapter(repo(), new MemoryPayRepo(), crypto(), clientStub());
  const r = await adapter.cobrar(order(0.99), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("monto_debajo_minimo");
});

test("adversarial 2: cobrar total 1500.01 → monto_sobre_maximo", async () => {
  const adapter = new AthMovilAdapter(repo(), new MemoryPayRepo(), crypto(), clientStub());
  const r = await adapter.cobrar(order(1500.01), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("monto_sobre_maximo");
});

test("adversarial 3: tenant sin config → sin_configuracion_tenant", async () => {
  const adapter = new AthMovilAdapter(repo({ obtenerDecifrado: async () => err({ kind: "not_found" }) }), new MemoryPayRepo(), crypto(), clientStub());
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_configuracion_tenant");
});

test("adversarial 4: /payment http 500 → cobro_fallido causa http_500", async () => {
  const stub = () => ({ crearPago: async () => err("http_500"), actualizarTelefono: async () => ok(undefined), buscarPago: async () => err("http_500"), autorizar: async () => err("http_500") } as unknown as AthMovilApiClient);
  const adapter = new AthMovilAdapter(repo(), new MemoryPayRepo(), crypto(), stub);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_500");
});

test("adversarial: cifrado authToken falla → cobro_fallido cifrado_fallido", async () => {
  const cryptoFail = { cifrar: async () => err({ kind: "cifrado_fallido", cause: "x" }), descifrar: async () => err({ kind: "descifrado_fallido", cause: "x" }) };
  const adapter = new AthMovilAdapter(repo(), new MemoryPayRepo(), cryptoFail, clientStub());
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("cifrado_fallido");
});

test("happy: cobrar ok devuelve ecommerceId REAL y persiste pending con authToken cifrado", async () => {
  const payRepo = new MemoryPayRepo();
  const adapter = new AthMovilAdapter(repo(), payRepo, crypto("enc-jwt-abc"), clientStub("ECO-REAL-1", "auth.jwt"));
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value).toBe("ECO-REAL-1");
  expect(r.value).not.toMatch(/^ath_/);
  const saved = payRepo.items.find(p => p.providerPaymentId === "ECO-REAL-1");
  expect(saved).toBeDefined();
  expect(saved?.status).toBe("pending");
  expect(saved?.authTokenEncrypted).toBe("enc-jwt-abc");
  expect(saved?.amount).toBe(10);
});

test("stub: ATH_MOVIL_STUB=1 sin red → devuelve ecommerce stub y persiste", async () => {
  const payRepo = new MemoryPayRepo();
  const neverClient = () => { throw new Error("no network en stub"); };
  const adapter = new AthMovilAdapter(repo(), payRepo, crypto(), neverClient as never, true);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toMatch(/^ecommerce_stub_/);
  expect(payRepo.items.length).toBe(1);
});

test("reembolsar → no_implementado", async () => {
  const adapter = new AthMovilAdapter(repo(), new MemoryPayRepo(), crypto(), clientStub());
  const r = await adapter.reembolsar({ id: "p1" as never, tenantId: TID, orderId: "o1" as never, amount: 10, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: null, initiatedByType: "human", netAmount: null, authTokenEncrypted: null, createdAt: new Date() });
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("reembolso_fallido"); expect(r.error.cause).toBe("no_implementado"); }
});