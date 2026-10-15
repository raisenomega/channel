import { expect, test, vi } from "vitest";
import { SupabaseAutomationRuleRepo } from "../../../src/automation/infrastructure/supabase-automation-rule.repo.ts";
import type { AutomationRuleState } from "../../../src/automation/domain/automation.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;

function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;

const rule: AutomationRuleState = {
  id: "r1", tenantId: TID, name: "Saluda", trigger: "message_received",
  conditions: [], actions: [{ type: "send_message", params: { body: "hola" } }],
  isActive: true, priority: 1,
};

test("guardar happy path", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 200 }));
  const repo = new SupabaseAutomationRuleRepo();
  const r = await repo.guardar(rule);
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 500 }));
  const repo = new SupabaseAutomationRuleRepo();
  const r = await repo.guardar(rule);
  expect(r.ok).toBe(false);
  if (!r.ok) { expect(r.error.kind).toBe("persistence_failure"); expect(r.error.cause).toBe("http_500"); }
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  // sin env vars
  const repo = new SupabaseAutomationRuleRepo();
  const r = await repo.guardar(rule);
  expect(r.ok).toBe(false);
});

test("buscarActivas filtra tenant_id + trigger y mapea rows", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const row = { id: "r1", tenant_id: "tenant-1", name: "Saluda", trigger: "message_received", conditions: [], actions: [], is_active: true, priority: 2 };
  mockFetch(new Response(JSON.stringify([row]), { status: 200, headers: { "content-type": "application/json" } }));
  const repo = new SupabaseAutomationRuleRepo();
  const r = await repo.buscarActivas(TID, "message_received");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.length).toBe(1); expect(r.value[0].priority).toBe(2); }
  // verificar que URL filtra tenant_id
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  expect(call).toContain("trigger=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscarActivas parse error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response("not-json", { status: 200 }));
  const repo = new SupabaseAutomationRuleRepo();
  const r = await repo.buscarActivas(TID, "message_received");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("persistence_failure");
  restoreFetch(); vi.unstubAllEnvs();
});