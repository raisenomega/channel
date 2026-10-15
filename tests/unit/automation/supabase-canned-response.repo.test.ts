import { expect, test, vi } from "vitest";
import { SupabaseCannedResponseRepo } from "../../../src/automation/infrastructure/supabase-canned-response.repo.ts";
import type { CannedResponseState } from "../../../src/automation/domain/sla-bizhours.entity.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function mockFetch(resp: Response): void { globalThis.fetch = vi.fn().mockResolvedValue(resp); }
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }
const TID = "tenant-1" as never;

const canned: CannedResponseState = { id: "c1", tenantId: TID, shortcode: "hola", content: "Hola!", category: "saludo" };

test("guardar happy path", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 200 }));
  const r = await new SupabaseCannedResponseRepo().guardar(canned);
  expect(r.ok).toBe(true);
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar http error -> persistence_failure", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(null, { status: 409 }));
  const r = await new SupabaseCannedResponseRepo().guardar(canned);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.cause).toBe("http_409");
  restoreFetch(); vi.unstubAllEnvs();
});

test("guardar config incompleta -> error", async () => {
  const r = await new SupabaseCannedResponseRepo().guardar(canned);
  expect(r.ok).toBe(false);
});

test("buscarPorShortcode devuelve ok(null) si no existe (null es dato, no error)", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseCannedResponseRepo().buscarPorShortcode(TID, "no_existe");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeNull();
  restoreFetch(); vi.unstubAllEnvs();
});

test("adversarial 3: shortcode con SQL injection se encodea, no rompe URL", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const malicious = "a' OR 1=1--";
  mockFetch(new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseCannedResponseRepo().buscarPorShortcode(TID, malicious);
  expect(r.ok).toBe(true);
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("shortcode=eq." + encodeURIComponent(malicious));
  expect(call).not.toContain(malicious); // no inyecta crudo
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscarPorShortcode mapea row encontrado", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  const row = { id: "c1", tenant_id: "tenant-1", shortcode: "hola", content: "Hola!", category: "saludo" };
  mockFetch(new Response(JSON.stringify([row]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseCannedResponseRepo().buscarPorShortcode(TID, "hola");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value?.content).toBe("Hola!");
  restoreFetch(); vi.unstubAllEnvs();
});

test("buscar mapea lista filtrada por tenant_id", async () => {
  vi.stubEnv("SUPABASE_URL", "https://s.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
  mockFetch(new Response(JSON.stringify([{ id: "c1", tenant_id: "tenant-1", shortcode: "hola", content: "Hola!", category: "saludo" }]), { status: 200, headers: { "content-type": "application/json" } }));
  const r = await new SupabaseCannedResponseRepo().buscar(TID);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.length).toBe(1);
  const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
  expect(call).toContain("tenant_id=eq.");
  restoreFetch(); vi.unstubAllEnvs();
});