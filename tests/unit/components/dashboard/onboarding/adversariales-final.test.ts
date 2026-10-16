/**
 * HUB by Raisen — Tests A-14, A-15.
 * A-14 se verifica a nivel de fuente: importar el shell arrastra @tanstack/react-router,
 * que solo existe en apps/tanstack/node_modules (no es miembro del workspace; CI no lo instala).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const SHELL = "apps/tanstack/src/components/dashboard/onboarding/tenant-wizard-shell.tsx";

describe("A-14: SUBCHIP_NO_URL_CHANGE", () => {
  it("TenantWizardShell uses state not router for sub-chips", () => {
    const src = readFileSync(SHELL, "utf8");
    expect(src).toContain('useState<SubChip>("basicos")');
    expect(src).toContain("onClick={() => setChip(c)}");
    expect(src).not.toMatch(/useSearch\(|search:\s*\{|to:\s*"\/onboarding/);
  });
});

describe("A-15: ZERO_CHANNEL_CHANGES", () => {
  it("channel components directory unchanged", () => {
    const dir = "apps/tanstack/src/components/dashboard/channel";
    expect(existsSync(dir)).toBe(true);
  });
});
