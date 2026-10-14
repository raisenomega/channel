import { expect, test } from "vitest";
import { MemoryTenantStore, MemoryUserStore } from "../fixtures/memory-store.infrastructure.ts";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import { CrearUserHandler } from "../../../src/identity/application/create-user.handler.ts";

// Integration â€” flujo identity end-to-end contra store en memoria.

test("Identity: crear tenant -> crear owner -> listar por tenant", async () => {
  const tenants = new MemoryTenantStore();
  const users = new MemoryUserStore();
  const crearTenant = new CrearTenantHandler(tenants);
  const crearUser = new CrearUserHandler(users);

  const cmd = {
    name: "Sabor Criollo",
    slug: "sabor-criollo",
    plan: "lite_starter" as const,
    ownerEmail: "anon@example.com",
  };
  const tenantRes = await crearTenant.ejecutar(cmd);
  expect(tenantRes.ok, "se debe crear el tenant").toBe(true);
  const tenantId = tenantRes.value;

  const userRes = await crearUser.ejecutar({
    email: cmd.ownerEmail,
    fullName: "Owner",
    role: "owner",
    tenantId,
  });
  expect(userRes.ok, "se debe crear el owner").toBe(true);
  const userId = userRes.value;

  const ten = await tenants.buscar(tenantId);
  expect(ten.ok).toBe(true);
  expect(ten.value).toBeDefined();
  expect(ten.value.slug).toBe("sabor-criollo");

  const miembros = await users.buscarPorTenant(tenantId);
  expect(miembros.ok).toBe(true);
  expect(miembros.value.length).toBe(1);
  expect(miembros.value[0]?.id).toBe(userId);
});

test("Identity: slug duplicado es rechazado por el store", async () => {
  const tenants = new MemoryTenantStore();
  const handler = new CrearTenantHandler(tenants);
  const cmd = {
    name: "A",
    slug: "mismo-slug",
    plan: "lite_starter" as const,
    ownerEmail: "a@example.com",
  };

  const primero = await handler.ejecutar(cmd);
  expect(primero.ok, "el primer tenant se crea").toBe(true);

  const segundo = await handler.ejecutar({ ...cmd, name: "B" });
  expect(!segundo.ok, "el slug duplicado debe fallar").toBe(true);
  expect(segundo.error.kind).toBe("duplicado");
});

test("Identity: email duplicado es rechazado entre tenants distintos", async () => {
  const tenants = new MemoryTenantStore();
  const users = new MemoryUserStore();
  const crearTenant = new CrearTenantHandler(tenants);
  const crearUser = new CrearUserHandler(users);

  const t1 = await crearTenant.ejecutar({ name: "One", slug: "one", plan: "lite_starter", ownerEmail: "x@example.com" });
  const t2 = await crearTenant.ejecutar({ name: "Two", slug: "two", plan: "lite_starter", ownerEmail: "x@example.com" });
  expect(t1.ok && t2.ok).toBe(true);

  const u1 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "A", role: "agent", tenantId: t1.value });
  expect(u1.ok, "primer usuario se crea").toBe(true);

  const u2 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "B", role: "agent", tenantId: t2.value });
  expect(!u2.ok, "el email duplicado en otro tenant debe fallar").toBe(true);
  expect(u2.error.kind).toBe("duplicado");
});
