/**
 * HUB by Raisen — S-6 (Compuerta #100): migracion 052 agrega los campos de perfil del negocio
 * (fisicos + brand voice) para Victor/CEREBRO. El repo NO tiene harness Postgres, asi que
 * A-S-5-1 (CHECK violation runtime) lo verifica el owner en DB; aqui validamos estructuralmente
 * que la migracion define los CHECK y las columnas nuevas (no re-crea las que ya existen en 002).
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

const MIG = readFileSync("supabase/migrations/052_add_brand_voice_fields.sql", "utf8");

test("A-S-5-1 (estructural) CHECK de brand_tone con los 4 tonos oficiales", () => {
  expect(MIG).toMatch(/brand_tone text\s*\n\s*CHECK \(brand_tone IS NULL OR brand_tone IN \('formal', 'casual', 'profesional', 'amigable'\)\)/);
});

test("A-S-5-1b (estructural) CHECK de expected_response_sla con los 4 SLAs", () => {
  expect(MIG).toMatch(/expected_response_sla text\s*\n\s*CHECK \(expected_response_sla IS NULL OR expected_response_sla IN \('<1h', '<4h', '<24h', 'best_effort'\)\)/);
});

test("A-S-5-3 (estructural) todas las columnas nuevas son ADD COLUMN IF NOT EXISTS (opcionales, NULL permitido)", () => {
  for (const col of ["street", "postal_code", "brand_tone", "brand_services", "brand_target_audience", "operation_hours", "expected_response_sla", "brand_mission"]) {
    expect(MIG).toContain(`ADD COLUMN IF NOT EXISTS ${col}`);
  }
  expect(MIG).not.toMatch(/NOT NULL/);
});

test("A-S-5 (estructural) NO re-crea columnas que ya existen en 002_tenants.sql (legal_name/tax_id/industry/city/region)", () => {
  for (const col of ["legal_name", "tax_id", "industry", "city", "region"]) {
    expect(MIG).not.toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\b`));
  }
});

test("A-S-5 (estructural) transaccional (BEGIN/COMMIT) e idempotente", () => {
  expect(MIG).toContain("BEGIN;");
  expect(MIG).toContain("COMMIT;");
});
