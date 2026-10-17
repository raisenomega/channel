/**
 * HUB by Raisen — Hotfix L-1 (A-08/A-09): handleFetcherError.
 * Test de COMPORTAMIENTO en jsdom (no grep de fuente): config_incompleta NO
 * redirige; no_autorizado redirige a /login y a nada mas.
 */
import { beforeEach, expect, test } from "vitest";
import { handleFetcherError, resolveUserRole } from "../../../apps/tanstack/src/lib/redirect-on-error";

const SESSION_KEY = "hub.session";

function conHref(inicial: string): { href: string } {
  const loc = { href: inicial, assign() {}, replace() {}, reload() {} };
  Object.defineProperty(window, "location", { value: loc, writable: true, configurable: true });
  return loc;
}

beforeEach(() => { window.localStorage.clear(); });

test("A-09 config_incompleta NO redirige (la pagina se queda donde esta)", () => {
  const loc = conHref("https://app.test/channels");
  handleFetcherError("config_incompleta");
  expect(loc.href).toBe("https://app.test/channels");
});

test("A-09b config_incompleta tampoco redirige con role no-superadmin en el JWT", () => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: "t", user: { id: "u1", app_metadata: {} } }));
  expect(resolveUserRole()).toBeNull();
  const loc = conHref("https://app.test/templates");
  handleFetcherError("config_incompleta");
  expect(loc.href).toBe("https://app.test/templates");
});

test("A-08 no_autorizado es el UNICO redirect: /login", () => {
  const loc = conHref("https://app.test/channels");
  handleFetcherError("no_autorizado");
  expect(loc.href).toBe("/login");
});

test("A-14 el helper ya no conoce /onboarding/tenant", () => {
  expect(handleFetcherError.toString()).not.toContain("/onboarding/tenant");
});
