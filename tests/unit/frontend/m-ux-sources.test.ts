/**
 * HUB by Raisen — Guardias de fuente para Hotfix M (A-M-1/2/3/5/8).
 * El comportamiento fino se valida en render/jsdom + screenshots del owner;
 * aqui se fija el contrato para evitar regresion.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

const LF = readFileSync("apps/tanstack/src/routes/login/login-form.tsx", "utf8");
const LP = readFileSync("apps/tanstack/src/routes/login/login-page.tsx", "utf8");
const SHELL = readFileSync("apps/tanstack/src/components/layout/shell.tsx", "utf8");
const REG = readFileSync("apps/tanstack/src/components/dashboard/registro/registro-whatsapp.tsx", "utf8");
const ESD = readFileSync("apps/tanstack/src/lib/i18n/es-dash.ts", "utf8");

test("A-M-5 'FORTRESS' ausente en /login (login-form + login-page)", () => {
  expect(LF.toUpperCase()).not.toContain("FORTRESS");
  expect(LP.toUpperCase()).not.toContain("FORTRESS");
});

test("A-M-3 boton dinamico Entrar / Crear cuenta", () => {
  expect(LF).toContain('"Entrar"');
  expect(LF).toContain('"Crear cuenta"');
  expect(LF).not.toContain('"Continuar"');
});

test("A-M-1 register llama signUp (registerUser), login llama login", () => {
  expect(LP).toContain("registerUser");
  expect(LP).toMatch(/mode === "login" \? await login/);
});

test("A-M-2 / Z-3 Shell: nav por ruta (chips permanentes), useSession solo por su efecto lateral", () => {
  expect(SHELL).toContain("useSession"); // D-51: efecto lateral (espeja hub.session para apiFetch) intacto
  expect(SHELL).toMatch(/showChrome\s*\?/); // Z-3: visibilidad del nav por ruta, no por estado de sesion (flaky)
});

test("A-M-8 / SOT CTA Crear mi negocio vive en la barra WhatsApp (no en el KPI)", () => {
  expect(REG).toContain("dash.createMyBusiness"); // SOT: el CTA vive en la barra WhatsApp, no en el KPI
  expect(ESD).toContain("Crear mi negocio");
});
