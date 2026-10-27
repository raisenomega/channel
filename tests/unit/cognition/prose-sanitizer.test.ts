import { describe, it, expect } from "vitest";
import { sanitizarProsa } from "../../../src/cognition/domain/prose-sanitizer.ts";

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
