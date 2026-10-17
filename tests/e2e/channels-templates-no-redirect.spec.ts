/**
 * HUB by Raisen — E2E Hotfix L (L-REG-1 / L-REG-2): /channels y /templates NO
 * redirigen al wizard cuando falta el tenant.
 *
 * Clave real de sesion: "hub.session" (lib/auth.ts), NO "sb-*-auth-token".
 * Se siembra ANTES del primer paint con addInitScript: un token stub hace que
 * ensureTenantId no resuelva tenant -> config_incompleta -> la pagina se queda.
 *
 * WARNING: @playwright/test NO esta instalado en el monorepo (ver
 * tests/e2e/playwright.config.ts). Para correr:
 *   pnpm add -D @playwright/test && pnpm exec playwright install chromium
 *   E2E_BASE_URL=<preview-vercel> pnpm test:e2e
 */
import { test, expect } from "@playwright/test";

const SESION_SIN_TENANT = JSON.stringify({
  access_token: "stub.sin.tenant",
  refresh_token: "stub",
  user: { id: "00000000-0000-0000-0000-000000000000", app_metadata: {}, user_metadata: {} },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript((sesion: string) => {
    window.localStorage.setItem("hub.session", sesion);
    window.localStorage.removeItem("hub.tenant_id");
  }, SESION_SIN_TENANT);
});

test("L-REG-1 /channels muestra 9 cards sin redirect aunque no haya tenant", async ({ page }) => {
  await page.goto("/channels");
  await expect(page.locator('[data-testid="channel-card"]')).toHaveCount(9);
  await expect(page).toHaveURL(/\/channels$/);
  await expect(page.locator('[data-testid="need-tenant-banner"]')).toBeVisible();
});

test("L-REG-2 /templates muestra los tabs sin redirect aunque no haya tenant", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.locator('[data-testid="templates-tabs"]')).toBeVisible();
  await expect(page).toHaveURL(/\/templates$/);
});

test("L-REG-3 hard reload en /channels sin tenant: sin loop de redirect", async ({ page }) => {
  await page.goto("/channels");
  await page.reload();
  await expect(page.locator('[data-testid="channel-card"]')).toHaveCount(9);
  await expect(page).toHaveURL(/\/channels$/);
});
