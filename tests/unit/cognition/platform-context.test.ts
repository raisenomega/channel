/**
 * HUB by Raisen — Contexto de plataforma (B2 canales + B3 humanos): facts claros + vacio honesto.
 */
import { expect, test } from "vitest";
import { buildPlatformFacts } from "../../../src/cognition/domain/platform-context.ts";

test("PLAT-01 con canales y humanos -> facts claros", () => {
  const f = buildPlatformFacts({ channels: ["whatsapp", "instagram"], humanAgents: ["Ana (agent)"], catalog: ["Zafacon 55gal ($25, producto)"] });
  expect(f.some((x) => x.includes("Canales conectados: whatsapp, instagram"))).toBe(true);
  expect(f.some((x) => x.includes("Ana (agent)"))).toBe(true);
  expect(f.some((x) => x.includes("Zafacon 55gal"))).toBe(true);
});

test("PLAT-02 vacio -> honesto, nunca inventa", () => {
  const f = buildPlatformFacts({ channels: [], humanAgents: [], catalog: [] });
  expect(f.some((x) => x.includes("ninguno aun"))).toBe(true);
  expect(f.some((x) => x.includes("ninguno configurado aun"))).toBe(true);
  expect(f.some((x) => x.includes("Catalogo/SKU: vacio"))).toBe(true);
});
