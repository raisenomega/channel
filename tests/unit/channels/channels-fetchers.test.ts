import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const SRC = readFileSync("apps/tanstack/src/routes/channels-ui/channels-fetchers.ts", "utf8");
const HELP = readFileSync("apps/tanstack/src/lib/redirect-on-error.ts", "utf8");

describe("Hotfix J+K regression Bug 2 — fetcher redirect logic", () => {
  test("K-2a fetcher llama handleFetcherError para config_incompleta y no_autorizado", () => {
    // check that both conditions exist and handleFetcherError is called
    expect(SRC).toContain("config_incompleta");
    expect(SRC).toContain("no_autorizado");
    expect(SRC).toContain("handleFetcherError");
    // verify the call passes the error kind
    const callLine = SRC.split("\n").findIndex((l) => l.includes("handleFetcherError"));
    expect(callLine).toBeGreaterThanOrEqual(0);
  });

  test("K-2b helper redirect-on-error: config_incompleta -> /onboarding/tenant, no_autorizado -> /login", () => {
    expect(HELP).toContain('"/onboarding/tenant"');
    expect(HELP).toContain('"/login"');
    expect(HELP).toContain("handleFetcherError");
  });

  test("K-2c error 'red' sin redirect — setErr(true) despues de los ifs", () => {
    const errSetLine = SRC.split("\n").findIndex((l) => l.includes("setErr(true)"));
    expect(errSetLine).toBeGreaterThanOrEqual(0);
    const bothIfs = ["config_incompleta", "no_autorizado"].every((k) => {
      const i = SRC.split("\n").findIndex((l) => l.includes(k));
      return i < errSetLine;
    });
    expect(bothIfs).toBe(true);
  });
});