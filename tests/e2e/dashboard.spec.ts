import { test, expect, type Page } from "@playwright/test";

/**
 * HUB by Raisen — Dashboard (FASE 9.12 / 9.11).
 * Seed session en localStorage y mockea Supabase para que el shell
 * arranque directamente en el dashboard sin datos reales (N5/P1).
 */
function semillaSession(page: Page): void {
  void page.addInitScript(() => {
    const session = {
      accessToken: "tok-generico",
      refreshToken: "ref-generico",
      uid: "uid-generico",
      email: "anon@example.com",
      tenant: { tenantId: "tnt-generico", name: "Empresa demo", plan: "lite_starter", slug: "empresa-demo" },
    };
    localStorage.setItem("hub.session", JSON.stringify(session));
  });
}

function mockSupabase(page: Page): void {
  void page.route("**/rest/v1/rpc/mi_tenant", async (r) => {
    await r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ tenant_id: "tnt-generico", name: "Empresa demo", plan: "lite_starter", slug: "empresa-demo" }]),
    });
  });
  // Inbox vacio (N5 — ni datos fabricados ni placeholders).
  void page.route("**/rest/v1/conversations*", async (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  void page.route("**/auth/v1/logout", async (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
}

test.beforeEach(async ({ page }) => {
  semillaSession(page);
  mockSupabase(page);
  await page.goto("/");
});

test("las pestanas de navegacion existen", async ({ page }) => {
  const tabs = page.locator("[data-tab]");
  await expect(tabs).toHaveCount(4);
  const text = await tabs.allTextContents();
  expect(text.map((t) => t.trim())).toEqual(expect.arrayContaining(["Inbox", "IA", "Canales", "Ajustes"]));
});

test("el dashboard muestra KPIs sin datos inventados", async ({ page }) => {
  await expect(page.locator(".kpis")).toBeVisible();
  await expect(page.locator(".kpi")).toHaveCount(4);
});

test("los chips de canales se renderizan", async ({ page }) => {
  await expect(page.locator(".chips")).toBeVisible();
  const chips = page.locator(".chip");
  await expect(chips.first()).toBeVisible();
});