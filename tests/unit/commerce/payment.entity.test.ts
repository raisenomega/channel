import { expect, test } from "vitest";
import { crearPayment, transicionarPayment } from "../../../src/commerce/domain/payment.entity.ts";

const TID = crypto.randomUUID() as never;
const OID = crypto.randomUUID() as never;

test("crearPayment â€” debe crear pago pendiente", () => {
  const result = crearPayment(OID, TID, 50, "stripe");
  expect(result.ok).toBe(true);
  expect(result.value.status).toBe("pending");
  expect(result.value.amount).toBe(50);
  expect(result.value.provider).toBe("stripe");
});

test("crearPayment â€” debe fallar con monto invalido", () => {
  const result = crearPayment(OID, TID, 0, "stripe");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("monto_invalido");
});

test("crearPayment â€” ai_agent como initiatedByType", () => {
  const result = crearPayment(OID, TID, 100, "ath_movil", "ai_agent");
  expect(result.ok).toBe(true);
  expect(result.value.initiatedByType).toBe("ai_agent");
});

test("transicionarPayment â€” pending a completed permitido", () => {
  const p = crearPayment(OID, TID, 100, "stripe");
  expect(p.ok).toBe(true);
  const r = transicionarPayment(p.value, "completed");
  expect(r.ok).toBe(true);
  expect(r.value.status).toBe("completed");
});

test("transicionarPayment â€” completed a refunded permitido", () => {
  const p = crearPayment(OID, TID, 100, "stripe");
  expect(p.ok).toBe(true);
  const completed = transicionarPayment(p.value, "completed");
  expect(completed.ok).toBe(true);
  const refunded = transicionarPayment(completed.value, "refunded");
  expect(refunded.ok).toBe(true);
  expect(refunded.value.status).toBe("refunded");
});
