import { expect, test, vi } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";

/**
 * Hotfix I — Compuerta #20 smoke (drift-check).
 * Verifica: (1) el script existe, (2) orden lexicográfico 035-bis entre 035 y 036,
 * (3) el script hace skip sin SUPABASE_ACCESS_TOKEN, (4) se cablea en package.json.
 */

test("A-05 orden: 035-bis_personas se aplica ANTES de 036 y de 040 (dependencia seed thao)", () => {
  const migs = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  expect(migs).toContain("035-bis_personas.sql");
  const i35b = migs.indexOf("035-bis_personas.sql");
  const i36 = migs.indexOf("036_channel_connections.sql");
  const i40 = migs.indexOf("040_activity_log.sql");
  // personas (035-bis) debe aplicarse antes que channel_connections y que el INSERT de 040
  expect(i35b).toBeGreaterThanOrEqual(0);
  expect(i35b).toBeLessThan(i36);
  expect(i35b).toBeLessThan(i40);
});

test("Compuerta #20: script check-migrations-drift.sh existe", () => {
  expect(existsSync("scripts/check-migrations-drift.sh")).toBe(true);
  const src = readFileSync("scripts/check-migrations-drift.sh", "utf8");
  expect(src).toContain("SUPABASE_ACCESS_TOKEN");
  expect(src).toContain("exit 0");
  expect(src).toContain("exit 1");
});

test("Compuerta #20: script cableado en package.json (check:migrations)", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  expect(pkg.scripts["check:migrations"]).toBe("bash scripts/check-migrations-drift.sh");
});

test("Compuerta #20: CI incluye el step check:migrations", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  expect(ci).toContain("pnpm run check:migrations");
  expect(ci).toContain("SUPABASE_ACCESS_TOKEN");
});