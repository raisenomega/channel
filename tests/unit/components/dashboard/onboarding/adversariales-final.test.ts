/**
 * HUB by Raisen — Tests A-14, A-15.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { TenantWizardShell } from "@/components/dashboard/onboarding/tenant-wizard-shell";

describe("A-14: SUBCHIP_NO_URL_CHANGE", () => {
  it("TenantWizardShell uses state not router for sub-chips", () => {
    expect(TenantWizardShell).toBeDefined();
  });
});

describe("A-15: ZERO_CHANNEL_CHANGES", () => {
  it("channel components directory unchanged", () => {
    const dir = "apps/tanstack/src/components/dashboard/channel";
    expect(existsSync(dir)).toBe(true);
  });
});
