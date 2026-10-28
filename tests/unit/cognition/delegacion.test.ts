/**
 * HUB by Raisen — Marcador de delegacion de Victor: parseo determinista + limpieza del texto visible.
 */
import { expect, test } from "vitest";
import { detectarDelegaciones, limpiarDelegacion } from "../../../src/cognition/domain/delegacion.ts";

test("detecta multiples delegaciones y normaliza el slug a minuscula", () => {
  const txt = "Listo jefe. [[DELEGAR: agente=ECO; tarea=encuesta de satisfaccion]] y [[DELEGAR: agente=thao; tarea=seguimiento post-venta]]";
  const d = detectarDelegaciones(txt);
  expect(d.length).toBe(2);
  expect(d[0]).toEqual({ agente: "eco", tarea: "encuesta de satisfaccion" });
  expect(d[1]).toEqual({ agente: "thao", tarea: "seguimiento post-venta" });
});

test("sin marcador -> lista vacia", () => {
  expect(detectarDelegaciones("Hola, todo bien.").length).toBe(0);
});

test("limpia los marcadores del texto que ve el dueno", () => {
  const out = limpiarDelegacion("Delego esto [[DELEGAR: agente=eco; tarea=x]] y te reporto.");
  expect(out.includes("DELEGAR")).toBe(false);
  expect(out.startsWith("Delego esto")).toBe(true);
  expect(out.endsWith("te reporto.")).toBe(true);
});
