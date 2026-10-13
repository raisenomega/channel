import { assertEquals, assert } from "jsr:@std/assert";
import { crearQuote, aceptarQuote, rechazarQuote } from "../../../src/commerce/domain/quote.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

Deno.test("crearQuote — debe crear cotizacion con items", () => {
  const items = [{ description: "Mofongo con pernil", quantity: 2, unitPrice: 12, total: 24 }];
  const result = crearQuote(CID, TID, items);
  assert(result.ok);
  assertEquals(result.value.status, "draft");
  assertEquals(result.value.totalAmount, 24);
  assertEquals(result.value.mode, "lite");
});

Deno.test("crearQuote — debe fallar con items vacios", () => {
  const result = crearQuote(CID, TID, []);
  assert(!result.ok);
  assertEquals(result.error.kind, "items_vacios");
});

Deno.test("crearQuote — debe rechazar item sin descripcion", () => {
  const items = [{ description: "", quantity: 1, unitPrice: 10, total: 10 }];
  const result = crearQuote(CID, TID, items);
  assert(!result.ok);
  assertEquals(result.error.kind, "item_sin_descripcion");
});

Deno.test("crearQuote — modo ecosystem con nucleo", () => {
  const items = [{ description: "Servicio premium", quantity: 1, unitPrice: 500, total: 500 }];
  const result = crearQuote(CID, TID, items, "human", "nucleo_synced");
  assert(result.ok);
  assertEquals(result.value.mode, "nucleo_synced");
});

Deno.test("aceptarQuote — cambia status a accepted", () => {
  const items = [{ description: "Item", quantity: 1, unitPrice: 100, total: 100 }];
  const quote = crearQuote(CID, TID, items);
  assert(quote.ok);
  const aceptada = aceptarQuote(quote.value);
  assertEquals(aceptada.status, "accepted");
});

Deno.test("rechazarQuote — cambia status a rejected", () => {
  const items = [{ description: "Item", quantity: 1, unitPrice: 100, total: 100 }];
  const quote = crearQuote(CID, TID, items);
  assert(quote.ok);
  const rechazada = rechazarQuote(quote.value);
  assertEquals(rechazada.status, "rejected");
});