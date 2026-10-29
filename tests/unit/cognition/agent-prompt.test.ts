/**
 * HUB by Raisen — Fase 2: el prompt del agente fija GROUNDING (no inventar) + PROPOSITO de venta
 * (cerrar con razonamiento, no impulsivo) + la regla de los 4 datos.
 */
import { expect, test } from "vitest";
import { construirPromptEstatico } from "../../../src/cognition/application/agent-prompt.ts";
import type { AgentContext } from "../../../src/cognition/application/agent-context.ts";

const ctx = { knowledge: [], history: [], brandVoice: "VOZ", catalogContext: "CAT" } as unknown as AgentContext;

test("PROMPT-01 grounding: prohibe inventar contactos/montos/horarios/acciones", () => {
  const p = construirPromptEstatico("whatsapp", ctx);
  expect(p).toContain("GROUNDING");
  expect(p.toLowerCase()).toContain("nunca inventes");
});

test("PROMPT-02 proposito de venta: cerrar con razonamiento NO impulsivo + subir ventas", () => {
  const p = construirPromptEstatico("whatsapp", ctx);
  expect(p).toContain("PROPOSITO");
  expect(p).toContain("cerrar la venta");
  expect(p.toLowerCase()).toContain("no impulsivo");
  expect(p.toLowerCase()).toContain("subir las ventas");
});

test("PROMPT-03 los 4 datos: con nombre+telefono+direccion+email -> avanza a cerrar; si faltan, pide amable", () => {
  const p = construirPromptEstatico("whatsapp", ctx);
  expect(p).toContain("4 datos");
  expect(p.toLowerCase()).toContain("avanza");
  expect(p.toLowerCase()).toContain("amablemente");
});
