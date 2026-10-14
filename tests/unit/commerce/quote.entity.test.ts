import { expect, test } from "vitest";
import { crearQuote, aceptarQuote, rechazarQuote } from "../../../src/commerce/domain/quote.entity.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("crearQuote â€” debe crear cotizacion con items", () => {
  const items = [{ description: "Mofongo con pernil", quantity: 2, unitPrice: 12, total: 24 }];
  const result = crearQuote(CID, TID, items);
  expect(result.ok).toBe(true);
  expect(result.value.status).toBe("draft");
  expect(result.value.totalAmount).toBe(24);
  expect(result.value.mode).toBe("lite");
});

test("crearQuote â€” debe fallar con items vacios", () => {
  const result = crearQuote(CID, TID, []);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("items_vacios");
});

test("crearQuote â€” debe rechazar item sin descripcion", () => {
  const items = [{ description: "", quantity: 1, unitPrice: 10, total: 10 }];
  const result = crearQuote(CID, TID, items);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("item_sin_descripcion");
});

test("crearQuote â€” modo ecosystem con nucleo", () => {
  const items = [{ description: "Servicio premium", quantity: 1, unitPrice: 500, total: 500 }];
  const result = crearQuote(CID, TID, items, "human", "nucleo_synced");
  expect(result.ok).toBe(true);
  expect(result.value.mode).toBe("nucleo_synced");
});

test("aceptarQuote â€” cambia status a accepted", () => {
  const items = [{ description: "Item", quantity: 1, unitPrice: 100, total: 100 }];
  const quote = crearQuote(CID, TID, items);
  expect(quote.ok).toBe(true);
  const aceptada = aceptarQuote(quote.value);
  expect(aceptada.status).toBe("accepted");
});

test("rechazarQuote â€” cambia status a rejected", () => {
  const items = [{ description: "Item", quantity: 1, unitPrice: 100, total: 100 }];
  const quote = crearQuote(CID, TID, items);
  expect(quote.ok).toBe(true);
  const rechazada = rechazarQuote(quote.value);
  expect(rechazada.status).toBe("rejected");
});
