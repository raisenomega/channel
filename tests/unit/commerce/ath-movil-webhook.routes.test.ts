import { expect, test } from "vitest";
import { rutaAthMovilWebhook, AthWebhookDeps } from "../../../src/commerce/presentation/routes/ath-movil-webhook.routes.ts";
import type { PaymentRepository } from "../../../src/commerce/domain/commerce.repository.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";
import type { PaymentMethodsConfigRepo } from "../../../src/commerce/application/payment-methods-config.repo.ts";
import type { PaymentMethodsConfigState } from "../../../src/commerce/domain/payment-methods-config.entity.ts";
import type { RequestContext } from "../../../src/server/server-types.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const TID = "tenant-A" as never;
const OID = "order-1" as never;

class MockPaymentRepo implements PaymentRepository {
  payments: PaymentState[] = [];
  async guardar(p: PaymentState): Promise<Result<void, string>> { this.payments.push(p); return ok(undefined); }
  async buscar(_id: string, _t: string): Promise<Result<PaymentState | null, string>> { return ok(null); }
  async buscarPorOrder(_oid: string, _t: string): Promise<Result<PaymentState[], string>> { return ok([]); }
  async buscarPorProviderPaymentId(ref: string, _t: string): Promise<Result<PaymentState | null, string>> {
    return ok(this.payments.find(p => p.providerPaymentId === ref) ?? null);
  }
}

function makeConfig(secrets: Record<string, string>): PaymentMethodsConfigState {
  return { tenantId: TID, provider: "ath_movil", env: "sandbox", secretsEncrypted: secrets, isActive: true };
}

function makeClient(mode: "ok" | "tamper" | "cancelled" | "http500") {
  return () => ({
    async finalizar(_ref) {
      if (mode === "http500") return err("http_500");
      if (mode === "tamper") return ok({ referenceNumber: _ref, status: "completed" as const, total: 10.0, date: "" });
      if (mode === "cancelled") return ok({ referenceNumber: _ref, status: "cancelled" as const, total: 100.0, date: "" });
      return ok({ referenceNumber: _ref, status: "completed" as const, total: 100.0, date: "" });
    },
  });
}

function deps(paymentRepo: PaymentRepository, configRepo: PaymentMethodsConfigRepo, clientMode: "ok" | "tamper" | "cancelled" | "http500"): AthWebhookDeps {
  return { paymentRepo, configRepo, makeClient: makeClient(clientMode) as unknown as AthWebhookDeps["makeClient"] };
}

function ctx(tenantId: string, body: Record<string, unknown>): RequestContext {
  return { method: "POST", path: `/webhooks/ath-movil/${tenantId}`, headers: {}, body, rawBody: JSON.stringify(body), jwt: null } as RequestContext;
}

test("adversarial 1: webhook tenant sin config -> config_not_found", async () => {
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(null), obtenerDecifrado: async () => err({ kind: "not_found" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(new MockPaymentRepo(), configRepo, "ok"));
  const res = await route.handler(ctx("tenant-AAA", { referenceNumber: "R1", total: 100, metadata1: OID }));
  expect((res as { error: { kind: string } }).error.kind).toBe("config_not_found");
});

test("adversarial 2: body total 100 pero /finalize 10 -> tamper_detected", async () => {
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(makeConfig({})), obtenerDecifrado: async () => ok({ publicToken: "x", privateToken: "y" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(new MockPaymentRepo(), configRepo, "tamper"));
  const res = await route.handler(ctx("tenant-A", { referenceNumber: "R2", total: 100, metadata1: OID }));
  expect((res as { error: { kind: string } }).error.kind).toBe("tamper_detected");
});

test("adversarial 3: body completed pero /finalize cancelled -> ok sin persistir", async () => {
  const repo = new MockPaymentRepo();
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(makeConfig({})), obtenerDecifrado: async () => ok({ publicToken: "x", privateToken: "y" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(repo, configRepo, "cancelled"));
  const res = await route.handler(ctx("tenant-A", { referenceNumber: "R3", total: 100, metadata1: OID }));
  expect((res as { ok: boolean }).ok).toBe(true);
  expect(repo.payments.length).toBe(0);
});

test("adversarial 4: refNumber ya persistido -> ok idempotente sin duplicar", async () => {
  const repo = new MockPaymentRepo();
  repo.payments.push({ id: "p1" as never, tenantId: TID, orderId: OID as never, amount: 100, currency: "USD", status: "completed", provider: "ath_movil", providerPaymentId: "R4", initiatedByType: "human", createdAt: new Date() });
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(makeConfig({})), obtenerDecifrado: async () => ok({ publicToken: "x", privateToken: "y" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(repo, configRepo, "ok"));
  const res = await route.handler(ctx("tenant-A", { referenceNumber: "R4", total: 100, metadata1: OID }));
  expect((res as { ok: boolean }).ok).toBe(true);
  expect(repo.payments.length).toBe(1);
});

test("adversarial 5: tenant sin config 404 (cross-tenant)", async () => {
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(null), obtenerDecifrado: async () => err({ kind: "not_found" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(new MockPaymentRepo(), configRepo, "ok"));
  const res = await route.handler(ctx("tenant-B", { referenceNumber: "RB", total: 100, metadata1: OID }));
  expect((res as { error: { kind: string } }).error.kind).toBe("config_not_found");
});

test("adversarial 9: /finalize 500 -> finalize_error", async () => {
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(makeConfig({})), obtenerDecifrado: async () => ok({ publicToken: "x", privateToken: "y" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(new MockPaymentRepo(), configRepo, "http500"));
  const res = await route.handler(ctx("tenant-A", { referenceNumber: "R9", total: 100, metadata1: OID }));
  expect((res as { error: { kind: string } }).error.kind).toBe("finalize_error");
});

test("happy: /finalize ok -> persiste pago completed", async () => {
  const repo = new MockPaymentRepo();
  const configRepo: PaymentMethodsConfigRepo = { obtener: async () => ok(makeConfig({})), obtenerDecifrado: async () => ok({ publicToken: "x", privateToken: "y" }), guardar: async () => ok(undefined) };
  const route = rutaAthMovilWebhook(deps(repo, configRepo, "ok"));
  const res = await route.handler(ctx("tenant-A", { referenceNumber: "R_OK", total: 100, metadata1: OID }));
  expect((res as { ok: boolean }).ok).toBe(true);
  expect(repo.payments.length).toBe(1);
  expect(repo.payments[0].providerPaymentId).toBe("R_OK");
  expect(repo.payments[0].status).toBe("completed");
});