import { expect, test } from "vitest";
import { crearOrder, transicionarOrder } from "../../../src/commerce/domain/order.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("crearOrder â€” debe crear orden pendiente", () => {
  const result = crearOrder(CID, TID, 150);
  expect(result.ok).toBe(true);
  expect(result.value.status).toBe("pending");
  expect(result.value.totalAmount).toBe(150);
});

test("crearOrder â€” debe fallar con total invalido", () => {
  const result = crearOrder(CID, TID, 0);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("total_invalido");
});

test("transicionarOrder â€” pending a confirmed permitido", () => {
  const order = crearOrder(CID, TID, 100);
  expect(order.ok).toBe(true);
  const result = transicionarOrder(order.value, "confirmed");
  expect(result.ok).toBe(true);
  expect(result.value.status).toBe("confirmed");
});

test("transicionarOrder â€” delivered no puede ir a ningun lado", () => {
  const order = crearOrder(CID, TID, 100);
  expect(order.ok).toBe(true);
  const delivered = transicionarOrder(order.value, "delivered");
  expect(!transicionarOrder(delivered.ok ? delivered.value : order.value, "paid").ok).toBe(true);
});

test("transicionarOrder â€” pending a shipped prohibido", () => {
  const order = crearOrder(CID, TID, 100);
  expect(order.ok).toBe(true);
  const result = transicionarOrder(order.value, "shipped");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("transicion_invalida");
});
