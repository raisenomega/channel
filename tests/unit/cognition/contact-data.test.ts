/**
 * HUB by Raisen — Parte B: parse ROBUSTO de los datos que el cliente da (valida email/telefono, descarta basura).
 */
import { expect, test } from "vitest";
import { parseExtracted } from "../../../src/cognition/domain/contact-data.ts";

test("CD-01 JSON completo -> los 5 campos", () => {
  const d = parseExtracted('{"name":"Juan Perez","phone":"787-555-1234","email":"juan@mail.com","address":"Calle 5 #10, Bayamon","product":"logo"}');
  expect(d.name).toBe("Juan Perez"); expect(d.email).toBe("juan@mail.com"); expect(d.product).toBe("logo");
  expect(d.phone).toBe("7875551234"); expect(d.address).toContain("Calle 5");
});

test("CD-02 email invalido -> se descarta", () => {
  const d = parseExtracted('{"email":"no-es-email"}');
  expect(d.email).toBeUndefined();
});

test("CD-03 telefono muy corto -> se descarta", () => {
  const d = parseExtracted('{"phone":"123"}');
  expect(d.phone).toBeUndefined();
});

test("CD-04 direccion muy corta -> se descarta", () => {
  const d = parseExtracted('{"address":"x"}');
  expect(d.address).toBeUndefined();
});

test("CD-05 basura / no-JSON -> {}", () => {
  expect(parseExtracted("no tengo datos")).toEqual({});
  expect(parseExtracted('{"phone":"787"}')).toEqual({});
});

test("CD-06 parcial -> solo lo dado", () => {
  const d = parseExtracted('{"name":"Ana"}');
  expect(d).toEqual({ name: "Ana" });
});
