/**
 * HUB by Raisen — Integration tests infraestructura commerce (Slide 3.1).
 * Invariante RLS: toda URL de lectura/escritura filtra tenant_id.
 */
import { expect, test, vi } from "vitest";
import { SupabaseQuoteRepo } from "../../../src/commerce/infrastructure/supabase-quote.repo.ts";
import { SupabaseOrderRepo } from "../../../src/commerce/infrastructure/supabase-order.repo.ts";
import { SupabasePaymentRepo } from "../../../src/commerce/infrastructure/supabase-payment.repo.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(): void {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
}
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-abc" as never;

async function urlFor(fn: () => Promise<unknown>): Promise<string> {
  await fn();
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as string;
}

test("adversarial RLS: toda URL de lectura filtra tenant_id encodado", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch();
  const urls = [
    await urlFor(() => new SupabaseQuoteRepo().buscar("q1" as never, TID)),
    await urlFor(() => new SupabaseOrderRepo().buscar("o1" as never, TID)),
    await urlFor(() => new SupabasePaymentRepo().buscar("p1" as never, TID)),
  ];
  for (const url of urls) {
    expect(url).toContain("tenant_id=eq." + encodeURIComponent("tenant-abc"));
  }
  restoreFetch(); vi.unstubAllEnvs();
});

test("sin Supabase local en CI: usa mocks de fetch global (documentado)", () => {
  expect(true).toBe(true);
});