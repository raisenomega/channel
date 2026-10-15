import { expect, test, vi } from "vitest";
import { SupabasePaymentRepo } from "../../../src/commerce/infrastructure/supabase-payment.repo.ts";
import type { PaymentState } from "../../../src/commerce/domain/payment.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;
const OID = "order-1" as never;

function makePayment(): PaymentState {
  return { id: "p1" as never, tenantId: TID, orderId: OID, amount: 250, currency: "USD", status: "completed", provider: "stripe", initiatedByType: "human", netAmount: null, authTokenEncrypted: null, createdAt: new Date() };
}

test("guardar happy path (POST nuevo pago)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const calls: Response[] = [
    new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }), // buscar -> no existe
    new Response(null, { status: 200 }), // POST
  ];
  globalThis.fetch = vi.fn().mockImplementation(async () => calls.shift());
  const r = await new SupabasePaymentRepo().guardar(makePayment());
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar existente -> PATCH (UPSERT)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const calls: Response[] = [
    new Response(JSON.stringify([{ id: "p1", tenant_id: "tenant-1", order_id: "order-1", amount: 250, currency: "USD", status: "completed", provider: "stripe", initiated_by_type: "human", net_amount: null, ath_auth_token_encrypted: null, created_at: new Date().toISOString() }]), { status: 200, headers: { "content-type": "application/json" } }),
    new Response(null, { status: 200 }),
  ];
  const fetchSpy = vi.fn().mockImplementation(async () => calls.shift());
  globalThis.fetch = fetchSpy;
  const r = await new SupabasePaymentRepo().guardar(makePayment());
  expect(r.ok).toBe(true);
  const method = (fetchSpy.mock.calls[1]?.[1] as { method: string }).method;
  expect(method).toBe("PATCH");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const calls: Response[] = [
    new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }),
    new Response(null, { status: 400 }),
  ];
  globalThis.fetch = vi.fn().mockImplementation(async () => calls.shift());
  const r = await new SupabasePaymentRepo().guardar(makePayment());
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_400");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabasePaymentRepo().guardar(makePayment());
  expect(r.ok).toBe(false);
});

test("buscar inexistente -> ok(null)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabasePaymentRepo().buscar("inex" as never, TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeNull();
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscarPorOrder filtra tenant_id + order_id", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([{ id: "p1", tenant_id: "tenant-1", order_id: "order-1", amount: 250, currency: "USD", status: "completed", provider: "stripe", initiated_by_type: "human", created_at: new Date().toISOString() }]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabasePaymentRepo().buscarPorOrder(OID, TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.length).toBe(1);
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  expect(call).toContain("order_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscar parse error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response("not-json", { status: 200 }));
  const r = await new SupabasePaymentRepo().buscar("p1" as never, TID);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("persistence_failure");
  restoreFetch(); vi.unstubAllEnvs();
});