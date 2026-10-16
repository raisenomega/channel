import { expect, test } from "vitest";
import { MemoryTenantStore, MemoryUserStore } from "../fixtures/memory-store.infrastructure.ts";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import { CrearUserHandler } from "../../../src/identity/application/create-user.handler.ts";
import type { OwnerClaimsLinker } from "../../../src/identity/domain/identity.repository.ts";
import { ok } from "../../../src/shared/domain/result.ts";

// Integration — flujo identity end-to-end contra store en memoria.
// Hotfix G: CrearTenantHandler exige ownerUserId, crea la fila users del owner (id = sub)
// y enlaza claims via OwnerClaimsLinker (aqui en memoria).

function linkerEnMemoria(registro: Array<{ userId: string; tenantId: string }>): OwnerClaimsLinker {
  return { vincular: async (userId, tenantId) => { registro.push({ userId, tenantId }); return ok(undefined); } };
}

test("Identity: crear tenant -> owner creado por el handler -> agente extra -> listar por tenant", async () => {
  const tenants = new MemoryTenantStore();
  const users = new MemoryUserStore();
  const claims: Array<{ userId: string; tenantId: string }> = [];
  const crearTenant = new CrearTenantHandler(tenants, users, linkerEnMemoria(claims));
  const crearUser = new CrearUserHandler(users);

  const tenantRes = await crearTenant.ejecutar({
    name: "Sabor Criollo", slug: "sabor-criollo", plan: "lite_starter", ownerEmail: "owner@example.com", ownerUserId: "sub-owner",
  });
  expect(tenantRes.ok, "se debe crear el tenant").toBe(true);
  if (!tenantRes.ok) return;
  const tenantId = tenantRes.value;

  const ten = await tenants.buscar(tenantId);
  expect(ten.ok && ten.value?.slug).toBe("sabor-criollo");

  const owner = await users.buscar("sub-owner" as never);
  expect(owner.ok && owner.value?.role).toBe("owner");
  expect(owner.ok && owner.value?.tenantId).toBe(tenantId);
  expect(claims).toEqual([{ userId: "sub-owner", tenantId }]);

  const agente = await crearUser.ejecutar({ email: "agente@example.com", fullName: "Agente", role: "agent", tenantId });
  expect(agente.ok, "se debe crear el agente").toBe(true);

  const miembros = await users.buscarPorTenant(tenantId);
  expect(miembros.ok && miembros.value.map((u) => u.id).sort()).toEqual(["sub-owner", agente.ok ? agente.value : ""].sort());
});

test("Identity: slug duplicado es rechazado por el store (owners distintos)", async () => {
  const tenants = new MemoryTenantStore();
  const handler = new CrearTenantHandler(tenants, new MemoryUserStore(), linkerEnMemoria([]));
  const cmd = { name: "A", slug: "mismo-slug", plan: "lite_starter" as const, ownerEmail: "a@example.com", ownerUserId: "sub-a" };

  const primero = await handler.ejecutar(cmd);
  expect(primero.ok, "el primer tenant se crea").toBe(true);

  const segundo = await handler.ejecutar({ ...cmd, name: "B", ownerEmail: "b@example.com", ownerUserId: "sub-b" });
  expect(!segundo.ok, "el slug duplicado debe fallar").toBe(true);
  if (!segundo.ok) expect(segundo.error.kind).toBe("duplicado");
});

test("Identity: D1 un tenant por usuario -> el mismo owner no puede crear un segundo tenant", async () => {
  const handler = new CrearTenantHandler(new MemoryTenantStore(), new MemoryUserStore(), linkerEnMemoria([]));
  const primero = await handler.ejecutar({ name: "Uno", slug: "uno", plan: "lite_starter", ownerEmail: "o@example.com", ownerUserId: "sub-o" });
  expect(primero.ok).toBe(true);
  const segundo = await handler.ejecutar({ name: "Dos", slug: "dos", plan: "lite_starter", ownerEmail: "o@example.com", ownerUserId: "sub-o" });
  expect(!segundo.ok).toBe(true);
  if (!segundo.ok) expect(segundo.error.kind).toBe("tenant_ya_existe");
});

test("Identity: email duplicado es rechazado entre tenants distintos", async () => {
  const tenants = new MemoryTenantStore();
  const users = new MemoryUserStore();
  const crearTenant = new CrearTenantHandler(tenants, users, linkerEnMemoria([]));
  const crearUser = new CrearUserHandler(users);

  const t1 = await crearTenant.ejecutar({ name: "One", slug: "one", plan: "lite_starter", ownerEmail: "x1@example.com", ownerUserId: "sub-1" });
  const t2 = await crearTenant.ejecutar({ name: "Two", slug: "two", plan: "lite_starter", ownerEmail: "x2@example.com", ownerUserId: "sub-2" });
  expect(t1.ok && t2.ok).toBe(true);
  if (!t1.ok || !t2.ok) return;

  const u1 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "A", role: "agent", tenantId: t1.value });
  expect(u1.ok, "primer usuario se crea").toBe(true);

  const u2 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "B", role: "agent", tenantId: t2.value });
  expect(!u2.ok, "el email duplicado en otro tenant debe fallar").toBe(true);
  if (!u2.ok) expect(u2.error.kind).toBe("duplicado");
});
