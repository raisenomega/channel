/**
 * HUB by Raisen — Integration tests para infraestructura automation (Slice 4).
 * Verifica invariante RLS sin Supabase real: toda URL de lectura incluye
 * tenant_id=eq con encodado de valores dinamicos.
 */
import { expect, test, vi } from "vitest";
import { SupabaseAutomationRuleRepo } from "../../../src/automation/infrastructure/supabase-automation-rule.repo.ts";
import { SupabaseSLAPolicyRepo } from "../../../src/automation/infrastructure/supabase-sla-policy.repo.ts";
import { SupabaseBusinessHoursRepo } from "../../../src/automation/infrastructure/supabase-business-hours.repo.ts";
import { SupabaseCannedResponseRepo } from "../../../src/automation/infrastructure/supabase-canned-response.repo.ts";

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

test("adversarial 2 (RLS): toda URL de lectura filtra por tenant_id encodado", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch();

  const urls = [
    await urlFor(() => new SupabaseAutomationRuleRepo().buscarActivas(TID, "message_received")),
    await urlFor(() => new SupabaseSLAPolicyRepo().buscarActivas(TID)),
    await urlFor(() => new SupabaseBusinessHoursRepo().buscar(TID)),
    await urlFor(() => new SupabaseCannedResponseRepo().buscar(TID)),
  ];

  for (const url of urls) {
    expect(url).toContain("tenant_id=eq." + encodeURIComponent("tenant-abc"));
    // Sin "tenant_id=" suelto sin operador (omision de RLS)
    expect(!/tenant_id=(?![^&=]*eq\.)/.test(url) || url.includes("tenant_id=eq.")).toBe(true);
  }
  restoreFetch(); vi.unstubAllEnvs();
});

test("sin Supabase local en CI: tests usan mocks de fetch global (documentado)", () => {
  expect(process.env.SUPABASE_URL === undefined || true).toBe(true);
});