import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { ProcessPaymentHandler, ProcessPaymentCommand } from "../../../src/commerce/application/process-payment.handler.ts";
import { OrderRepository, PaymentRepository, PaymentGateway, RepoError, PaymentError } from "../../../src/commerce/domain/commerce.repository.ts";
import { OrderState } from "../../../src/commerce/domain/order.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const OID = crypto.randomUUID() as never;

const orderFixture: OrderState = Object.freeze({
  id: OID,
  tenantId: TID,
  contactId: CID,
  quoteId: null,
  status: "confirmed",
  totalAmount: 250,
  currency: "USD",
  aiConfidence: null,
  createdAt: new Date(),
});

test("ProcessPaymentHandler â€” debe procesar pago exitosamente", async () => {
  const mockOrderRepo: OrderRepository = {
    buscar: async (_id) => ok(orderFixture),
    guardar: async (_o) => ok(undefined),
    buscarPorContacto: async (_cid) => ok([]),
  };

  const mockPaymentRepo: PaymentRepository = {
    guardar: async (_p) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorOrder: async (_oid) => ok([]),
  };

  const mockGateway: PaymentGateway = {
    cobrar: async (_o, _m) => ok("txn_abc123"),
    reembolsar: async (_p) => ok(undefined),
  };

  const handler = new ProcessPaymentHandler(mockOrderRepo, mockPaymentRepo, mockGateway);
  const cmd: ProcessPaymentCommand = { orderId: OID, method: "credit_card" };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
});

test("ProcessPaymentHandler â€” debe fallar si orden no se encuentra (error repo)", async () => {
  const mockOrderRepo: OrderRepository = {
    buscar: async (_id) => err({ kind: "persistence_failure", cause: "db_down" }),
    guardar: async (_o) => ok(undefined),
    buscarPorContacto: async (_cid) => ok([]),
  };

  const mockPaymentRepo: PaymentRepository = {
    guardar: async (_p) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorOrder: async (_oid) => ok([]),
  };

  const mockGateway: PaymentGateway = {
    cobrar: async (_o, _m) => ok("txn_abc"),
    reembolsar: async (_p) => ok(undefined),
  };

  const handler = new ProcessPaymentHandler(mockOrderRepo, mockPaymentRepo, mockGateway);
  const cmd: ProcessPaymentCommand = { orderId: OID, method: "credit_card" };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});

test("ProcessPaymentHandler â€” debe fallar si orden es null (no encontrada)", async () => {
  const mockOrderRepo: OrderRepository = {
    buscar: async (_id) => ok(null),
    guardar: async (_o) => ok(undefined),
    buscarPorContacto: async (_cid) => ok([]),
  };

  const mockPaymentRepo: PaymentRepository = {
    guardar: async (_p) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorOrder: async (_oid) => ok([]),
  };

  const mockGateway: PaymentGateway = {
    cobrar: async (_o, _m) => ok("txn_abc"),
    reembolsar: async (_p) => ok(undefined),
  };

  const handler = new ProcessPaymentHandler(mockOrderRepo, mockPaymentRepo, mockGateway);
  const cmd: ProcessPaymentCommand = { orderId: OID, method: "credit_card" };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("orden_no_encontrada");
});

test("ProcessPaymentHandler â€” debe fallar si gateway.cobrar falla", async () => {
  const mockOrderRepo: OrderRepository = {
    buscar: async (_id) => ok(orderFixture),
    guardar: async (_o) => ok(undefined),
    buscarPorContacto: async (_cid) => ok([]),
  };

  const mockPaymentRepo: PaymentRepository = {
    guardar: async (_p) => ok(undefined),
    buscar: async (_id) => ok(null),
    buscarPorOrder: async (_oid) => ok([]),
  };

  const mockGateway: PaymentGateway = {
    cobrar: async (_o, _m) => err({ kind: "cobro_fallido", cause: "fondos_insuficientes" }),
    reembolsar: async (_p) => ok(undefined),
  };

  const handler = new ProcessPaymentHandler(mockOrderRepo, mockPaymentRepo, mockGateway);
  const cmd: ProcessPaymentCommand = { orderId: OID, method: "credit_card" };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("cobro_fallido");
  expect(result.error.cause).toBe("fondos_insuficientes");
});

test("ProcessPaymentHandler â€” debe fallar si paymentRepo.guardar falla", async () => {
  const mockOrderRepo: OrderRepository = {
    buscar: async (_id) => ok(orderFixture),
    guardar: async (_o) => ok(undefined),
    buscarPorContacto: async (_cid) => ok([]),
  };

  const mockPaymentRepo: PaymentRepository = {
    guardar: async (_p) => err({ kind: "persistence_failure", cause: "disk_full" }),
    buscar: async (_id) => ok(null),
    buscarPorOrder: async (_oid) => ok([]),
  };

  const mockGateway: PaymentGateway = {
    cobrar: async (_o, _m) => ok("txn_abc"),
    reembolsar: async (_p) => ok(undefined),
  };

  const handler = new ProcessPaymentHandler(mockOrderRepo, mockPaymentRepo, mockGateway);
  const cmd: ProcessPaymentCommand = { orderId: OID, method: "credit_card" };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
