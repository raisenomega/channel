import { expect, test, vi } from "vitest";
import { SupabaseSLAPolicyRepo } from "../../../src/automation/infrastructure/supabase-sla-policy.repo.ts";
import type { SLAPolicyState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;

const policy: SLAPolicyState = {
  id: "s1", tenantId: TID, name: "SLA Estándar",
  firstResponseSeconds: 300, resolutionSeconds: 3600, priority: "medium", isActive: true,
};

test("guardar happy path", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 200 }));
  const r = await new SupabaseSLAPolicyRepo().guardar(policy);
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure http_500", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 500 }));
  const r = await new SupabaseSLAPolicyRepo().guardar(policy);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_500");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabaseSLAPolicyRepo().guardar(policy);
  expect(r.ok).toBe(false);
});

test("buscarActivas mapea + filtra is_active y tenant_id", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const row = { id: "s1", tenant_id: "tenant-1", name: "SLA", first_response_seconds: 300, resolution_seconds: 3600, priority: "medium", is_active: true };
  mockFetch(new Response(JSON.stringify([row]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseSLAPolicyRepo().buscarActivas(TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value[0].firstResponseSeconds).toBe(300);
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  expect(call).toContain("is_active=eq.true");
  restoreFetch(); vi.unstubAllEnvs();
});