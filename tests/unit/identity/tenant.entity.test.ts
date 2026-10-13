import { assertEquals, assert } from "jsr:@std/assert";
import { crearTenant } from "../../../src/identity/domain/tenant.entity.ts";

Deno.test("crearTenant — debe crear tenant en español por defecto", () => {
  const result = crearTenant("Test", "test", "lite_pro");
  assert(result.ok);
  assertEquals(result.value.language, "es");
});

Deno.test("crearTenant — debe aceptar idioma explícito", () => {
  const result = crearTenant("Test", "test", "lite_pro", "en");
  assert(result.ok);
  assertEquals(result.value.language, "en");
});

Deno.test("crearTenant — debe fallar con idioma inválido", () => {
  const result = crearTenant("Test", "test", "lite_pro", "fr" as never);
  assert(!result.ok);
  assertEquals(result.error.kind, "idioma_invalido");
});

Deno.test("crearTenant — debe fallar con nombre vacío", () => {
  const result = crearTenant("", "test", "lite_starter");
  assert(!result.ok);
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("crearTenant — debe generar slug en minúsculas", () => {
  const result = crearTenant("Mi Negocio", "Mi-Negocio-PR", "ecosystem");
  assert(result.ok);
  assertEquals(result.value.slug, "mi-negocio-pr");
});