import { assertEquals, assert } from "jsr:@std/assert";
import { MemoryTenantStore, MemoryUserStore } from "../fixtures/memory-store.infrastructure.ts";
import { CrearTenantHandler } from "../../../src/identity/application/create-tenant.handler.ts";
import { CrearUserHandler } from "../../../src/identity/application/create-user.handler.ts";

// Integration — flujo identity end-to-end contra store en memoria.

Deno.test("Identity: crear tenant -> crear owner -> listar por tenant", async () => {
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
  assert(tenantRes.ok, "se debe crear el tenant");
  const tenantId = tenantRes.value;

  const userRes = await crearUser.ejecutar({
    email: cmd.ownerEmail,
    fullName: "Owner",
    role: "owner",
    tenantId,
  });
  assert(userRes.ok, "se debe crear el owner");
  const userId = userRes.value;

  const ten = await tenants.buscar(tenantId);
  assert(ten.ok && ten.value, "el tenant debe existir");
  assertEquals(ten.value.slug, "sabor-criollo");

  const miembros = await users.buscarPorTenant(tenantId);
  assert(miembros.ok);
  assertEquals(miembros.value.length, 1);
  assertEquals(miembros.value[0]?.id, userId);
});

Deno.test("Identity: slug duplicado es rechazado por el store", async () => {
  const tenants = new MemoryTenantStore();
  const handler = new CrearTenantHandler(tenants);
  const cmd = {
    name: "A",
    slug: "mismo-slug",
    plan: "lite_starter" as const,
    ownerEmail: "a@example.com",
  };

  const primero = await handler.ejecutar(cmd);
  assert(primero.ok, "el primer tenant se crea");

  const segundo = await handler.ejecutar({ ...cmd, name: "B" });
  assert(!segundo.ok, "el slug duplicado debe fallar");
  assertEquals(segundo.error.kind, "duplicado");
});

Deno.test("Identity: email duplicado es rechazado entre tenants distintos", async () => {
  const tenants = new MemoryTenantStore();
  const users = new MemoryUserStore();
  const crearTenant = new CrearTenantHandler(tenants);
  const crearUser = new CrearUserHandler(users);

  const t1 = await crearTenant.ejecutar({ name: "One", slug: "one", plan: "lite_starter", ownerEmail: "x@example.com" });
  const t2 = await crearTenant.ejecutar({ name: "Two", slug: "two", plan: "lite_starter", ownerEmail: "x@example.com" });
  assert(t1.ok && t2.ok);

  const u1 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "A", role: "agent", tenantId: t1.value });
  assert(u1.ok, "primer usuario se crea");

  const u2 = await crearUser.ejecutar({ email: "dupe@example.com", fullName: "B", role: "agent", tenantId: t2.value });
  assert(!u2.ok, "el email duplicado en otro tenant debe fallar");
  assertEquals(u2.error.kind, "duplicado");
});