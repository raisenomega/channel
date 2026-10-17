/**
 * HUB by Raisen — Hotfix L-3 (A-05/A-06/A-12): /templates renderiza los tabs
 * sin tenant y SIN cambiar la URL. Render real del componente de la ruta.
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

import { TemplatesRoute } from "@/routes/templates";

const SESSION_KEY = "hub.session";
const ORIGINAL_FETCH = globalThis.fetch;
const URL_INICIAL = "https://app.test/templates";

function location(): { href: string } {
  const loc = { href: URL_INICIAL, assign() {}, replace() {}, reload() {} };
  Object.defineProperty(window, "location", { value: loc, writable: true, configurable: true });
  return loc;
}

function pintar() {
  const ruta = TemplatesRoute as unknown as { component?: () => JSX.Element; options?: { component?: () => JSX.Element } };
  const Page = ruta.component ?? ruta.options?.component;
  if (!Page) throw new Error("TemplatesRoute sin component: el mock del router no aplico");
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

test("A-05/A-12 sin tenant: tabs visibles + banner CTA + lista vacia, URL intacta", async () => {
  const loc = location();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
  pintar();
  expect(screen.getByTestId("templates-tabs")).toBeDefined();
  await waitFor(() => expect(screen.getByTestId("need-tenant-banner")).toBeDefined());
  expect(screen.getByText(/Sin plantillas/)).toBeDefined();
  expect(loc.href).toBe(URL_INICIAL);
});

test("A-06 con tenant: lista las plantillas reales, sin banner", async () => {
  const loc = location();
  window.localStorage.setItem("hub.tenant_id", "t-1");
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    ok: true, templates: [{ id: "tp1", name: "recordatorio_cita", language: "es", category: "utility", status: "approved", body: "Hola" }],
  }), { status: 200 }));
  pintar();
  await waitFor(() => expect(screen.getByText("recordatorio_cita")).toBeDefined());
  expect(screen.queryByTestId("need-tenant-banner")).toBeNull();
  expect(screen.getByTestId("templates-tabs")).toBeDefined();
  expect(loc.href).toBe(URL_INICIAL);
});
