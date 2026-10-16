/**
 * HUB by Raisen — Hotfix G (G-13..G-15): apiFetch nunca inventa tokens; resolveTenantId prioriza el JWT.
 * Corre en jsdom (environmentMatchGlobs tests/unit/frontend/**).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).__HUB_CONFIG__ = { supabaseUrl: "https://x.supabase.co", anonKey: "anon", hubApiUrl: "https://hub.test.railway.app/" };
});
import { apiFetch, rememberTenantId, resolveTenantId } from "../../../apps/tanstack/src/lib/api-client";

const SESSION_KEY = "hub.session";
function conSesion(accessToken: string, appMetadata?: Record<string, unknown>): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: accessToken, refresh_token: "r", user: { id: "u1", app_metadata: appMetadata ?? {} } }));
}
const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; window.localStorage.clear(); });

test("G-13 apiFetch sin sesion -> Error no_session y fetch NO se llama (jamas token inventado)", async () => {
  const fn = vi.fn(); globalThis.fetch = fn;
  await expect(apiFetch("/tenants")).rejects.toThrow("no_session");
  expect(fn).not.toHaveBeenCalled();
});

test("G-14 apiFetch con sesion -> URL base de __HUB_CONFIG__ (sin doble slash) + Authorization EXACTO de la sesion + JSON", async () => {
  conSesion("tok-de-la-sesion");
  const fn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })); globalThis.fetch = fn;
  await apiFetch("/tenants", { method: "POST", body: JSON.stringify({ a: 1 }) });
  const [url, init] = fn.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://hub.test.railway.app/tenants");
  const h = init.headers as Headers;
  expect(h.get("authorization")).toBe("Bearer tok-de-la-sesion");
  expect(h.get("content-type")).toBe("application/json");
  expect(init.method).toBe("POST");
});

test("G-14b apiFetch no pisa un content-type explicito ni filtra el token a la URL", async () => {
  conSesion("tok");
  const fn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })); globalThis.fetch = fn;
  await apiFetch("/x", { body: "a=1", headers: { "content-type": "application/x-www-form-urlencoded" } });
  const [url, init] = fn.mock.calls[0] as [string, RequestInit];
  expect((init.headers as Headers).get("content-type")).toBe("application/x-www-form-urlencoded");
  expect(url).not.toContain("tok");
});

test("G-15 resolveTenantId: app_metadata.tenant_id del JWT > hub.tenant_id recordado > null", () => {
  expect(resolveTenantId()).toBeNull();
  rememberTenantId("t-recordado");
  expect(resolveTenantId()).toBe("t-recordado");
  conSesion("tok", { tenant_id: "t-del-jwt" });
  expect(resolveTenantId()).toBe("t-del-jwt");
  conSesion("tok", {});
  expect(resolveTenantId()).toBe("t-recordado");
});
