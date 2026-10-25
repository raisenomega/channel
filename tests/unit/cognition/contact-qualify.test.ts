/**
 * HUB by Raisen — CRM auto-calificacion: la escalera solo sube (General->Nuevo->Regular->VIP).
 */
import { expect, test } from "vitest";
import { calificarSegmento, calificarTemperatura } from "../../../src/cognition/domain/contact-qualify.ts";

test("Q-01 General + intencion -> sube a Nuevo (prospect)", () => {
  expect(calificarSegmento("general", { opportunity: true, totalOrders: 0 })).toBe("nuevo");
});
test("Q-02 compro -> Regular (customer)", () => {
  expect(calificarSegmento("general", { opportunity: false, totalOrders: 1 })).toBe("regular");
});
test("Q-03 alto volumen -> VIP", () => {
  expect(calificarSegmento("regular", { opportunity: false, totalOrders: 5 })).toBe("vip");
});
test("Q-04 ya VIP -> no baja ni cambia (null)", () => {
  expect(calificarSegmento("vip", { opportunity: true, totalOrders: 0 })).toBeNull();
});
test("Q-05 sin senales nuevas -> no cambia", () => {
  expect(calificarSegmento("nuevo", { opportunity: true, totalOrders: 0 })).toBeNull();
});

test("T-01 interaccion entrante -> tibio", () => {
  expect(calificarTemperatura("frio", { opportunity: false, totalOrders: 0 })).toBe("tibio");
});
test("T-02 intencion de compra -> caliente", () => {
  expect(calificarTemperatura("tibio", { opportunity: true, totalOrders: 0 })).toBe("caliente");
});
test("T-03 ya compro -> convertido", () => {
  expect(calificarTemperatura("caliente", { opportunity: false, totalOrders: 2 })).toBe("convertido");
});
test("T-04 ya convertido -> no baja (null)", () => {
  expect(calificarTemperatura("convertido", { opportunity: true, totalOrders: 0 })).toBeNull();
});
test("T-05 sin temp previa + intencion -> caliente (no baja de tibio base)", () => {
  expect(calificarTemperatura(null, { opportunity: true, totalOrders: 0 })).toBe("caliente");
});
