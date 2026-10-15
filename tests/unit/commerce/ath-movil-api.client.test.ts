import { expect, test, vi } from "vitest";
import { AthMovilApiClient } from "../../../src/commerce/infrastructure/ath-movil-api.client.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

test("finalizar happy: mapea ecommerceStatus completed", async () => {
  const resp = new Response(JSON.stringify({ referenceNumber: "ABC123", ecommerceStatus: "completed", total: 10.0, date: "2025-01-01" }), { status: 200, headers: { "content-type": "application/json" } });
  const spy = vi.fn().mockResolvedValue(resp);
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("sandbox", "prv", "pub");
  const r = await client.finalizar("ABC123");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.status).toBe("completed");
    expect(r.value.total).toBe(10);
    expect(r.value.referenceNumber).toBe("ABC123");
  }
  // verificar que no loguea tokens
  const url = spy.mock.calls[0]?.[0] as string;
  expect(url).toContain("ABC123");
  expect(url).not.toContain("prv");
  restoreFetch();
});

test("finalizar http 500 -> err http_500", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
  const client = new AthMovilApiClient("sandbox", "prv", "pub");
  const r = await client.finalizar("X");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("http_500");
  restoreFetch();
});

test("finalizar network error -> err (string)", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("network timeout"));
  const client = new AthMovilApiClient("sandbox", "prv", "pub");
  const r = await client.finalizar("X");
  expect(r.ok).toBe(false);
  restoreFetch();
});

test("finalizar usa POST + body con tokens (no logs)", async () => {
  const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ referenceNumber: "R1", ecommerceStatus: "cancelled", total: 5 }), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = spy;
  const client = new AthMovilApiClient("prod", "secret-prv", "secret-pub");
  await client.finalizar("R1");
  const opts = spy.mock.calls[0]?.[1] as { method: string; body: string };
  expect(opts.method).toBe("POST");
  expect(opts.body).toContain("secret-prv");
  expect(opts.body).toContain("secret-pub");
  restoreFetch();
});