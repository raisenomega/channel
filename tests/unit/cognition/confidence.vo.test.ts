import { expect, test } from "vitest";
import { crearConfianza, decidirAccionPorConfianza } from "../../../src/cognition/domain/confidence.vo.ts";

test("crearConfianza â€” 0.9 debe ser actuar_sin_preguntar", () => {
  const r = crearConfianza(0.9);
  expect(r.ok).toBe(true);
  const accion = decidirAccionPorConfianza(0.9);
  expect(accion.kind).toBe("actuar_sin_preguntar");
});

test("crearConfianza â€” 0.7 debe ser actuar_con_confirmacion", () => {
  const accion = decidirAccionPorConfianza(0.7);
  expect(accion.kind).toBe("actuar_con_confirmacion");
});

test("crearConfianza â€” 0.3 debe ser sugerir_con_disclaimer", () => {
  const accion = decidirAccionPorConfianza(0.3);
  expect(accion.kind).toBe("sugerir_con_disclaimer");
});

test("crearConfianza â€” 0.0 debe ser escalar", () => {
  const accion = decidirAccionPorConfianza(0.0);
  expect(accion.kind).toBe("escalar");
});

test("crearConfianza â€” debe fallar con valor fuera de rango", () => {
  expect(!crearConfianza(1.5).ok).toBe(true);
  expect(!crearConfianza(-0.1).ok).toBe(true);
});
