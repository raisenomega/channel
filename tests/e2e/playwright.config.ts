import { defineConfig, devices } from "@playwright/test";

/**
 * HUB by Raisen — Config E2E Playwright (FASE 9.11).
 * Base por defecto: channel-blue.vercel.app; override con E2E_BASE_URL
 * (ej. http://localhost:5173 con el dev server de apps/web activo).
 * WARNING: @playwright/test NO esta instalado en el monorepo. Para
 * ejecutar estos tests: pnpm add -D @playwright/test
 */
const BASE = process.env["E2E_BASE_URL"] ?? "https://channel-blue.vercel.app";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});