/**
 * HUB by Raisen — R-7 (Compuerta #81) adversariales: planes renombrados a oficiales
 * (Esencial/Pro/Business + ecosystem/enterprise). Migracion 050 = CHECK-swap sobre columna TEXT
 * (NO enum), backfill + default 'esencial'. Cero 'lite_*' residual.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { t } from "../../../apps/tanstack/src/lib/i18n";

test("A-R-7-1: i18n planes oficiales Esencial/Pro/Business (no 'Lite Starter')", () => {
  expect(t("es", "plan.esencial")).toBe("Esencial");
  expect(t("en", "plan.pro")).toBe("Pro");
  expect(t("es", "plan.business")).toBe("Business");
});

test("A-R-7-2: PlanChips usa valores oficiales (esencial, sin lite_starter)", () => {
  const chips = readFileSync("apps/tanstack/src/components/dashboard/onboarding/plan-chips.tsx", "utf8");
  expect(chips).toContain('"esencial"');
  expect(chips).not.toContain("lite_starter");
});

test("A-R-7-3: migracion 050 = CHECK-swap (no CREATE TYPE enum) + default esencial", () => {
  const mig = readFileSync("supabase/migrations/050_rename_plan_values.sql", "utf8");
  expect(mig).toContain("tenants_plan_check");
  expect(mig).toContain("'esencial'");
  expect(mig).not.toMatch(/CREATE\s+TYPE\s+\w+\s+AS\s+ENUM/i); // 050 NO crea enum pg
  expect(mig).toContain("SET DEFAULT 'esencial'");
  // Compuerta #84: inbox_addon eliminado del CHECK (0 uso). El CHECK solo lista los 5 oficiales.
  expect(mig).toMatch(/CHECK \(plan IN \('esencial', 'pro', 'business', 'ecosystem', 'enterprise'\)\)/);
});

test("A-R-7-5: inbox_addon eliminado del tipo y del CHECK (Compuerta #84)", () => {
  const types = readFileSync("src/shared/domain/types.ts", "utf8");
  expect(types).not.toContain("inbox_addon");
  const mig = readFileSync("supabase/migrations/050_rename_plan_values.sql", "utf8");
  // No debe aparecer como valor valido del CHECK (un INSERT con inbox_addon violaria el constraint).
  expect(mig).not.toMatch(/'inbox_addon'/);
});

test("A-R-7-4: POST /tenants default plan = esencial (S-1 guard: plan invalido -> fallback esencial)", () => {
  const src = readFileSync("src/identity/presentation/tenants.routes.ts", "utf8");
  expect(src).toContain(': "esencial"'); // rama default del guard esPlanValido (#95)
  expect(src).toContain("esPlanValido");
});
