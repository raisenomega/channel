/**
 * HUB by Raisen — Integration test ATH Móvil REAL (3.2a-BIS).
 * Flujo Path A: cobrar(/payment) -> pending con authToken cifrado -> confirm(findPayment+authorize) -> COMPLETED con netAmount.
 */
import { expect, test, vi } from "vitest";
import { AthMovilAdapter } from "../../../src/commerce/infrastructure/ath-movil.adapter.ts";
import { rutaAthMovilConfirm } from "../../../src/commerce/presentation/routes/ath-movil-confirm.routes.ts";
import type { PaymentRepository, OrderRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { AuthTokenCrypto } from "../../../src/commerce/infrastructure/ath-token.crypto.ts";
import type { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

vi.mock("../../../src/server/jwt-verify.ts", () => ({
  parsearJwtClaims: async () => ok({ userId: "u1", tenantId: "tenant-1", exp: 1e15 }),
}));

const TID = "tenant-1" as never;
const OID = "order-1" as never;
const order: OrderState = { id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: 10, currency: "USD", aiConfidence: null, createdAt: new Date() };

class MemoryPayRepo implements PaymentRepository {
  items: PaymentState[] = [];
  async guardar(p: PaymentState) { this.items = this.items.map(x => x.id === p.id ? p : x); if (!this.items.some(x => x.id === p.id)) this.items.push(p); return ok(undefined); }
  async buscar() { return ok(null); }
  async buscarPorOrder() { return ok([]); }
  async buscarPorProviderPaymentId(pid: string): Promise<Result<PaymentState | null, never>> { return ok(this.items.find(x => x.providerPaymentId === pid) ?? null); }
}
class MemoryOrderRepo implements OrderRepository {
  async guardar() { return ok(undefined); }
  async buscar() { return ok(order); }
  async buscarPorContacto() { return ok([order]); }
}

const crypto = { cifrar: async () => ok("enc-jwt"), descifrar: async () => ok("auth.jwt") } satisfies AuthTokenCrypto;

function realClient(): (p: string, r: string) => AthMovilApiClient {
  return () => ({
    crearPago: async () => ok({ ecommerceId: "ECO-FLOW-1", authToken: "jwt.abc" }),
    buscarPago: async (eid) => ok({ ecommerceId: eid, referenceNumber: "", estado: pushConfirmed ? "CONFIRM" : "OPEN", total: 10, fee: 0.23, netAmount: 9.77, date: "" }),
    autorizar: async () => ok({ ecommerceId: "ECO-FLOW-1", referenceNumber: "REF-9", estado: "COMPLETED", total: 10, fee: 0.23, netAmount: 9.77, date: "" }),
  } as unknown as AthMovilApiClient);
}

let pushConfirmed = false;

const cfg: PaymentMethodsConfigRepo = {
  obtener: async () => ok(null),
  obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }),
  guardar: async () => ok(undefined),
};

function confirmCtx(): RequestContext {
  return { method: "POST", path: "/commerce/ath-movil/confirm", headers: { authorization: "Bearer x" }, body: { ecommerceId: "ECO-FLOW-1" }, rawBody: "", jwt: "x" } as RequestContext;
}

test("flujo Path A completo: cobrar -> confirm -> COMPLETED con netAmount", async () => {
  pushConfirmed = false;
  const payRepo = new MemoryPayRepo();
  const adapter = new AthMovilAdapter(cfg, payRepo, crypto, realClient());
  const cobrado = await adapter.cobrar(order, "ath_movil");
  expect(cobrado.ok).toBe(true);
  if (!cobrado.ok) return;
  expect(cobrado.value).toBe("ECO-FLOW-1");
  const pending = payRepo.items[0];
  expect(pending?.status).toBe("pending");
  expect(pending?.authTokenEncrypted).toBe("enc-jwt");

  // primer confirm: cliente aún no confirma el push -> OPEN -> pending
  const route = rutaAthMovilConfirm({ paymentRepo: payRepo, orderRepo: new MemoryOrderRepo(), configRepo: cfg, crypto, makeClient: realClient() });
  const first = await route.handler(confirmCtx());
  expect((first as { estado: string }).estado).toBe("pending");

  // el cliente confirma el push en su app -> CONFIRM -> authorize -> completed
  pushConfirmed = true;
  const second = await route.handler(confirmCtx());
  expect((second as { estado: string }).estado).toBe("completed");
  const done = payRepo.items[0];
  expect(done?.status).toBe("completed");
  expect(done?.providerPaymentId).toBe("REF-9");
  expect(done?.netAmount).toBe(9.77);
  expect(done?.authTokenEncrypted).toBeNull();
});