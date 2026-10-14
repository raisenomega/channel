/**
 * HUB by Raisen â€” Integration tests for Commerce context.
 * Flujo critico: crear quote -> aceptar quote -> crear order (misma sesion).
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar Memory*Store por *RepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { expect, test } from "vitest";
import { MemoryQuoteStore, MemoryOrderStore } from "../fixtures/memory-store.infrastructure.ts";
import { CreateQuoteHandler } from "../../../src/commerce/application/create-quote.handler.ts";
import { AcceptQuoteHandler } from "../../../src/commerce/application/accept-quote.handler.ts";
import type { TenantId, ContactId, QuoteId } from "../../../src/shared/domain/ids.ts";

test("Commerce: crear quote -> aceptar -> order creada (misma sesion)", async () => {
  const quotes = new MemoryQuoteStore();
  const orders = new MemoryOrderStore();
  const crearQuote = new CreateQuoteHandler(quotes);
  const acceptarQuote = new AcceptQuoteHandler(quotes, orders);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // 1) Crear quote
  const quoteRes = await crearQuote.ejecutar({
    tenantId,
    contactId,
    items: [
      { description: "Plan Mensual Premium", quantity: 1, unitPrice: 49.99, total: 49.99 },
      { description: "Setup inicial", quantity: 1, unitPrice: 99.00, total: 99.00 },
    ],
    createdByType: "ai_agent",
    mode: "lite",
  });
  expect(quoteRes.ok, "la quote se debe crear").toBe(true);
  const quoteId = quoteRes.value;

  // 2) Verificar que persiste
  const quoteBuscada = await quotes.buscar(quoteId);
  expect(quoteBuscada.ok).toBe(true);
  expect(quoteBuscada.value?.status).toBe("draft");
  expect(quoteBuscada.value?.totalAmount).toBe(148.99);

  // 3) Aceptar quote -> crea order
  const orderRes = await acceptarQuote.ejecutar({ quoteId });
  expect(orderRes.ok, "la order se debe crear al aceptar la quote").toBe(true);
  const orderId = orderRes.value;

  // 4) Verificar order persistida
  const orderBuscada = await orders.buscar(orderId);
  expect(orderBuscada.ok).toBe(true);
  expect(orderBuscada.value?.status).toBe("pending");
  expect(orderBuscada.value?.quoteId).toBe(quoteId);
  expect(orderBuscada.value?.totalAmount).toBe(148.99);
  expect(orderBuscada.value?.contactId).toBe(contactId);
  expect(orderBuscada.value?.tenantId).toBe(tenantId);

  // 5) Verificar que la quote ahora esta "accepted"
  const quoteFinal = await quotes.buscar(quoteId);
  expect(quoteFinal.ok).toBe(true);
  expect(quoteFinal.value?.status).toBe("accepted");
});

test("Commerce: quote con items vacios es rechazada", async () => {
  const quotes = new MemoryQuoteStore();
  const handler = new CreateQuoteHandler(quotes);

  const res = await handler.ejecutar({
    tenantId: crypto.randomUUID() as TenantId,
    contactId: crypto.randomUUID() as ContactId,
    items: [],
    createdByType: "human",
  });
  expect(!res.ok, "items vacios debe fallar").toBe(true);
  expect(res.error.kind).toBe("items_vacios");
});

test("Commerce: aceptar quote inexistente da error", async () => {
  const quotes = new MemoryQuoteStore();
  const orders = new MemoryOrderStore();
  const handler = new AcceptQuoteHandler(quotes, orders);

  const res = await handler.ejecutar({ quoteId: crypto.randomUUID() as QuoteId });
  expect(!res.ok, "quote inexistente debe fallar").toBe(true);
  expect(res.error.kind).toBe("cotizacion_no_encontrada");
});

test("Commerce: order creada desde quote se puede buscar por contacto", async () => {
  const quotes = new MemoryQuoteStore();
  const orders = new MemoryOrderStore();
  const crearQuote = new CreateQuoteHandler(quotes);
  const acceptarQuote = new AcceptQuoteHandler(quotes, orders);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  const q1 = await crearQuote.ejecutar({
    tenantId, contactId,
    items: [{ description: "Consultoria", quantity: 1, unitPrice: 200, total: 200 }],
  });
  expect(q1.ok).toBe(true);

  const o1 = await acceptarQuote.ejecutar({ quoteId: q1.value });
  expect(o1.ok).toBe(true);

  const porContacto = await orders.buscarPorContacto(contactId);
  expect(porContacto.ok).toBe(true);
  expect(porContacto.value.length).toBe(1);
  expect(porContacto.value[0]?.id).toBe(o1.value);
});
