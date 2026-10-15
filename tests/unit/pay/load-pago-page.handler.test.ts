import { expect, test } from "vitest";
import { LoadPagoPageHandler, LoadPagoError, PayLoadSources } from "../../../src/pay/application/load-pago-page.handler.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";
import type { Result } from "../../../src/shared/domain/result.ts";

const TID = "tenant-A" as never;
const OID = "order-1" as never;
const QID = "quote-1" as never;

function tenant(slug = "zafacones") {
  return { id: TID, slug, name: "Zafacones", logoUrl: null, primaryColor: null };
}
function order(status = "pending", quoteId: never | null = null) {
  return { id: OID, tenantId: TID, status, totalAmount: 100, currency: "USD", notes: "nota", quoteId };
}
function items() {
  return [{ description: "Item", quantity: 1, unitPrice: 100, total: 100 }];
}

function src(over: Partial<PayLoadSources> = {}): PayLoadSources {
  return {
    tenantBySlug: async () => ok(tenant()),
    orderById: async () => ok(order()),
    itemsByQuote: async () => ok(items()),
    ...over,
  };
}

test("happy: carga tenant+order+items cuando hay quote", async () => {
  const h = new LoadPagoPageHandler(src({ orderById: async () => ok(order("pending", QID)) }));
  const r = await h.ejecutar("zafacones", OID);
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.tenant.name).toBe("Zafacones"); expect(r.value.items.length).toBe(1); }
});

test("adversarial: tenant no existe -> tenant_no_encontrado", async () => {
  const h = new LoadPagoPageHandler(src({ tenantBySlug: async () => ok(null) }));
  const r = await h.ejecutar("noexiste", OID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as LoadPagoError).kind).toBe("tenant_no_encontrado");
});

test("adversarial: order no existe -> order_no_encontrada", async () => {
  const h = new LoadPagoPageHandler(src({ orderById: async () => ok(null) }));
  const r = await h.ejecutar("zafacones", OID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as LoadPagoError).kind).toBe("order_no_encontrada");
});

test("adversarial: order status=paid -> orden_ya_procesada", async () => {
  const h = new LoadPagoPageHandler(src({ orderById: async () => ok(order("paid")) }));
  const r = await h.ejecutar("zafacones", OID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as LoadPagoError).kind).toBe("orden_ya_procesada");
});

test("adversarial: order status=cancelled -> orden_ya_procesada", async () => {
  const h = new LoadPagoPageHandler(src({ orderById: async () => ok(order("cancelled")) }));
  const r = await h.ejecutar("zafacones", OID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as LoadPagoError).kind).toBe("orden_ya_procesada");
});

test("error de persistencia en tenantBySlug -> persistence_error", async () => {
  const h = new LoadPagoPageHandler(src({ tenantBySlug: async () => err("boom") as unknown as Result<never, string> }));
  const r = await h.ejecutar("zafacones", OID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect((r.error as LoadPagoError).kind).toBe("persistence_error");
});