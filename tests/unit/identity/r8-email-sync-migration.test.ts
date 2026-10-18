/**
 * HUB by Raisen — R-8 (Compuerta #83): migracion 051 sincroniza public.users.email con
 * auth.users (fuente de verdad) via trigger BEFORE + funcion SECURITY DEFINER.
 * NOTA: el repo NO tiene harness Postgres (integration = repos in-memory), asi que el
 * comportamiento runtime A-R-8-1..5 lo verifica el owner en DB post-apply. Aqui validamos
 * estructuralmente que la migracion tiene las propiedades de seguridad exigidas por #83.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

const MIG = readFileSync("supabase/migrations/051_users_email_sync_trigger.sql", "utf8");

test("A-R-8 (estructural) funcion SECURITY DEFINER con search_path fijado (hardening)", () => {
  expect(MIG).toMatch(/CREATE OR REPLACE FUNCTION public\.sync_user_email_from_auth/);
  expect(MIG).toContain("SECURITY DEFINER");
  expect(MIG).toMatch(/SET search_path = public, auth, pg_temp/);
});

test("A-R-8-1/2 (estructural) sobrescribe NEW.email con el de auth.users (fuente de verdad)", () => {
  expect(MIG).toMatch(/SELECT email INTO auth_email FROM auth\.users WHERE id = NEW\.id/);
  expect(MIG).toMatch(/NEW\.email := auth_email/);
});

test("A-R-8-3 (estructural) id ausente en auth.users -> RAISE EXCEPTION (fail hard)", () => {
  expect(MIG).toMatch(/IF auth_email IS NULL THEN\s*\n\s*RAISE EXCEPTION/);
});

test("A-R-8-4 (estructural) trigger BEFORE INSERT OR UPDATE OF email en public.users", () => {
  expect(MIG).toMatch(/BEFORE INSERT OR UPDATE OF email ON public\.users/);
  expect(MIG).toContain("REVOKE ALL ON FUNCTION public.sync_user_email_from_auth() FROM PUBLIC");
});

test("A-R-8-5 (estructural) backfill one-time de users desincronizados", () => {
  expect(MIG).toMatch(/UPDATE public\.users u\s*\n\s*SET email = a\.email\s*\n\s*FROM auth\.users a/);
  expect(MIG).toMatch(/u\.email IS DISTINCT FROM a\.email/);
});
