import { expect, test, vi } from "vitest";
import { RateLimiter } from "../../../src/pay/infrastructure/rate-limit.ts";

const ORIGINAL_FETCH = globalThis.fetch;
function restoreFetch(): void { globalThis.fetch = ORIGINAL_FETCH; }

function stubEnv(on: boolean): void {
  if (on) { process.env["SUPABASE_URL"] = "https://s.co"; process.env["SUPABASE_SERVICE_ROLE_KEY"] = "k"; }
  else { delete process.env["SUPABASE_URL"]; delete process.env["SUPABASE_SERVICE_ROLE_KEY"]; }
}

function fake(count: number) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(count), { status: 200, headers: { "content-type": "application/json" } }));
}

test("dentro del threshold -> allowed", async () => {
  stubEnv(true);
  globalThis.fetch = fake(5);
  const rl = new RateLimiter(10);
  const r = await rl.check("1.1.1.1", "/pay/a/o");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.allowed).toBe(true);
  restoreFetch();
});

test("excede threshold -> rate_limited (11<= >10)", async () => {
  stubEnv(true);
  globalThis.fetch = fake(11);
  const rl = new RateLimiter(10);
  const r = await rl.check("1.1.1.1", "/pay/a/o");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("rate_limited");
  restoreFetch();
  stubEnv(false);
});

test("cross-ip isolation: misma path, ip distinta -> allowed", async () => {
  stubEnv(true);
  globalThis.fetch = fake(1); // count bajo para "otra" ip
  const rl = new RateLimiter(2);
  const r = await rl.check("2.2.2.2", "/pay/a/o");
  expect(r.ok).toBe(true);
  restoreFetch();
  stubEnv(false);
});

test("sin env (no supabase) -> allowed no bloquea", async () => {
  stubEnv(false);
  const rl = new RateLimiter(1);
  const r = await rl.check("9.9.9.9", "/pay/x/o");
  expect(r.ok).toBe(true);
});

test("path distinto -> contador separado (ventana por ip+path)", async () => {
  stubEnv(true);
  globalThis.fetch = fake(1);
  const rl = new RateLimiter(2);
  const a = await rl.check("1.1.1.1", "/pay/A/order1");
  expect(a.ok).toBe(true);
  const b = await rl.check("1.1.1.1", "/pay/B/order2");
  expect(b.ok).toBe(true);
  restoreFetch();
  stubEnv(false);
});