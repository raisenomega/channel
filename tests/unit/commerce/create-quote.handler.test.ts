import { expect, test } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CreateQuoteHandler, CreateQuoteCommand } from "../../../src/commerce/application/create-quote.handler.ts";
import { QuoteRepository, RepoError } from "../../../src/commerce/domain/commerce.repository.ts";
import { QuoteState } from "../../../src/commerce/domain/quote.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("CreateQuoteHandler â€” debe crear y guardar quote exitosamente", async () => {
  let savedQuote: QuoteState | undefined;

  const mockRepo: QuoteRepository = {
    guardar: async (q) => {
      savedQuote = q;
      return ok(undefined);
    },
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([
      { description: "Servicio de consultoria", quantity: 1, unitPrice: 500, total: 500 },
    ]),
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(typeof result.value).toBe("string");
  expect(savedQuote !== undefined).toBe(true);
  expect(savedQuote!.totalAmount).toBe(500);
  expect(savedQuote!.status).toBe("draft");
});

test("CreateQuoteHandler â€” debe fallar con items_vacios si no hay items", async () => {
  const mockRepo: QuoteRepository = {
    guardar: async (_q) => ok(undefined),
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([]),
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("items_vacios");
});

test("CreateQuoteHandler â€” debe fallar con item_sin_descripcion si item vacio", async () => {
  const mockRepo: QuoteRepository = {
    guardar: async (_q) => ok(undefined),
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([
      { description: "  ", quantity: 1, unitPrice: 10, total: 10 },
    ]),
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("item_sin_descripcion");
});

test("CreateQuoteHandler â€” debe fallar con cantidad_invalida si quantity < 1", async () => {
  const mockRepo: QuoteRepository = {
    guardar: async (_q) => ok(undefined),
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([
      { description: "Item valido", quantity: 0, unitPrice: 10, total: 10 },
    ]),
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("cantidad_invalida");
});

test("CreateQuoteHandler â€” debe fallar con precio_invalido si unitPrice negativo", async () => {
  const mockRepo: QuoteRepository = {
    guardar: async (_q) => ok(undefined),
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([
      { description: "Item valido", quantity: 1, unitPrice: -5, total: -5 },
    ]),
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("precio_invalido");
});

test("CreateQuoteHandler â€” debe fallar si repo.guardar falla", async () => {
  const mockRepo: QuoteRepository = {
    guardar: async (_q) => err({ kind: "persistence_failure", cause: "disk_full" }),
    buscar: async (_id) => ok(null),
  };

  const handler = new CreateQuoteHandler(mockRepo);
  const cmd: CreateQuoteCommand = {
    tenantId: TID,
    contactId: CID,
    items: Object.freeze([
      { description: "Servicio de consultoria", quantity: 1, unitPrice: 500, total: 500 },
    ]),
  };
  const result = await handler.ejecutar(cmd);

  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("persistence_failure");
});
