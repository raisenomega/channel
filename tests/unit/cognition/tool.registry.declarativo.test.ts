import { expect, test } from "vitest";
import { CORE_TOOL_SPECS } from "../../../src/cognition/domain/tool.registry.core.ts";

test("T1: 10 tools en CORE_TOOL_SPECS", () => {
  expect(CORE_TOOL_SPECS.length).toBe(10);
});

test("T2: todos tienen nombre, dominio, accion, requiere_puerta_pago, es_mutador, min_tier_permitido", () => {
  for (const t of CORE_TOOL_SPECS) {
    expect(typeof t.nombre).toBe("string");
    expect(typeof t.dominio).toBe("string");
    expect(typeof t.accion).toBe("string");
    expect(t.requiere_puerta_pago === null || t.requiere_puerta_pago === "nucleo" || t.requiere_puerta_pago === "omega").toBe(true);
    expect(typeof t.es_mutador).toBe("boolean");
    expect(typeof t.min_tier_permitido).toBe("string");
  }
});

test("T3: CORE_TOOL_SPECS array es frozen", () => {
  expect(Object.isFrozen(CORE_TOOL_SPECS)).toBe(true);
});

test("T4: tools sin puerta_pago (null) tienen min_tier_permitido esencial", () => {
  const locales = CORE_TOOL_SPECS.filter((t) => t.requiere_puerta_pago === null);
  for (const t of locales) {
    expect(["esencial", "pro"]).toContain(t.min_tier_permitido);
  }
});

test("T5: el registro es ReadonlyArray (frozen)", () => {
  expect(Object.isFrozen(CORE_TOOL_SPECS)).toBe(true);
});