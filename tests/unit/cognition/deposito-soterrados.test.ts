/**
 * HUB by Raisen — E: deposito determinista de zafacones soterrados instalados. Money -> cobertura dura.
 */
import { expect, test } from "vitest";
import { calcularDeposito } from "../../../src/cognition/domain/deposito-soterrados.ts";

const sot = (q: number) => ({ description: "Zafacones Soterrados e instalados", quantity: q, line_total: 530 * q });

test("E-01 1 soterrado instalado ($530) -> $100 a ATH Movil /zramos", () => {
  const d = calcularDeposito([sot(1)]);
  expect(d).toEqual({ monto: 100, destino: "ATH Movil Business /zramos" });
});

test("E-02 reemplazo (1 unidad del item de instalacion) -> $100", () => {
  expect(calcularDeposito([{ description: "Zafacones Soterrados e instalados", quantity: 1, line_total: 530 }])?.monto).toBe(100);
});

test("E-03 2 soterrados -> $250 (2 o mas)", () => {
  expect(calcularDeposito([sot(2)])?.monto).toBe(250);
});

test("E-04 3 soterrados ($1590, <=1800) -> $250", () => {
  expect(calcularDeposito([sot(3)])?.monto).toBe(250);
});

test("E-05 4 soterrados ($2120 > 1800) -> $500 (gana el tramo mas alto)", () => {
  expect(calcularDeposito([sot(4)])?.monto).toBe(500);
});

test("E-06 SOLO limpieza de soterrados -> SIN deposito (no es venta/instalacion)", () => {
  expect(calcularDeposito([{ description: "Limpieza zafcones soterrados", quantity: 3, line_total: 165 }])).toBeNull();
});

test("E-07 mezcla: 1 instalacion + limpieza -> cuenta solo la instalacion -> $100", () => {
  const d = calcularDeposito([sot(1), { description: "Limpieza zafcones soterrados", quantity: 2, line_total: 110 }]);
  expect(d?.monto).toBe(100);
});

test("E-08 sin soterrados (otros productos) -> SIN deposito", () => {
  expect(calcularDeposito([{ description: "Tapas premium", quantity: 5, line_total: 425 }])).toBeNull();
});
