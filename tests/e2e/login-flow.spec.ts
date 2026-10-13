import { test, expect, type Page } from "@playwright/test";

/**
 * HUB by Raisen — Flujo de login (FASE 9.12 / 9.11).
 * Usa email generico anon@example.com (N5, sin datos reales).
 * Mockea Supabase Auth para que el flujo sea determinista sin backend.
 */
function mockSupabase(page: Page): void {
  void page.route("**/auth/v1/token*", async (r) => {
    await r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "token-generico",
        refresh_token: "refresh-generico",
        user: { id: "uid-generico" },
      }),
    });
  });
  void page.route("**/rest/v1/rpc/mi_tenant", async (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  void page.route("**/rest/v1/conversations*", async (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test.beforeEach(async ({ page }) => {
  mockSupabase(page);
  await page.goto("/");
});

test("el formulario de login se muestra", async ({ page }) => {
  await expect(page.locator("[data-login-form]")).toBeVisible();
  await expect(page.locator("[data-login-submit]")).toBeVisible();
  await expect(page.locator("input[name='email']")).toBeVisible();
});

test("login con email generico N5 llega a onboarding", async ({ page }) => {
  await page.locator("input[name='email']").fill("anon@example.com");
  await page.locator("input[name='password']").fill("clave-generica");
  await page.locator("[data-login-submit]").click();
  await expect(page.locator("[data-onboarding-form]")).toBeVisible();
});

test("credenciales invalidas muestran error correcto", async ({ page }) => {
  // Este test sobrescribe el mock de auth para forzar un fallo 400.
  page.unroute("**/auth/v1/token*");
  void page.route("**/auth/v1/token*", async (r) =>
    r.fulfill({ status: 400, contentType: "application/json", body: "{}" }),
  );
  await page.reload();
  await page.locator("input[name='email']").fill("anon@example.com");
  await page.locator("input[name='password']").fill("clave-generica");
  await page.locator("[data-login-submit]").click();
  await expect(page.locator("[data-login-error]")).not.toBeEmpty();
});
