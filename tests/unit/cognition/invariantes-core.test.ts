import { expect, test } from "vitest";
import { PERSONA_VICTOR } from "../../../src/cognition/domain/personas/persona.victor.ts";
import { LIMITS, ACCIONES_PROHIBIDAS } from "../../../src/cognition/domain/limits.ts";
import { ROUTING, DEGRADATION_CHAIN } from "../../../src/cognition/domain/routing-table.ts";
import { EthicsGuard } from "../../../src/cognition/domain/ethics.guard.ts";
import { DecideResponseHandler } from "../../../src/cognition/application/decide-response.handler.ts";

test("I5: persona.systemPrompt es inmutable", () => {
  const original = PERSONA_VICTOR.systemPrompt;
  try { (PERSONA_VICTOR as { systemPrompt: string }).systemPrompt = "hacked"; } catch { /* frozen */ }
  expect(PERSONA_VICTOR.systemPrompt).toBe(original);
});

test("G1: ACCIONES_PROHIBIDAS frozen y tipada ReadonlySet", () => {
  expect(Object.isFrozen(ACCIONES_PROHIBIDAS)).toBe(true);
  // La inmutabilidad en runtime de Set via Object.freeze no bloquea add en V8;
  // la proteccion real la da el tipo ReadonlySet en compilacion.
  expect(ACCIONES_PROHIBIDAS.has("borrar_dato_cliente")).toBe(true);
  expect(ACCIONES_PROHIBIDAS.has("cobrar_sin_confirmacion")).toBe(true);
});

test("I9: confidence=6 (0-10) -> hold_for_human_review", async () => {
  const handler = new DecideResponseHandler();
  const result = await handler.ejecutar({
    tenantId: "t" as never, conversationId: "c" as never, contactId: "k" as never,
    message: "Hola", channel: "whatsapp", confidence: 0.6,
    autonomyConfig: { channel: null, scheduleStart: null, scheduleEnd: null, allowedActions: [], requiresHumanApproval: [], isActive: true },
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.kind).toBe("hold_for_human_review");
});

test("I9: confidence >= 7 (0-10) -> no hold", async () => {
  const handler = new DecideResponseHandler();
  const result = await handler.ejecutar({
    tenantId: "t" as never, conversationId: "c" as never, contactId: "k" as never,
    message: "Hola", channel: "whatsapp", confidence: 0.7,
    autonomyConfig: { channel: null, scheduleStart: null, scheduleEnd: null, allowedActions: [], requiresHumanApproval: [], isActive: true },
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value.kind).not.toBe("hold_for_human_review");
});

test("X5: EthicsGuard.evaluarAccion bloquea accion prohibida", () => {
  const r = EthicsGuard.evaluarAccion("borrar_dato_cliente");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("accion_prohibida");
});

test("X5: EthicsGuard.evaluarAccion permite accion no prohibida", () => {
  const r = EthicsGuard.evaluarAccion("enviar_cotizacion");
  expect(r.ok).toBe(true);
});

test("I2: ROUTING usa tiers sin versiones fijas", () => {
  const tasks = Object.values(ROUTING);
  for (const t of tasks) expect(t).toMatch(/^(haiku|sonnet|opus)$/);
});

test("I2: DEGRADATION_CHAIN correcta", () => {
  expect(DEGRADATION_CHAIN.opus).toEqual(["opus", "sonnet", "haiku"]);
  expect(DEGRADATION_CHAIN.sonnet).toEqual(["sonnet", "haiku"]);
  expect(DEGRADATION_CHAIN.haiku).toEqual(["haiku"]);
});

test("LIMITS congelado", () => {
  expect(Object.isFrozen(LIMITS)).toBe(true);
  expect(LIMITS.MIN_CONFIDENCE_TO_ACT).toBe(7);
});