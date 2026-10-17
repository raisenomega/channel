import { describe, test, expect } from "vitest";
import { t } from "@/lib/i18n";

const NAV_KEYS = [
  "nav.dashboard", "nav.contacts", "nav.quotes", "nav.orders",
  "nav.payments", "nav.automation", "nav.reports", "nav.agent",
  "nav.channels", "nav.settings",
];

describe("Hotfix J-1 regression — todas las claves nav.* traducidas en ES/EN", () => {
  for (const key of NAV_KEYS) {
    test(`${key} tiene traduccion ES (no literal)`, () => {
      const translation = t("es", key as never);
      expect(translation).not.toBe(key);
      expect(translation.length).toBeGreaterThan(0);
    });
    test(`${key} tiene traduccion EN (no literal)`, () => {
      const translation = t("en", key as never);
      expect(translation).not.toBe(key);
      expect(translation.length).toBeGreaterThan(0);
    });
  }
  test("nav.dashboard especificamente: ES=Panel, EN=Dashboard (owner spec)", () => {
    expect(t("es", "nav.dashboard" as never)).toBe("Panel");
    expect(t("en", "nav.dashboard" as never)).toBe("Dashboard");
  });
});