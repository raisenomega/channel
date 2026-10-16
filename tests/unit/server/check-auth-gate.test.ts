/**
 * HUB by Raisen — Hotfix F-urgente: A-10 el gate check:auth (Compuerta #17) existe, pasa y esta cableado.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("A-10 CHECK_AUTH_SCRIPT_PASSES: scripts/check-auth.sh exit 0 y reporta 0 handlers sin compuerta", () => {
  expect(existsSync("scripts/check-auth.sh")).toBe(true);
  const out = execFileSync("bash", ["scripts/check-auth.sh"], { encoding: "utf8", timeout: 60_000 });
  expect(out).toContain("0 handlers sin compuerta");
  expect(out).not.toContain("FALTA");
});

test("A-10b check:auth cableado en package.json y en el workflow de CI", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  expect(pkg.scripts["check:auth"]).toBe("bash scripts/check-auth.sh");
  expect(readFileSync(".github/workflows/ci.yml", "utf8")).toContain("pnpm check:auth");
});
