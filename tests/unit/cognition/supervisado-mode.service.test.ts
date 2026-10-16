import { expect, test } from "vitest";
import { debeSupervisar, marcarSupervisado, esSupervisado } from "../../../src/cognition/application/supervisado-mode.service.ts";

test("A-05 SUPERVISAR_ANGEL_SIEMPRE: angel confidence 1.0 -> true (regla sagrada P4)", () => {
  expect(debeSupervisar({ personaSlug: "angel", confidence: 1.0, accion: null }, true)).toBe(true);
});

test("A-06 SUPERVISAR_ACCION_PROHIBIDA: accion prohibida -> true", () => {
  expect(debeSupervisar({ personaSlug: "zahra", confidence: 1.0, accion: "cobrar_sin_confirmacion" }, true)).toBe(true);
});

test("A-07 SUPERVISAR_P3_CONFIDENCE: confidence 0.2 (< 0.7) -> true", () => {
  expect(debeSupervisar({ personaSlug: "zahra", confidence: 0.2, accion: null }, true)).toBe(true);
});

test("A-08 SUPERVISAR_HIGH_CONFIDENCE: confianza alta, no angel -> false", () => {
  expect(debeSupervisar({ personaSlug: "zahra", confidence: 0.9, accion: null }, true)).toBe(false);
});

test("requiereAprobacion=false -> false siempre", () => {
  expect(debeSupervisar({ personaSlug: "angel", confidence: 0.1, accion: null }, false)).toBe(false);
});

test("A-15 R19_PATRON_OMEGA: las 3 funciones del shape OMEGA existen", () => {
  expect(typeof debeSupervisar).toBe("function");
  expect(typeof marcarSupervisado).toBe("function");
  expect(typeof esSupervisado).toBe("function");
});

test("marcarSupervisado agrega flag al metadata", () => {
  const m = marcarSupervisado({});
  expect(m.supervisado).toBe(true);
});

test("esSupervisado detecta flag", () => {
  expect(esSupervisado({ supervisado: true, otro: 1 })).toBe(true);
  expect(esSupervisado({ otro: 1 })).toBe(false);
  expect(esSupervisado(undefined)).toBe(false);
});

test("marcarSupervisado retorna Object.freeze", () => {
  expect(Object.isFrozen(marcarSupervisado({}))).toBe(true);
});