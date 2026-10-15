import { expect, test } from "vitest";
import { crearSlug } from "../../../src/tenants/domain/slug.vo.ts";

test("slug válido -> ok", () => {
  const r = crearSlug("zafacones-ramos");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.value).toBe("zafacones-ramos");
});

test("slug con MAYÚSCULAS -> normalizado a minúsculas", () => {
  const r = crearSlug("Zafacones-Ramos");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.value).toBe("zafacones-ramos");
});

test("slug demasiado corto (<3) -> slug_invalido", () => {
  expect(crearSlug("ab").ok).toBe(false);
});

test("slug demasiado largo (>64) -> slug_invalido", () => {
  expect(crearSlug("a".repeat(65)).ok).toBe(false);
});

test("slug con caracter no permitido (_) -> slug_invalido", () => {
  expect(crearSlug("a_b_c").ok).toBe(false);
});

test("slug con espacios laterales -> trim", () => {
  const r = crearSlug("  mi-negocio  ");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.value).toBe("mi-negocio");
});

test("slug empezando con guion -> slug_invalido", () => {
  expect(crearSlug("-negocio").ok).toBe(false);
});

test("slug acabando con guion -> slug_invalido", () => {
  expect(crearSlug("negocio-").ok).toBe(false);
});