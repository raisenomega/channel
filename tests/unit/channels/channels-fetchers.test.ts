/**
 * HUB by Raisen — Hotfix L (A-14): guardia de FUENTE contra la regresion J/K/L.
 * El comportamiento real se prueba en tests/unit/frontend/*-no-redirect.test.tsx
 * (render en jsdom). Aqui solo se vigila que el redirect duro no vuelva a entrar
 * por la puerta de atras: ni en el helper ni en el fetcher.
 */
import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const SRC = readFileSync("apps/tanstack/src/routes/channels-ui/channels-fetchers.ts", "utf8");
const HELP = readFileSync("apps/tanstack/src/lib/redirect-on-error.ts", "utf8");
const TPL = readFileSync("apps/tanstack/src/routes/templates-ui/templates-fetchers.ts", "utf8");

describe("Hotfix L — cero redirect por falta de tenant", () => {
  test("L-1 el helper NO conoce /onboarding/tenant y solo redirige a /login", () => {
    expect(HELP).not.toMatch(/location\.href\s*=[^;]*onboarding/);
    expect(HELP).toContain('window.location.href = "/login"');
    expect(HELP).toContain('if (kind !== "no_autorizado") return;');
  });

  test("L-2 el fetcher de canales llama handleFetcherError SOLO para no_autorizado", () => {
    const llamadas = SRC.split("\n").filter((l) => l.includes("handleFetcherError("));
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]).toContain('"no_autorizado"');
    const iGuardia = SRC.indexOf('r.error.kind === "no_autorizado"');
    const iLlamada = SRC.indexOf("handleFetcherError(");
    expect(iGuardia).toBeGreaterThanOrEqual(0);
    expect(iGuardia).toBeLessThan(iLlamada);
  });

  test("L-2b el fetcher expone el kind del error (la pagina decide el aviso, no un redirect)", () => {
    expect(SRC).toContain("errKind");
    expect(SRC).not.toContain('"config_incompleta"');
  });

  test("L-3 el fetcher de templates traduce config_incompleta a needTenant, sin redirect", () => {
    const llamadas = TPL.split("\n").filter((l) => l.includes("handleFetcherError("));
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]).toContain('"no_autorizado"');
    expect(TPL).toContain("needTenant");
  });
});
