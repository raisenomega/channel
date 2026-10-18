import { expect, test } from "vitest";
import { crearTenant } from "../../../src/identity/domain/tenant.entity.ts";

test("crearTenant â€” debe crear tenant en espaÃ±ol por defecto", () => {
  const result = crearTenant("Test", "test", "lite_pro");
  expect(result.ok).toBe(true);
  expect(result.value.language).toBe("es");
});

test("crearTenant â€” debe aceptar idioma explÃ­cito", () => {
  const result = crearTenant("Test", "test", "lite_pro", "en");
  expect(result.ok).toBe(true);
  expect(result.value.language).toBe("en");
});

test("crearTenant â€” debe fallar con idioma invÃ¡lido", () => {
  const result = crearTenant("Test", "test", "lite_pro", "fr" as never);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("idioma_invalido");
});

test("crearTenant â€” debe fallar con nombre vacÃ­o", () => {
  const result = crearTenant("", "test", "lite_starter");
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("nombre_vacio");
});

test("crearTenant â€” debe generar slug en minÃºsculas", () => {
  const result = crearTenant("Mi Negocio", "Mi-Negocio-PR", "ecosystem");
  expect(result.ok).toBe(true);
  expect(result.value.slug).toBe("mi-negocio-pr");
});

// K-5-bis (A-06): phone del negocio E.164 persiste en TenantState
test("K-5-bis phone E.164 valido se guarda en state.phone", () => {
  const result = crearTenant("Test", "test", "lite_starter", "es", "PR", "America/Puerto_Rico", "+17871234567");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.phone).toBe("+17871234567");
});

test("K-5-bis phone invalido (+PR123) -> telefono_invalido", () => {
  const result = crearTenant("Test", "test", "lite_starter", "es", "PR", "America/Puerto_Rico", "+PR123");
  expect(!result.ok).toBe(true);
  if (result.ok) return;
  expect(result.error.kind).toBe("telefono_invalido");
});

test("K-5-bis phone vacio -> phone = null (nullable, coherente con CHECK 045)", () => {
  const result = crearTenant("Test", "test", "lite_starter");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.phone).toBeNull();
});
