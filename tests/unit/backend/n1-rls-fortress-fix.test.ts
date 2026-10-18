import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
const SQL = readFileSync("supabase/migrations/047_fix_users_rls_profile.sql", "utf8");
test("A-N-1: 047 bloquea escalada de tenant_id/role del propio usuario (trigger BEFORE UPDATE)", () => {
  expect(SQL).toContain("guard_users_self_update");
  expect(SQL).toContain("BEFORE UPDATE ON public.users");
  expect(SQL).toContain("auth.uid() = OLD.id");
  expect(SQL).toMatch(/NEW\.tenant_id IS DISTINCT FROM OLD\.tenant_id/);
  expect(SQL).toMatch(/NEW\.role IS DISTINCT FROM OLD\.role/);
});
