import { assertEquals, assert } from "jsr:@std/assert";
import { crearPayment, transicionarPayment } from "../../../src/commerce/domain/payment.entity.ts";

const TID = crypto.randomUUID() as never;
const OID = crypto.randomUUID() as never;

Deno.test("crearPayment — debe crear pago pendiente", () => {
  const result = crearPayment(OID, TID, 50, "stripe");
  assert(result.ok);
  assertEquals(result.value.status, "pending");
  assertEquals(result.value.amount, 50);
  assertEquals(result.value.provider, "stripe");
});

Deno.test("crearPayment — debe fallar con monto invalido", () => {
  const result = crearPayment(OID, TID, 0, "stripe");
  assert(!result.ok);
  assertEquals(result.error.kind, "monto_invalido");
});

Deno.test("crearPayment — ai_agent como initiatedByType", () => {
  const result = crearPayment(OID, TID, 100, "ath_movil", "ai_agent");
  assert(result.ok);
  assertEquals(result.value.initiatedByType, "ai_agent");
});

Deno.test("transicionarPayment — pending a completed permitido", () => {
  const p = crearPayment(OID, TID, 100, "stripe");
  assert(p.ok);
  const r = transicionarPayment(p.value, "completed");
  assert(r.ok);
  assertEquals(r.value.status, "completed");
});

Deno.test("transicionarPayment — completed a refunded permitido", () => {
  const p = crearPayment(OID, TID, 100, "stripe");
  assert(p.ok);
  const completed = transicionarPayment(p.value, "completed");
  assert(completed.ok);
  const refunded = transicionarPayment(completed.value, "refunded");
  assert(refunded.ok);
  assertEquals(refunded.value.status, "refunded");
});