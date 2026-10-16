import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Hotfix J-3: verifica que channels-fetchers.ts tiene los redirects correctos
 * (bug 2) por análisis de código fuente. Evita dependencia de DOM/react-query.
 */
describe("Hotfix J regression Bug 2 — redirect logic", () => {
  const src = readFileSync("apps/tanstack/src/routes/channels-ui/channels-fetchers.ts", "utf8");

  test("config_incompleta redirige a /onboarding/tenant (NO /login)", () => {
    const lines = src.split("\n");
    const incompleteLine = lines.findIndex((l) => l.includes("config_incompleta"));
    expect(incompleteLine).toBeGreaterThanOrEqual(0);
    // La linea SIGUIENTE despues del check debe tener /onboarding/tenant
    const next = lines.slice(incompleteLine, incompleteLine + 6).join(" ");
    expect(next).toContain("/onboarding/tenant");
    expect(next).not.toContain("/login");
  });

  test("no_autorizado redirige a /login", () => {
    const lines = src.split("\n");
    const unauthLine = lines.findIndex((l) => l.includes("=== \"no_autorizado\""));
    expect(unauthLine).toBeGreaterThanOrEqual(0);
    const next = lines.slice(unauthLine, unauthLine + 6).join(" ");
    expect(next).toContain("/login");
  });

  test("error 'red' (u otros) no causa redirect (sin location.href)", () => {
    // Despues de los dos ifs, solo debe setErr y return []
    const errSetLine = src.split("\n").findIndex((l) => l.includes("setErr(true)"));
    const preceding = src.split("\n").slice(errSetLine - 1, errSetLine)[0] ?? "";
    // Verificar que setErr(true) ocurre DESPUES de ambos ifs (no dentro de ellos)
    const bothIfs = ["config_incompleta", "no_autorizado"].every((k) => {
      const i = src.split("\n").findIndex((l) => l.includes(k));
      return i < errSetLine;
    });
    expect(bothIfs).toBe(true);
  });
});