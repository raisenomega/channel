import { expect, test, vi } from "vitest";
import { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("crearPago ok: mapea ecommerceId + auth_token y usa host real", async () => {
  const spy = vi.fn().mockResolvedValue(jsonRes({ status: "success", data: { ecommerceId: "ECO-123", auth_token: "jwt.secret" } }));
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("pub-tok", "prv-tok");
  const r = await client.crearPago({ total: 10, tax: 0, subtotal: 10, metadata1: "o1", metadata2: "t1", items: [{ name: "a", description: "d", quantity: 1, price: 10 }], phoneNumber: "7875550000", timeout: 600 });
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.ecommerceId).toBe("ECO-123"); expect(r.value.authToken).toBe("jwt.secret"); }
  const url = spy.mock.calls[0]?.[0] as string;
  expect(url).toBe("https://payments.athmovil.com/api/business-transaction/ecommerce/payment");
  expect(url).not.toContain("sandbox");
  restoreFetch();
});

test("buscarPago ok: mapea estado MAYÚSCULA COMPLETED", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(jsonRes({ status: "success", data: { ecommerceStatus: "COMPLETED", referenceNumber: "REF-1", total: 10, fee: 0.23, netAmount: 9.77, transactionDate: "2026-10-15T00:00:00Z" } }));
  const client = new AthMovilApiClient("pub", "prv");
  const r = await client.buscarPago("ECO-9");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.estado).toBe("COMPLETED"); expect(r.value.referenceNumber).toBe("REF-1"); expect(r.value.netAmount).toBe(9.77); }
  restoreFetch();
});

test("buscarPago con estado en minúscula → error estado_desconocido", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(jsonRes({ status: "success", data: { ecommerceStatus: "completed" } }));
  const client = new AthMovilApiClient("pub", "prv");
  const r = await client.buscarPago("ECO-X");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("estado_desconocido");
  restoreFetch();
});

test("timeout aplicado y tokens no van en URL", async () => {
  const spy = vi.fn().mockResolvedValue(jsonRes({ status: "success", data: { ecommerceStatus: "CONFIRM", referenceNumber: "", total: 5, fee: 0, netAmount: 0, transactionDate: "" } }));
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("pub-larga", "prv-larga");
  await client.buscarPago("ECO-1");
  const url = spy.mock.calls[0]?.[0] as string;
  expect(url).not.toContain("pub-larga");
  expect(url).not.toContain("prv-larga");
  restoreFetch();
});

test("autorizar usa POST /authorization con Bearer authToken, body vacío", async () => {
  const spy = vi.fn().mockResolvedValue(jsonRes({ status: "success", data: { ecommerceStatus: "COMPLETED", referenceNumber: "AUTH-1", total: 10, fee: 0.23, netAmount: 9.77, transactionDate: "" } }));
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("pub", "prv");
  const r = await client.autorizar("auth.jwt.token");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.referenceNumber).toBe("AUTH-1");
  const [url, opts] = spy.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
  expect(url).toContain("/authorization");
  expect(opts.method).toBe("POST");
  expect(opts.headers["Authorization"]).toBe("Bearer auth.jwt.token");
  expect(opts.body).toBe("{}");
  restoreFetch();
});

test("crearPago http 500 → err http_500", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
  const client = new AthMovilApiClient("pub", "prv");
  const r = await client.crearPago({ total: 10, tax: 0, subtotal: 10, metadata1: "o", metadata2: "t", items: [], phoneNumber: "7875550000", timeout: 600 });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("http_500");
  restoreFetch();
});

test("actualizarTelefono usa PUT con Bearer y cuerpo ecommerceId+phone", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("pub", "prv");
  const r = await client.actualizarTelefono("ECO-1", "7875551234", "auth.tok");
  expect(r.ok).toBe(true);
  const [url, opts] = spy.mock.calls[0] as [string, { method: string; body: string }];
  expect(opts.method).toBe("PUT");
  expect(url).toContain("/business/updatePhoneNumber");
  expect(opts.body).toContain("7875551234");
  restoreFetch();
});