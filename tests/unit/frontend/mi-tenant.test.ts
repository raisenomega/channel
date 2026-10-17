/**
 * HUB by Raisen — Hotfix L-1b: ensureTenantId hidrata el tenant REAL via RPC
 * mi_tenant (migracion 022) cuando el JWT no trae app_metadata.tenant_id.
 * Sin esto la UI le decia "crea tu primer cliente" a un usuario que YA tiene
 * tenant en public.users (caso owner nucleoraisen@gmail.com).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).__HUB_CONFIG__ = {
    supabaseUrl: "https://x.supabase.co", anonKey: "anon", hubApiUrl: "https://hub.test",
  };
});
import { ensureTenantId, errorSinTenant } from "../../../apps/tanstack/src/lib/tenant-client/mi-tenant";
import { resolveTenantId } from "../../../apps/tanstack/src/lib/api-client";

const SESSION_KEY = "hub.session";
const ORIGINAL_FETCH = globalThis.fetch;

function conSesion(appMetadata?: Record<string, unknown>): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({
    access_token: "tok", refresh_token: "r", user: { id: "u1", app_metadata: appMetadata ?? {} },
  }));
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; window.localStorage.clear(); });

test("L-1b sin tenant en el JWT: llama rpc/mi_tenant y recuerda el tenant real", async () => {
  conSesion();
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ tenant_id: "7cd33369", name: "Nucelo" }]), { status: 200 }));
  globalThis.fetch = fn;
  expect(await ensureTenantId()).toBe("7cd33369");
  const [url, init] = fn.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://x.supabase.co/rest/v1/rpc/mi_tenant");
  expect(init.method).toBe("POST");
  expect(resolveTenantId()).toBe("7cd33369");
});

test("L-1b con tenant en el JWT: no gasta llamada al RPC", async () => {
  conSesion({ tenant_id: "t-del-jwt" });
  const fn = vi.fn(); globalThis.fetch = fn;
  expect(await ensureTenantId()).toBe("t-del-jwt");
  expect(fn).not.toHaveBeenCalled();
});

test("L-1b RPC vacio: null honesto (el usuario realmente no tiene tenant), sin inventar id", async () => {
  conSesion();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
  expect(await ensureTenantId()).toBeNull();
  expect(resolveTenantId()).toBeNull();
});

test("A-02 errorSinTenant distingue sesion caida (no_autorizado) de falta de tenant (config_incompleta)", () => {
  expect(errorSinTenant()).toEqual({ kind: "no_autorizado" });
  conSesion();
  expect(errorSinTenant()).toEqual({ kind: "config_incompleta" });
});

test("L-1b RPC en error (500 recursion RLS, red caida): null, nunca throw", async () => {
  conSesion();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }));
  await expect(ensureTenantId()).resolves.toBeNull();
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));
  await expect(ensureTenantId()).resolves.toBeNull();
});
