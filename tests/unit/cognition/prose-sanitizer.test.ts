import { describe, it, expect } from "vitest";
import { sanitizarProsa, detectarEscalacion, detectarMarcador } from "../../../src/cognition/domain/prose-sanitizer.ts";

describe("sanitizarProsa (guard de prosa interna hacia el cliente)", () => {
  it("elimina la NOTA INTERNA final y conserva la respuesta al cliente", () => {
    const inp =
      "Con gusto le ayudo.\n\n--- *Nota interna: Llamar a `escalar_a_humano` con el motivo " +
      "'el precio de instalacion soterrada no esta definido en el catalogo y requiere aprobacion humana'. " +
      "No se debe crear la cotizacion ni mencionar precios hasta recibir confirmacion.*";
    const out = sanitizarProsa(inp);
    expect(out).toBe("Con gusto le ayudo.");
    expect(out.toLowerCase()).not.toContain("nota interna");
    expect(out).not.toContain("escalar_a_humano");
  });

  it("borra una frase suelta con token interno pero deja el resto", () => {
    const out = sanitizarProsa("Gracias por escribir. Debo escalar_a_humano ahora. Aqui estamos.");
    expect(out).not.toContain("escalar_a_humano");
    expect(out).toContain("Gracias por escribir.");
    expect(out).toContain("Aqui estamos.");
  });

  it("sigue limpiando tags de tool", () => {
    expect(sanitizarProsa("Hola<invoke>x</invoke> mundo")).toBe("Hola mundo");
  });

  it("no altera una respuesta normal del agente", () => {
    const ok = "Nuestro horario es de 9 a 5. Con gusto le preparo la cotizacion.";
    expect(sanitizarProsa(ok)).toBe(ok);
  });
});

describe("detectarEscalacion (flag para alertar al dueno)", () => {
  it("detecta nota interna / escalar_a_humano / aprobacion humana en la salida cruda", () => {
    expect(detectarEscalacion("Con gusto.\n\n--- Nota interna: escalar_a_humano por precio no definido")).toBe(true);
    expect(detectarEscalacion("Debo pedir aprobacion humana antes de cotizar.")).toBe(true);
  });
  it("detecta la escalacion en LENGUAJE NATURAL del agente (no solo tokens internos)", () => {
    expect(detectarEscalacion("Voy a escalar su caso a nuestra supervisora para que lo revise.")).toBe(true);
    expect(detectarEscalacion("Ya dejé registrada su solicitud para que nuestra supervisora revise.")).toBe(true);
    expect(detectarEscalacion("Paso su consulta a una persona de nuestro equipo.")).toBe(true);
  });
  it("NO marca una respuesta normal del agente (ni el flujo de cotizacion)", () => {
    expect(detectarEscalacion("Nuestro horario es de 9 a 5. Con gusto le ayudo.")).toBe(false);
    expect(detectarEscalacion("Nuestro equipo preparara tu cotizacion de 3 zafacones.")).toBe(false);
    expect(detectarEscalacion("Para preparar tu cotizacion necesito tu nombre completo.")).toBe(false);
  });
});

describe("detectarMarcador + saneo del marcador explicito", () => {
  it("parsea [[ESCALAR: ...]] y [[CONSULTA: ...]] con su motivo", () => {
    expect(detectarMarcador("Un momento. [[ESCALAR: el cliente pide humano]]")).toEqual({ tipo: "escalar", motivo: "el cliente pide humano" });
    expect(detectarMarcador("Reviso. [[CONSULTA: precio de soterrado]]")).toEqual({ tipo: "consulta", motivo: "precio de soterrado" });
  });
  it("respaldo: frase natural de escalada -> escalar", () => {
    expect(detectarMarcador("Voy a escalar su caso a la supervisora.")).toEqual({ tipo: "escalar", motivo: "" });
  });
  it("respuesta normal -> tipo null", () => {
    expect(detectarMarcador("Con gusto le ayudo con su cotizacion.")).toEqual({ tipo: null, motivo: "" });
  });
  it("el saneador BORRA el marcador del texto al cliente", () => {
    expect(sanitizarProsa("Claro, un momento. [[CONSULTA: precio soterrado]]")).toBe("Claro, un momento.");
  });
});
