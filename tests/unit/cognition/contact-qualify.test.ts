/**
 * HUB by Raisen — CRM auto-calificacion: la escalera solo sube (General->Nuevo->Regular->VIP).
 */
import { expect, test } from "vitest";
import { calificarSegmento } from "../../../src/cognition/domain/contact-qualify.ts";

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
