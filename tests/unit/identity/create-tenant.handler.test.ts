/**
 * HUB by Raisen — CrearTenantHandler (Hotfix G: D1 un tenant por usuario + enlace de claims).
 */
import { expect, test } from "vitest";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import type { OwnerClaimsLinker, TenantRepository, UserRepository } from "../../../src/identity/domain/identity.repository.ts";
import type { UserState } from "../../../src/identity/domain/user.entity.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

const CMD = { name: "Test", slug: "test", plan: "esencial" as const, ownerEmail: "owner@example.com", ownerUserId: "sub-1" };

function tenantRepo(falla = false): TenantRepository {
  return {
    guardar: async () => falla ? err({ kind: "persistence_failure", cause: "DB down" }) : ok(undefined),
    buscar: async () => ok(null),
    buscarPorSlug: async () => ok(null),
  };
}
function userRepo(existente: UserState | null, registro: { guardados: UserState[]; vinculos: string[] }): UserRepository {
  return {
    guardar: async (u) => { registro.guardados.push(u); return ok(undefined); },
    buscar: async () => ok(existente),
    buscarPorTenant: async () => ok([]),
    buscarPorEmail: async () => ok(null),
    vincularTenant: async (userId, tenantId) => { registro.vinculos.push(`${userId}->${tenantId}`); return ok(undefined); },
  };
}
function linker(registro: string[], falla = false): OwnerClaimsLinker {
  return { vincular: async (u, t) => { registro.push(`${u}:${t}`); return falla ? err({ kind: "persistence_failure", cause: "gotrue" }) : ok(undefined); } };
}
const usuarioCon = (tenantId: string | null): UserState => ({
  id: "sub-1" as never, tenantId: tenantId as never, email: null as never, fullName: "x", role: "agent", language: "es", isActive: true, createdAt: new Date(),
});

test("happy: crea tenant, fila users con id = ownerUserId y rol owner, y enlaza claims", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] }; const claims: string[] = [];
  const r = await new CrearTenantHandler(tenantRepo(), userRepo(null, reg), linker(claims)).ejecutar(CMD);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(reg.guardados).toHaveLength(1);
  expect(reg.guardados[0]!.id).toBe("sub-1");
  expect(reg.guardados[0]!.role).toBe("owner");
  expect(reg.guardados[0]!.tenantId).toBe(r.value);
  expect(claims).toEqual([`sub-1:${r.value}`]);
  expect(reg.vinculos).toEqual([]);
});

test("G-11 D1: usuario ya tiene tenant -> tenant_ya_existe, no crea nada ni toca claims", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] }; const claims: string[] = [];
  const r = await new CrearTenantHandler(tenantRepo(), userRepo(usuarioCon("tenant-viejo"), reg), linker(claims)).ejecutar(CMD);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toEqual({ kind: "tenant_ya_existe", tenantId: "tenant-viejo" });
  expect(reg.guardados).toHaveLength(0);
  expect(claims).toHaveLength(0);
});

test("fila users existente sin tenant -> vincularTenant en vez de insert", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] }; const claims: string[] = [];
  const r = await new CrearTenantHandler(tenantRepo(), userRepo(usuarioCon(null), reg), linker(claims)).ejecutar(CMD);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(reg.guardados).toHaveLength(0);
  expect(reg.vinculos).toEqual([`sub-1->${r.value}`]);
});

test("ownerUserId vacio -> owner_requerido (nunca tenant anonimo)", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] };
  const r = await new CrearTenantHandler(tenantRepo(), userRepo(null, reg), linker([])).ejecutar({ ...CMD, ownerUserId: "" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("owner_requerido");
});

test("linker falla -> owner_link_failed (el tenant quedo creado: se reporta, no se esconde)", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] };
  const r = await new CrearTenantHandler(tenantRepo(), userRepo(null, reg), linker([], true)).ejecutar(CMD);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("owner_link_failed");
});

test("repo de tenants falla -> persistence_failure y no se crea users", async () => {
  const reg = { guardados: [] as UserState[], vinculos: [] as string[] };
  const r = await new CrearTenantHandler(tenantRepo(true), userRepo(null, reg), linker([])).ejecutar(CMD);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("persistence_failure");
  expect(reg.guardados).toHaveLength(0);
});
