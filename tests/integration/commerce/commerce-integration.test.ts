/**
 * HUB by Raisen — Integration tests for Commerce context.
 * Flujo critico: crear quote -> aceptar quote -> crear order (misma sesion).
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar Memory*Store por *RepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { assertEquals, assert } from "jsr:@std/assert";
import { MemoryQuoteStore, MemoryOrderStore } from "../fixtures/memory-store.infrastructure.ts";
import { CreateQuoteHandler } from "../../../src/commerce/application/create-quote.handler.ts";
import { AcceptQuoteHandler } from "../../../src/commerce/application/accept-quote.handler.ts";
import type { TenantId, ContactId, QuoteId } from "../../../src/shared/domain/ids.ts";

Deno.test("Commerce: crear quote -> aceptar -> order creada (misma sesion)", async () => {
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
  assert(quoteRes.ok, "la quote se debe crear");
  const quoteId = quoteRes.value;

  // 2) Verificar que persiste
  const quoteBuscada = await quotes.buscar(quoteId);
  assert(quoteBuscada.ok);
  assertEquals(quoteBuscada.value?.status, "draft");
  assertEquals(quoteBuscada.value?.totalAmount, 148.99);

  // 3) Aceptar quote -> crea order
  const orderRes = await acceptarQuote.ejecutar({ quoteId });
  assert(orderRes.ok, "la order se debe crear al aceptar la quote");
  const orderId = orderRes.value;

  // 4) Verificar order persistida
  const orderBuscada = await orders.buscar(orderId);
  assert(orderBuscada.ok);
  assertEquals(orderBuscada.value?.status, "pending");
  assertEquals(orderBuscada.value?.quoteId, quoteId);
  assertEquals(orderBuscada.value?.totalAmount, 148.99);
  assertEquals(orderBuscada.value?.contactId, contactId);
  assertEquals(orderBuscada.value?.tenantId, tenantId);

  // 5) Verificar que la quote ahora esta "accepted"
  const quoteFinal = await quotes.buscar(quoteId);
  assert(quoteFinal.ok);
  assertEquals(quoteFinal.value?.status, "accepted");
});

Deno.test("Commerce: quote con items vacios es rechazada", async () => {
  const quotes = new MemoryQuoteStore();
  const handler = new CreateQuoteHandler(quotes);

  const res = await handler.ejecutar({
    tenantId: crypto.randomUUID() as TenantId,
    contactId: crypto.randomUUID() as ContactId,
    items: [],
    createdByType: "human",
  });
  assert(!res.ok, "items vacios debe fallar");
  assertEquals(res.error.kind, "items_vacios");
});

Deno.test("Commerce: aceptar quote inexistente da error", async () => {
  const quotes = new MemoryQuoteStore();
  const orders = new MemoryOrderStore();
  const handler = new AcceptQuoteHandler(quotes, orders);

  const res = await handler.ejecutar({ quoteId: crypto.randomUUID() as QuoteId });
  assert(!res.ok, "quote inexistente debe fallar");
  assertEquals(res.error.kind, "cotizacion_no_encontrada");
});

Deno.test("Commerce: order creada desde quote se puede buscar por contacto", async () => {
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
  assert(q1.ok);

  const o1 = await acceptarQuote.ejecutar({ quoteId: q1.value });
  assert(o1.ok);

  const porContacto = await orders.buscarPorContacto(contactId);
  assert(porContacto.ok);
  assertEquals(porContacto.value.length, 1);
  assertEquals(porContacto.value[0]?.id, o1.value);
});