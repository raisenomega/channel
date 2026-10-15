import { expect, test, vi } from "vitest";
import { AthMovilAdapter } from "../../../src/commerce/infrastructure/ath-movil.adapter.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const TID = "tenant-1" as never;
const CID = "contact-1" as never;

function order(monto: number): OrderState {
  return { id: "o1" as never, tenantId: TID, contactId: CID, quoteId: null, status: "confirmed", totalAmount: monto, currency: "USD", aiConfidence: null, createdAt: new Date() };
}

function makeRepo(overrides?: Partial<PaymentMethodsConfigRepo>): PaymentMethodsConfigRepo {
  return {
    obtener: async () => ok(null),
    obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }),
    guardar: async () => ok(undefined),
    ...overrides,
  };
}

test("adversarial 6: cobrar amount 0.99 -> monto_debajo_minimo", async () => {
  vi.clearAllMocks();
  const adapter = new AthMovilAdapter(makeRepo());
  const r = await adapter.cobrar(order(0.99), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("monto_debajo_minimo");
});

test("happy: cobrar con config DB devuelve refNumber", async () => {
  const repo = makeRepo({ obtenerDecifrado: async () => ok({ publicToken: "pub", privateToken: "prv" }) });
  const adapter = new AthMovilAdapter(repo);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toMatch(/^ath_/);
});

test("adversarial 7: cobrar tenant sin config (no sandbox) -> sin_configuracion_tenant", async () => {
  const repo = makeRepo({ obtenerDecifrado: async () => ok({}) });
  const adapter = new AthMovilAdapter(repo);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("sin_configuracion_tenant");
});

test("adversarial 8: config DB vacia y sin env sandbox -> no_credenciales_sandbox", async () => {
  vi.stubEnv("ATH_MOVIL_SANDBOX_PUBLIC_TOKEN", "");
  vi.stubEnv("ATH_MOVIL_SANDBOX_PRIVATE_TOKEN", "");
  const repo = makeRepo({ obtenerDecifrado: async () => err({ kind: "not_found" }) });
  const adapter = new AthMovilAdapter(repo);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("no_credenciales_sandbox");
  vi.unstubAllEnvs();
});

test("stub: config absent pero env sandbox presentes -> devuelve ref (modo dev)", async () => {
  vi.stubEnv("ATH_MOVIL_SANDBOX_PUBLIC_TOKEN", "pub-sandbox");
  vi.stubEnv("ATH_MOVIL_SANDBOX_PRIVATE_TOKEN", "prv-sandbox");
  const repo = makeRepo({ obtenerDecifrado: async () => err({ kind: "not_found" }) });
  const adapter = new AthMovilAdapter(repo);
  const r = await adapter.cobrar(order(10), "ath_movil");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toMatch(/^ath_/);
  vi.unstubAllEnvs();
});

test("reembolsar -> no_implementado_sprint3", async () => {
  const adapter = new AthMovilAdapter(makeRepo());
  const r = await adapter.reembolsar({ id: "p1" as never, tenantId: TID, orderId: "o1" as never, amount: 10, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: null, initiatedByType: "human", createdAt: new Date() });
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("reembolso_fallido"); expect(r.error.cause).toBe("no_implementado_sprint3"); }
});