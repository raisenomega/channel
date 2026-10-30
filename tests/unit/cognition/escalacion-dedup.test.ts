/**
 * HUB by Raisen — PR1 anti-rafaga: la heuristica de "mismo tema" agrupa las re-escaladas reales de un
 * caso (Roy inventario, Jenny cotizacion) pero NO fusiona temas distintos del mismo cliente.
 */
import { expect, test } from "vitest";
import { mismoTema, temaSignature } from "../../../src/cognition/infrastructure/escalacion-dedup.query.ts";

test("DEDUP-01 agrupa re-escaladas del MISMO tema (Roy / inventario)", () => {
  const a = "Roy pide descontar producto/servicio del inventario en todos; falta confirmar producto, cantidad y registro con Johanny Lopez";
  const b = "Roy Ramos solicita descontar producto del inventario en todos; falta confirmar producto, cantidad y registro con Johanny Lopez";
  expect(mismoTema(a, b)).toBe(true);
});

test("DEDUP-02 agrupa re-escaladas del MISMO tema (Jenny / cotizacion zafacones)", () => {
  const a = "Revisar precio de cotizacion para 2 zafacones soterrados llenos de agua (Jenny Torres, Guayama)";
  const b = "Cotizacion de Jenny Torres (2 zafacones soterrados llenos de agua, Guayama). Validar cargo por agua antes de enviar";
  expect(mismoTema(a, b)).toBe(true);
});

test("DEDUP-03 NO fusiona temas DISTINTOS del mismo cliente", () => {
  const visita = "Roy indica que manana iran a reemplazar un zafacon y pide confirmacion de la visita";
  const rrhh = "Roy decidio proceder con la contratacion del candidato de Trujillo Alto; seguimiento de Johanny Lopez";
  const acceso = "Roy Ramos no puede entrar a la plataforma HUB Inventario; acceso bloqueado, revisar permisos";
  expect(mismoTema(visita, rrhh)).toBe(false);
  expect(mismoTema(visita, acceso)).toBe(false);
  expect(mismoTema(rrhh, acceso)).toBe(false);
});

test("DEDUP-04 texto muy corto no arriesga merge", () => {
  expect(mismoTema("Te aviso", "Te aviso")).toBe(false);
  expect(temaSignature("[Audio]").size).toBeLessThan(2);
});
