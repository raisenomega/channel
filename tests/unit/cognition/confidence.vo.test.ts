import { assertEquals, assert } from "jsr:@std/assert";
import { crearConfianza, decidirAccionPorConfianza } from "../../../src/cognition/domain/confidence.vo.ts";

Deno.test("crearConfianza — 0.9 debe ser actuar_sin_preguntar", () => {
  const r = crearConfianza(0.9);
  assert(r.ok);
  const accion = decidirAccionPorConfianza(0.9);
  assertEquals(accion.kind, "actuar_sin_preguntar");
});

Deno.test("crearConfianza — 0.7 debe ser actuar_con_confirmacion", () => {
  const accion = decidirAccionPorConfianza(0.7);
  assertEquals(accion.kind, "actuar_con_confirmacion");
});

Deno.test("crearConfianza — 0.3 debe ser sugerir_con_disclaimer", () => {
  const accion = decidirAccionPorConfianza(0.3);
  assertEquals(accion.kind, "sugerir_con_disclaimer");
});

Deno.test("crearConfianza — 0.0 debe ser escalar", () => {
  const accion = decidirAccionPorConfianza(0.0);
  assertEquals(accion.kind, "escalar");
});

Deno.test("crearConfianza — debe fallar con valor fuera de rango", () => {
  assert(!crearConfianza(1.5).ok);
  assert(!crearConfianza(-0.1).ok);
});