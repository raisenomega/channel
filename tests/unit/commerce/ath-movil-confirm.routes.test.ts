import { expect, test, vi } from "vitest";
import { rutaAthMovilConfirm, AthConfirmDeps } from "../../../src/commerce/presentation/routes/ath-movil-confirm.routes.ts";
import type { PaymentRepository, OrderRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../../src/commerce/infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

vi.mock("../../../src/server/jwt-verify.ts", () => ({
  parsearJwtClaims: async (auth: string | null) =>
    auth ? ok({ userId: "u1", tenantId: "tenant-A", exp: 1e15 }) : err({ kind: "token_ausente" }),
}));

const TID = "tenant-A" as never;
const OID = "order-1" as never;

class MockPayRepo implements PaymentRepository {
  payments: PaymentState[] = [];
  async guardar(p: PaymentState) { this.payments = this.payments.map(x => x.id === p.id ? p : x); if (!this.payments.some(x => x.id === p.id)) this.payments.push(p); return ok(undefined); }
  async buscar() { return ok(null); }
  async buscarPorOrder() { return ok([]); }
  async buscarPorProviderPaymentId(pid: string, tenantId: string) { return ok(this.payments.find(p => p.providerPaymentId === pid && p.tenantId === tenantId) ?? null); }
}

class MockOrderRepo implements OrderRepository {
  order: OrderState;
  constructor(total: number) { this.order = { id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: total, currency: "USD", aiConfidence: null, createdAt: new Date() }; }
  async guardar() { return ok(undefined); }
  async buscar(_id: string, _t: string): Promise<Result<OrderState | null, never>> { return ok(this.order); }
  async buscarPorContacto() { return ok([]); }
}

function client(estado: "OPEN" | "CONFIRM" | "CANCEL" | "COMPLETED", opts?: { total: number; netAmount: number; referenceNumber: string; authorizeFail?: boolean }) {
  return () => ({
    buscarPago: async () => ok({ ecommerceId: "ECO-1", referenceNumber: opts?.referenceNumber ?? "", estado, total: opts?.total ?? 100, fee: 0, netAmount: opts?.netAmount ?? 100, date: "" }),
    autorizar: async () => (opts?.authorizeFail ? err("http_500") : ok({ ecommerceId: "ECO-1", referenceNumber: opts?.referenceNumber ?? "AUTH-1", estado: "COMPLETED", total: opts?.total ?? 100, fee: 0, netAmount: opts?.netAmount ?? 97.75, date: "" })),
  } as unknown as AthMovilApiClient);
}

function cryptoVal(): AuthTokenCrypto {
  return { cifrar: async () => ok("enc"), descifrar: async () => ok("auth.jwt") };
}

function ctx(jwt = "Bearer x", body: Record<string, unknown> = { ecommerceId: "ECO-1" }): RequestContext {
  return { method: "POST", path: "/commerce/ath-movil/confirm", headers: { authorization: jwt }, body, rawBody: JSON.stringify(body), jwt } as RequestContext;
}

function deps(pay: PaymentRepository, order: OrderRepository, c: (p: string, r: string) => AthMovilApiClient, cfg: PaymentMethodsConfigRepo): AthConfirmDeps {
  return { paymentRepo: pay, orderRepo: order, configRepo: cfg, crypto: cryptoVal(), makeClient: c };
}

function cfgOk(): PaymentMethodsConfigRepo {
  return { obtener: async () => ok(null), obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }), guardar: async () => ok(undefined) };
}

test("adversarial: sin JWT → token_ausente", async () => {
  const route = rutaAthMovilConfirm(deps(new MockPayRepo(), new MockOrderRepo(100), client("COMPLETED"), cfgOk()));
  const res = await route.handler(ctx(""));
  expect((res as { error: { kind: string } }).error.kind).toBe("token_ausente");
});

test("adversarial: findPayment OPEN → pending sin persistir", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("OPEN"), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { estado: string }).estado).toBe("pending");
  expect(pay.payments.length).toBe(1);
});

test("adversarial: findPayment CANCEL → failed sin persistir", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("CANCEL"), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { estado: string }).estado).toBe("failed");
  expect(pay.payments.length).toBe(1);
});

test("anti-tamper: authorize total 100 vs orden 10 → tamper_detected", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 10, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(10), client("COMPLETED", { total: 100, netAmount: 97.75, referenceNumber: "AUTH-1" }), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { error: { kind: string } }).error.kind).toBe("tamper_detected");
  expect(pay.payments[0]?.status).toBe("pending");
});

test("happy: CONFIRM → autorizar → COMPLETED persiste completed + netAmount + limpia token", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc-jwt", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("CONFIRM", { total: 100, netAmount: 97.75, referenceNumber: "AUTH-1" }), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { estado: string }).estado).toBe("completed");
  expect(pay.payments[0]?.status).toBe("completed");
  expect(pay.payments[0]?.netAmount).toBe(97.75);
  expect(pay.payments[0]?.providerPaymentId).toBe("AUTH-1");
  expect(pay.payments[0]?.authTokenEncrypted).toBeNull();
});

test("happy: findPayment ya COMPLETED → finaliza sin autorizar", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("COMPLETED", { total: 100, netAmount: 98, referenceNumber: "REF-FINAL" }), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { estado: string }).estado).toBe("completed");
  expect(pay.payments[0]?.providerPaymentId).toBe("REF-FINAL");
  expect(pay.payments[0]?.netAmount).toBe(98);
});

test("idempotencia: referenceNumber ya existente → idempotente, no duplica", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  pay.payments.push({ id: "p2" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: "AUTH-1", initiatedByType: "human", netAmount: 98, authTokenEncrypted: null, createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("COMPLETED", { total: 100, netAmount: 98, referenceNumber: "AUTH-1" }), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { idempotente: boolean }).idempotente).toBe(true);
  const completados = pay.payments.filter(p => p.status === "completed");
  expect(completados.length).toBe(1);
});

test("adversarial: cross-tenant — ecommerceId de otro tenant → pago_no_encontrado", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: "tenant-B" as never, orderId: OID, amount: 10, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("COMPLETED"), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { error: { kind: string } }).error.kind).toBe("pago_no_encontrado");
});

test("adversarial: tenant sin config → config_not_found", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const badCfg: PaymentMethodsConfigRepo = { obtener: async () => ok(null), obtenerDecifrado: async () => err({ kind: "not_found" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("COMPLETED"), badCfg));
  const res = await route.handler(ctx());
  expect((res as { error: { kind: string } }).error.kind).toBe("config_not_found");
});

test("adversarial: authorize 500 → authorize_error", async () => {
  const pay = new MockPayRepo();
  pay.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 100, currency: "USD", status: "pending", provider: "ath_movil", providerPaymentId: "ECO-1", initiatedByType: "human", netAmount: null, authTokenEncrypted: "enc", createdAt: new Date() });
  const route = rutaAthMovilConfirm(deps(pay, new MockOrderRepo(100), client("CONFIRM", { authorizeFail: true }), cfgOk()));
  const res = await route.handler(ctx());
  expect((res as { error: { kind: string } }).error.kind).toBe("authorize_error");
});