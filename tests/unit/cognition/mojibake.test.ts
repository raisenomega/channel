/**
 * HUB by Raisen — M6: repara doble-codificacion UTF-8 en datos capturados (direccion/nombre/etc).
 */
import { expect, test } from "vitest";
import { fixMojibake } from "../../../src/cognition/domain/contact-data.ts";

test("MJ-01 repara nombre doble-codificado (JosÃ© -> José)", () => {
  expect(fixMojibake("JosÃ©")).toBe("José");
});
test("MJ-02 repara direccion (orquÃ­dea -> orquídea)", () => {
  expect(fixMojibake("calle orquÃ­dea #50")).toBe("calle orquídea #50");
});
test("MJ-03 texto limpio no se toca", () => {
  expect(fixMojibake("calle orquidea #50")).toBe("calle orquidea #50");
});
test("MJ-04 acentos correctos no se rompen (instalación)", () => {
  expect(fixMojibake("instalación")).toBe("instalación");
});
