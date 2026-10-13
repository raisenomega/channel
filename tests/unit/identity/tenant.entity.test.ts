import { assertEquals, assert } from "jsr:@std/assert";
import { crearTenant } from "../../../src/identity/domain/tenant.entity.ts";
import { TenantId } from "../../../src/shared/domain/ids.ts";

Deno.test("crearTenant — debe crear un tenant válido", () => {
  const result = crearTenant("Restaurante Sabor Criollo", "sabor-criollo", "lite_pro");
  assert(result.ok, "debería ser exitoso");
  assertEquals(result.value.name, "Restaurante Sabor Criollo");
  assertEquals(result.value.slug, "sabor-criollo");
  assertEquals(result.value.plan, "lite_pro");
  assertEquals(result.value.countryCode, "PR");
  assertEquals(result.value.status, "active");
  assertEquals(typeof result.value.id, "string");
});

Deno.test("crearTenant — debe fallar con nombre vacío", () => {
  const result = crearTenant("", "test", "lite_starter");
  assert(!result.ok, "debería fallar");
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("crearTenant — debe generar slug en minúsculas", () => {
  const result = crearTenant("Mi Negocio", "Mi-Negocio-PR", "ecosystem");
  assert(result.ok);
  assertEquals(result.value.slug, "mi-negocio-pr");
});