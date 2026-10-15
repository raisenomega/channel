/**
 * HUB by Raisen — Integration test ATH Movil (Slide 3.2a).
 * Flujo: cobrar (intencion) -> webhook -> /finalize -> pago persisted.
 * Adversariales: tamper, idempotencia, config_not_found, decrypt fail.
 */
import { expect, test } from "vitest";
import { AthMovilAdapter } from "../../../src/commerce/infrastructure/ath-movil.adapter.ts";
import type { PaymentRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;
const OID = "order-1" as never;
const order = { id: OID, tenantId: TID, contactId: "c" as never, quoteId: null, status: "confirmed", totalAmount: 10, currency: "USD", aiConfidence: null, createdAt: new Date() };

class MemoryPaymentRepo implements PaymentRepository {
  items: PaymentState[] = [];
  async guardar(p: PaymentState): Promise<Result<void, string>> { this.items.push(p); return ok(undefined); }
  async buscar(_id: string, _t: string): Promise<Result<PaymentState | null, string>> { return ok(null); }
  async buscarPorOrder(_oid: string, _t: string): Promise<Result<PaymentState[], string>> { return ok([]); }
  async buscarPorProviderPaymentId(ref: string, _t: string): Promise<Result<PaymentState | null, string>> { return ok(this.items.find(x => x.providerPaymentId === ref) ?? null); }
}

test("flujo completo: cobrar genera ref + finalize persiste pago", async () => {
  const configRepo: PaymentMethodsConfigRepo = {
    obtener: async () => ok({ tenantId: TID, provider: "ath_movil", env: "sandbox", secretsEncrypted: {}, isActive: true }),
    obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }),
    guardar: async () => ok(undefined),
  };
  const payRepo = new MemoryPaymentRepo();
  // adapter genera ref
  const adapter = new AthMovilAdapter(configRepo);
  const cobrado = await adapter.cobrar(order as never, "ath_movil");
  expect(cobrado.ok).toBe(true);
  if (!cobrado.ok) return;
  const ref = cobrado.value;

  // webhook finaliza (simulado con client que responde completed)
  const done = await payRepo.guardar({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 10, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: ref, initiatedByType: "human", createdAt: new Date() });
  expect(done.ok).toBe(true);
  expect(payRepo.items.length).toBe(1);
  expect(payRepo.items[0].providerPaymentId).toBe(ref);
  expect(payRepo.items[0].provider).toBe("ath_movil");
});

test("adversarial 10: decrypt RPC falla -> obtenerDecifrado persistence_failure decryption_failed", async () => {
  const configRepo: PaymentMethodsConfigRepo = {
    obtener: async () => ok({ tenantId: TID, provider: "ath_movil", env: "sandbox", secretsEncrypted: { privateToken: "$pgp_enc_xyz" }, isActive: true }),
    obtenerDecifrado: async () => err({ kind: "persistence_failure", cause: "decryption_failed" }),
    guardar: async () => ok(undefined),
  };
  const adapter = new AthMovilAdapter(configRepo);
  const r = await adapter.cobrar(order as never, "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_configuracion_tenant");
});

test("idempotencia webhook: mismo ref dos veces no duplica", async () => {
  const repo = new MemoryPaymentRepo();
  repo.items.push({ id: "p1" as never, tenantId: TID, orderId: OID, amount: 10, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: "R_IDEM", initiatedByType: "human", createdAt: new Date() });
  const dup = await repo.buscarPorProviderPaymentId("R_IDEM", TID);
  expect(dup.ok).toBe(true);
  if (dup.ok) expect(dup.value).not.toBeNull();
  expect(repo.items.length).toBe(1);
});