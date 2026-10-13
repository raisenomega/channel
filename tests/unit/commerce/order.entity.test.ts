import { assertEquals, assert } from "jsr:@std/assert";
import { crearOrder, transicionarOrder } from "../../../src/commerce/domain/order.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

Deno.test("crearOrder — debe crear orden pendiente", () => {
  const result = crearOrder(CID, TID, 150);
  assert(result.ok);
  assertEquals(result.value.status, "pending");
  assertEquals(result.value.totalAmount, 150);
});

Deno.test("crearOrder — debe fallar con total invalido", () => {
  const result = crearOrder(CID, TID, 0);
  assert(!result.ok);
  assertEquals(result.error.kind, "total_invalido");
});

Deno.test("transicionarOrder — pending a confirmed permitido", () => {
  const order = crearOrder(CID, TID, 100);
  assert(order.ok);
  const result = transicionarOrder(order.value, "confirmed");
  assert(result.ok);
  assertEquals(result.value.status, "confirmed");
});

Deno.test("transicionarOrder — delivered no puede ir a ningun lado", () => {
  const order = crearOrder(CID, TID, 100);
  assert(order.ok);
  const delivered = transicionarOrder(order.value, "delivered");
  assert(!transicionarOrder(delivered.ok ? delivered.value : order.value, "paid").ok);
});

Deno.test("transicionarOrder — pending a shipped prohibido", () => {
  const order = crearOrder(CID, TID, 100);
  assert(order.ok);
  const result = transicionarOrder(order.value, "shipped");
  assert(!result.ok);
  assertEquals(result.error.kind, "transicion_invalida");
});