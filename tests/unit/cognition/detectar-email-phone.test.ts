/**
 * HUB by Raisen — safety-net deterministico: saca los 4 datos (nombre/telefono/email/direccion) del texto que
 * dio el CLIENTE, este donde este, sin depender del LLM. Casos reales: IG (email con espacios) y FB (Martin's BBQ).
 */
import { expect, test } from "vitest";
import { detectarDatos } from "../../../src/cognition/domain/contact-data.ts";

test("DEP-01 email con espacios (caso IG) -> normalizado", () => {
  expect(detectarDatos("No se reemplaza es otra cotizacion\n\nJohanny . 121894@gmail.com").email).toBe("Johanny.121894@gmail.com");
});
test("DEP-02 email estandar en texto", () => {
  expect(detectarDatos("mi correo es juan.perez@mail.com gracias").email).toBe("juan.perez@mail.com");
});
test("DEP-03 telefono en texto", () => {
  expect(detectarDatos("llamame al 787-513-2524").phone).toBe("7875132524");
});
test("DEP-04 sin datos -> vacio", () => {
  const r = detectarDatos("hola quiero una cotizacion");
  expect(r.email).toBeUndefined(); expect(r.address).toBeUndefined(); expect(r.name).toBeUndefined();
});
test("DEP-05 direccion con 'centro comercial' (caso FB Martin's BBQ) -> se extrae", () => {
  const r = detectarDatos("me llamo carlos rivera mi negocio es martin's BBQ esta en centro comercial Forest Hills Ave. 167 bayamon PR 00961 mi telefono es 787 251 2323 mi email es pollorico@gmail.com");
  expect(r.address).toContain("centro comercial Forest Hills");
  expect(r.address).toContain("167");
  expect(r.address).not.toContain("telefono"); // corta antes del proximo campo
  expect(r.phone).toBe("7872512323");
  expect(r.email).toBe("pollorico@gmail.com");
  expect(r.name).toBe("carlos rivera"); // "me llamo X", sin arrastrar "mi negocio..."
});
test("DEP-06 direccion tipo 'calle' en medio del hilo ruidoso", () => {
  const r = detectarDatos("buenas\nok perfecto\nqueda en calle Marginal 23 Urb Los Robles Gurabo\ngracias");
  expect(r.address).toContain("calle Marginal 23");
});
test("DEP-07 nombre con 'mi nombre es'", () => {
  expect(detectarDatos("hola, mi nombre es Ana Lopez y necesito 3 zafacones").name).toBe("Ana Lopez");
});
