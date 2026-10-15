import { expect, test, vi } from "vitest";
import { SupabaseBusinessHoursRepo } from "../../../src/automation/infrastructure/supabase-business-hours.repo.ts";
import type { BusinessHoursState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;

const hours: BusinessHoursState = {
  id: "b1", tenantId: TID, inboxId: null, timezone: "America/Puerto_Rico", schedule: { mon: ["09:00", "17:00"] },
};

test("guardar happy path (inbox_id null OK)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 200 }));
  const r = await new SupabaseBusinessHoursRepo().guardar(hours);
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 400 }));
  const r = await new SupabaseBusinessHoursRepo().guardar(hours);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_400");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabaseBusinessHoursRepo().guardar(hours);
  expect(r.ok).toBe(false);
});

test("buscar mapea inbox_id null y filtra tenant_id", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const row = { id: "b1", tenant_id: "tenant-1", inbox_id: null, timezone: "America/Puerto_Rico", schedule: { mon: ["09:00", "17:00"] } };
  mockFetch(new Response(JSON.stringify([row]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseBusinessHoursRepo().buscar(TID);
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value[0].inboxId).toBeNull(); }
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});