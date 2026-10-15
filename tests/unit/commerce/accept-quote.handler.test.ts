import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { AcceptQuoteHandler, AcceptQuoteCommand } from "../../../src/commerce/application/accept-quote.handler.ts";
import { QuoteRepository, OrderRepository, RepoError } from "../../../src/commerce/domain/commerce.repository.ts";
import { QuoteState } from "../../../src/commerce/domain/quote.entity.ts";
import { OrderState } from "../../../src/commerce/domain/order.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const QID = crypto.randomUUID() as never;

const quoteFixture: QuoteState = Object.freeze({
  id: QID,
  tenantId: TID,
  contactId: CID,
  mode: "lite",
  status: "draft",
  totalAmount: 100,
  currency: "USD",
  items: Object.freeze([{ description: "Item de prueba", quantity: 1, unitPrice: 100, total: 100 }]),
  createdByType: "human",
  createdAt: new Date(),
});

test("AcceptQuoteHandler â€” debe aceptar quote y crear order exitosamente", async () => {
  let quoteGuardada: QuoteState | undefined;
  let orderGuardada: OrderState | undefined;

  const mockQuoteRepo: QuoteRepository = {
    buscar: async (_id, _tenantId) => ok(quoteFixture),
    guardar: async (q) => {
      quoteGuardada = q;
      return ok(undefined);
    },
  };

  const mockOrderRepo: OrderRepository = {
    guardar: async (o) => {
      orderGuardada = o;
      return ok(undefined);
    },
    buscar: async (_id, _tenantId) => ok(null),
    buscarPorContacto: async (_cid, _tenantId) => ok([]),
  };

  const handler = new AcceptQuoteHandler(mockQuoteRepo, mockOrderRepo);
  const cmd: AcceptQuoteCommand = { quoteId: QID, tenantId: TID };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
  // La quote debe quedar como "accepted"
  expect(quoteGuardada !== undefined).toBe(true);
  expect(quoteGuardada!.status).toBe("accepted");
  // La order debe tener el quoteId vinculado
  expect(orderGuardada !== undefined).toBe(true);
  expect(orderGuardada!.quoteId).toBe(QID);
});

test("AcceptQuoteHandler â€” debe fallar si quoteRepo.buscar devuelve error", async () => {
  const mockQuoteRepo: QuoteRepository = {
    buscar: async (_id, _tenantId) => err({ kind: "persistence_failure", cause: "db_down" }),
    guardar: async (_q) => ok(undefined),
  };
  const mockOrderRepo: OrderRepository = {
    guardar: async (_o) => ok(undefined),
    buscar: async (_id, _tenantId) => ok(null),
    buscarPorContacto: async (_cid, _tenantId) => ok([]),
  };

  const handler = new AcceptQuoteHandler(mockQuoteRepo, mockOrderRepo);
  const cmd: AcceptQuoteCommand = { quoteId: QID, tenantId: TID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});

test("AcceptQuoteHandler â€” debe fallar si la quote no existe (null)", async () => {
  const mockQuoteRepo: QuoteRepository = {
    buscar: async (_id, _tenantId) => ok(null),
    guardar: async (_q) => ok(undefined),
  };
  const mockOrderRepo: OrderRepository = {
    guardar: async (_o) => ok(undefined),
    buscar: async (_id, _tenantId) => ok(null),
    buscarPorContacto: async (_cid, _tenantId) => ok([]),
  };

  const handler = new AcceptQuoteHandler(mockQuoteRepo, mockOrderRepo);
  const cmd: AcceptQuoteCommand = { quoteId: QID, tenantId: TID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("cotizacion_no_encontrada");
});

test("AcceptQuoteHandler â€” debe fallar si quoteRepo.guardar falla", async () => {
  const mockQuoteRepo: QuoteRepository = {
    buscar: async (_id, _tenantId) => ok(quoteFixture),
    guardar: async (_q) => err({ kind: "persistence_failure", cause: "disk_full" }),
  };
  const mockOrderRepo: OrderRepository = {
    guardar: async (_o) => ok(undefined),
    buscar: async (_id, _tenantId) => ok(null),
    buscarPorContacto: async (_cid, _tenantId) => ok([]),
  };

  const handler = new AcceptQuoteHandler(mockQuoteRepo, mockOrderRepo);
  const cmd: AcceptQuoteCommand = { quoteId: QID, tenantId: TID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});

test("AcceptQuoteHandler â€” debe fallar si orderRepo.guardar falla", async () => {
  const mockQuoteRepo: QuoteRepository = {
    buscar: async (_id, _tenantId) => ok(quoteFixture),
    guardar: async (_q) => ok(undefined),
  };
  const mockOrderRepo: OrderRepository = {
    guardar: async (_o) => err({ kind: "persistence_failure", cause: "disk_full" }),
    buscar: async (_id, _tenantId) => ok(null),
    buscarPorContacto: async (_cid, _tenantId) => ok([]),
  };

  const handler = new AcceptQuoteHandler(mockQuoteRepo, mockOrderRepo);
  const cmd: AcceptQuoteCommand = { quoteId: QID, tenantId: TID };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
