import { expect, test, vi } from "vitest";
import { SupabaseOrderRepo } from "../../../src/commerce/infrastructure/supabase-order.repo.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;
const CID = "contact-1" as never;

function makeOrder(quoteId: unknown = null): OrderState {
  return { id: "o1" as never, tenantId: TID, contactId: CID, quoteId: quoteId as never, status: "pending", totalAmount: 250, currency: "USD", aiConfidence: null, createdAt: new Date() };
}

test("guardar happy path", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 200 }));
  const r = await new SupabaseOrderRepo().guardar(makeOrder());
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar con quoteId null round-trip OK (direct order)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const fetchSpy = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 200 })) // guardar
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "o1", tenant_id: "tenant-1", contact_id: "contact-1", quote_id: null, status: "pending", total_amount: 250, currency: "USD", ai_confidence: null, created_at: new Date().toISOString() }]), { status: 200, headers: { "content-type": "application/json" } }));
  globalThis.fetch = fetchSpy;
  const order = makeOrder(null);
  const g = await new SupabaseOrderRepo().guardar(order);
  expect(g.ok).toBe(true);
  const b = await new SupabaseOrderRepo().buscar("o1" as never, TID);
  expect(b.ok).toBe(true);
  if (b.ok) expect(b.value?.quoteId).toBeNull();
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure http_500", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 500 }));
  const r = await new SupabaseOrderRepo().guardar(makeOrder());
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_500");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabaseOrderRepo().guardar(makeOrder());
  expect(r.ok).toBe(false);
});

test("buscar inexistente -> ok(null)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseOrderRepo().buscar("inex" as never, TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeNull();
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscarPorContacto filtra tenant_id + contact_id", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([{ id: "o1", tenant_id: "tenant-1", contact_id: "contact-1", quote_id: null, status: "pending", total_amount: 250, currency: "USD", ai_confidence: null, created_at: new Date().toISOString() }]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseOrderRepo().buscarPorContacto(CID, TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.length).toBe(1);
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  expect(call).toContain("contact_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});