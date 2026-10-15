import { expect, test, vi } from "vitest";
import { SupabaseQuoteRepo } from "../../../src/commerce/infrastructure/supabase-quote.repo.ts";
import type { QuoteState, QuoteLineItem } from "../../../src/commerce/domain/quote.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;
const CID = "contact-1" as never;

const items: readonly QuoteLineItem[] = Object.freeze([
  { description: "Plan", quantity: 1, unitPrice: 50, total: 50 },
  { description: "Setup", quantity: 1, unitPrice: 99, total: 99 },
]);

function makeQuote(status: "draft" | "accepted" = "draft"): QuoteState {
  return { id: "q1" as never, tenantId: TID, contactId: CID, mode: "lite", status, totalAmount: 149, currency: "USD", items, createdByType: "human", createdAt: new Date() };
}

test("guardar happy path (quotes + line items bulk)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const fetchSpy = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // quotes POST
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // line_items DELETE
    .mockResolvedValueOnce(new Response(null, { status: 200 })); // line_items INSERT
  globalThis.fetch = fetchSpy;
  const r = await new SupabaseQuoteRepo().guardar(makeQuote());
  expect(r.ok).toBe(true);
  expect(fetchSpy.mock.calls.length).toBe(3);
  restoreFetch(); vi.unstubAllEnvs();
});

test("DEUDA-INFO-S3.1-D: guardar con items vacios -> DELETE SIEMPRE corre (2 fetches: quotes + DELETE)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const fetchSpy = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // quotes POST
    .mockResolvedValueOnce(new Response(null, { status: 200 })); // line_items DELETE (siempre)
  globalThis.fetch = fetchSpy;
  const empty = { ...makeQuote(), items: Object.freeze([]) };
  const r = await new SupabaseQuoteRepo().guardar(empty);
  expect(r.ok).toBe(true);
  // el DELETE (2º fetch) siempre ocurre; sin INSERT porque items vacías
  expect(fetchSpy.mock.calls.length).toBe(2);
  const delUrl = fetchSpy.mock.calls[1]?.[0] as string;
  expect(delUrl).toContain("/quote_line_items?quote_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 500 }));
  const r = await new SupabaseQuoteRepo().guardar(makeQuote());
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("persistence_failure"); expect(r.error.cause).toBe("http_500"); }
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar si line items falla -> line_items_divergent", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const fetchSpy = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // quotes
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // DELETE
    .mockResolvedValueOnce(new Response(null, { status: 400 })); // INSERT falla
  globalThis.fetch = fetchSpy;
  const r = await new SupabaseQuoteRepo().guardar(makeQuote());
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("line_items_divergent");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabaseQuoteRepo().guardar(makeQuote());
  expect(r.ok).toBe(false);
});

test("buscar round-trip 10 line items", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const tenItems: readonly QuoteLineItem[] = Object.freeze(Array.from({ length: 10 }, (_, i) => ({ description: `Item${i}`, quantity: 1, unitPrice: 10 + i, total: 10 + i })));
  const qRow = { id: "q1", tenant_id: "tenant-1", contact_id: "contact-1", mode: "lite", status: "draft", total_amount: 145, currency: "USD", created_by_type: "human", created_at: new Date().toISOString() };
  const iRows = tenItems.map((it, idx) => ({ description: it.description, quantity: it.quantity, unit_price: it.unitPrice, total: it.total, id: `li${idx}` }));
  const fetchSpy = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([qRow]), { status: 200, headers: { "content-type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(iRows), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = fetchSpy;
  const r = await new SupabaseQuoteRepo().buscar("q1" as never, TID);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value?.items.length).toBe(10);
    expect(r.value?.totalAmount).toBe(145);
  }
  // verificar double-defensa tenant_id en URL de quotes
  const call = fetchSpy.mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscar quote inexistente -> ok(null)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseQuoteRepo().buscar("inexistente" as never, TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeNull();
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscar parse error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response("not-json", { status: 200 }));
  const r = await new SupabaseQuoteRepo().buscar("q1" as never, TID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("persistence_failure");
  restoreFetch(); vi.unstubAllEnvs();
});