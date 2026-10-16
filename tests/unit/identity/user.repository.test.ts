/**
 * HUB by Raisen — Hotfix G (G-12): UserRepositorySupabase.buscar trata PGRST116 como "no existe" y vincularTenant.
 */
import { expect, test, vi } from "vitest";

const db = vi.hoisted(() => ({ single: { data: null as unknown, error: null as unknown }, updates: [] as unknown[] }));
vi.mock("../../../src/shared/infrastructure/supabase.client.ts", () => {
  const chain: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => chain;
  Object.assign(chain, {
    from: self, select: self, eq: self,
    single: async () => db.single,
    update: (patch: unknown) => { db.updates.push(patch); return { eq: async (col: string, val: string) => { db.updates.push([col, val]); return { data: null, error: null }; } }; },
  });
  return { supabase: chain };
});
import { UserRepositorySupabase } from "../../../src/identity/infrastructure/user.repository.supabase.ts";

test("G-12 buscar: PGRST116 (sin filas) -> ok(null), NO persistence_failure (antes bloqueaba crear el primer tenant)", async () => {
  db.single = { data: null, error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" } };
  const r = await new UserRepositorySupabase().buscar("u1" as never);
  expect(r).toEqual({ ok: true, value: null });
});

test("G-12b buscar: otro error -> persistence_failure con causa", async () => {
  db.single = { data: null, error: { code: "42P01", message: "relation users does not exist" } };
  const r = await new UserRepositorySupabase().buscar("u1" as never);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toEqual({ kind: "persistence_failure", cause: "relation users does not exist" });
});

test("G-12c buscar: fila existente -> UserState mapeado con tenantId", async () => {
  db.single = { data: { id: "u1", tenant_id: "t1", email: "a@b.pr", full_name: "A", role: "owner", language: "es", is_active: true, created_at: "2026-10-16T00:00:00Z" }, error: null };
  const r = await new UserRepositorySupabase().buscar("u1" as never);
  expect(r.ok && r.value?.tenantId).toBe("t1");
  expect(r.ok && r.value?.role).toBe("owner");
});

test("vincularTenant: update users set tenant_id + role owner where id = userId", async () => {
  db.updates.length = 0;
  const r = await new UserRepositorySupabase().vincularTenant("u1" as never, "t9" as never);
  expect(r.ok).toBe(true);
  expect(db.updates).toEqual([{ tenant_id: "t9", role: "owner" }, ["id", "u1"]]);
});
