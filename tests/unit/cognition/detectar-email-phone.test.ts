/**
 * HUB by Raisen — safety-net deterministico: rescata email/telefono del hilo aunque el cliente los escriba
 * con espacios (caso IG: "Johanny . 121894@gmail.com"). No depende del LLM.
 */
import { expect, test } from "vitest";
import { detectarEmailPhone } from "../../../src/cognition/domain/contact-data.ts";

test("DEP-01 email con espacios (caso IG) -> normalizado", () => {
  const r = detectarEmailPhone("No se reemplaza es otra cotizacion\n\nJohanny . 121894@gmail.com");
  expect(r.email).toBe("Johanny.121894@gmail.com");
});
test("DEP-02 email estandar en texto", () => {
  expect(detectarEmailPhone("mi correo es juan.perez@mail.com gracias").email).toBe("juan.perez@mail.com");
});
test("DEP-03 telefono en texto", () => {
  expect(detectarEmailPhone("llamame al 787-513-2524").phone).toBe("7875132524");
});
test("DEP-04 sin email ni telefono -> vacio", () => {
  const r = detectarEmailPhone("hola quiero una cotizacion");
  expect(r.email).toBeUndefined();
});
