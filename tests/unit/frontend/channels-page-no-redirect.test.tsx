/**
 * HUB by Raisen — Hotfix L-2 (A-01/A-03/A-04/A-11): /channels renderiza las 9
 * cards del CATALOGO sin tenant y SIN cambiar la URL. Render real del
 * componente de la ruta (no grep de fuente): pasa por useCanales ->
 * listarCanales -> ensureTenantId -> rpc/mi_tenant.
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PreferencesProvider } from "@/app/preferences";

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).__HUB_CONFIG__ = {
    supabaseUrl: "https://x.supabase.co", anonKey: "anon", hubApiUrl: "https://hub.test",
  };
});
vi.mock("@/app/root", () => ({ rootRoute: {} }));
vi.mock("@tanstack/react-router", () => ({
  createRoute: (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
}));

import { ChannelsRoute } from "@/routes/channels";

const SESSION_KEY = "hub.session";
const ORIGINAL_FETCH = globalThis.fetch;
const URL_INICIAL = "https://app.test/channels";

function location(): { href: string } {
  const loc = { href: URL_INICIAL, assign() {}, replace() {}, reload() {} };
  Object.defineProperty(window, "location", { value: loc, writable: true, configurable: true });
  return loc;
}

function pintar() {
  const ruta = ChannelsRoute as unknown as { component?: () => JSX.Element; options?: { component?: () => JSX.Element } };
  const Page = ruta.component ?? ruta.options?.component;
  if (!Page) throw new Error("ChannelsRoute sin component: el mock del router no aplico");
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}><PreferencesProvider><Page /></PreferencesProvider></QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "tok", user: { id: "u1", app_metadata: {} } }));
});
afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; window.localStorage.clear(); });

test("A-01/A-11 sin tenant: 9 cards + banner CTA y la URL NO cambia", async () => {
  const loc = location();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
  pintar();
  await waitFor(() => expect(screen.getAllByTestId("channel-card")).toHaveLength(9));
  expect(screen.getByTestId("need-tenant-banner")).toBeDefined();
  expect(loc.href).toBe(URL_INICIAL);
});

test("A-04 con tenant: 9 cards con el estado real de cada canal, sin banner", async () => {
  const loc = location();
  window.localStorage.setItem("hub.tenant_id", "t-1");
  // El chip "Conectado" sale de la VERDAD VIVA (/connected-accounts), no del flag guardado de /channels.
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    const body = String(url).includes("/connected-accounts")
      ? { ok: true, items: [{ platform: "whatsapp" }] }
      : { ok: true, channels: [{ id: "c1", platform: "whatsapp", status: "connected", isPaused: false }] };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  });
  pintar();
  await waitFor(() => expect(screen.getAllByTestId("channel-card")).toHaveLength(9));
  expect(screen.queryByTestId("need-tenant-banner")).toBeNull();
  expect(screen.getByText("Conectado")).toBeDefined();
  expect(loc.href).toBe(URL_INICIAL);
});

test("A-02 SIN sesion: unico redirect legitimo -> /login (no se queda en /channels)", async () => {
  const loc = location();
  window.localStorage.clear();
  const fn = vi.fn(); globalThis.fetch = fn;
  pintar();
  await waitFor(() => expect(loc.href).toBe("/login"));
  expect(fn).not.toHaveBeenCalled();
});

test("A-01b error de red: 9 cards + aviso de error con retry, sin redirect", async () => {
  const loc = location();
  window.localStorage.setItem("hub.tenant_id", "t-1");
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }));
  pintar();
  await waitFor(() => expect(screen.getByTestId("channels-error")).toBeDefined());
  expect(screen.getAllByTestId("channel-card")).toHaveLength(9);
  expect(loc.href).toBe(URL_INICIAL);
});
