import { expect, test } from "vitest";
import { CANONICAL_PERSONAS, obtenerPersona } from "../../../src/cognition/domain/personas.index.ts";
import { PERSONA_VICTOR } from "../../../src/cognition/domain/personas/persona.victor.ts";
import { PERSONA_ZAHRA } from "../../../src/cognition/domain/personas/persona.zahra.ts";
import { PERSONA_THAO } from "../../../src/cognition/domain/personas/persona.thao.ts";
import { PERSONA_IRIS } from "../../../src/cognition/domain/personas/persona.iris.ts";
import { PERSONA_ECO } from "../../../src/cognition/domain/personas/persona.eco.ts";
import { PERSONA_ANGEL } from "../../../src/cognition/domain/personas/persona.angel.ts";
import { PERSONA_KELSY } from "../../../src/cognition/domain/personas/persona.kelsy.ts";

const ALL = [PERSONA_VICTOR, PERSONA_ZAHRA, PERSONA_THAO, PERSONA_IRIS, PERSONA_ECO, PERSONA_ANGEL, PERSONA_KELSY] as const;
const SLUGS = ["victor", "zahra", "thao", "iris", "eco", "angel", "kelsy"];

test("1: 7 personas en CANONICAL_PERSONAS", () => {
  expect(Object.keys(CANONICAL_PERSONAS).length).toBe(7);
});

test("2: cada persona tiene slug en CANONICAL_PERSONAS", () => {
  for (const slug of SLUGS) {
    expect(CANONICAL_PERSONAS[slug as keyof typeof CANONICAL_PERSONAS].slug).toBe(slug);
  }
});

test("3: mutar una persona da TypeError frozen", () => {
  expect(() => { (PERSONA_VICTOR as Record<string, unknown>).rol = "mutado"; }).toThrow();
});

test("4: mutar principios_literales da TypeError frozen", () => {
  expect(() => { (PERSONA_VICTOR.principios_literales as Record<string, string>).P1_VERDAD_BRUTAL = "mutado"; }).toThrow();
});

test("5: todas tienen version=1 y tier en {opus,sonnet,haiku}", () => {
  const TIERS = ["opus", "sonnet", "haiku"];
  for (const p of ALL) {
    expect(p.version).toBe(1);
    expect(TIERS).toContain(p.tier_modelo);
  }
});

test("6: todas tienen principios_literales con P1-P8", () => {
  const KEYS = ["P1_VERDAD_BRUTAL", "P2_REPUTACION_CLIENTE_FINAL", "P3_CONVICCION_MINIMA",
    "P4_ANTI_IMPULSIVIDAD", "P5_APRENDIZAJE_HONESTO", "P6_SOBERANIA_TENANT",
    "P7_META_COMPLIANCE", "P8_RITMO_HUMANO"];
  for (const p of ALL) {
    for (const k of KEYS) {
      expect(p.principios_literales[k as keyof typeof p.principios_literales]).toBeDefined();
    }
  }
});

test("7: obtenerPersona con slug válido devuelve persona", () => {
  const v = obtenerPersona("victor");
  expect(v.slug).toBe("victor");
});

test("8: cada persona tiene systemPrompt que menciona su nombre", () => {
  for (const p of ALL) {
    expect(p.systemPrompt).toContain(p.nombre_display);
  }
});

test("9: cada persona (excepto Victor) menciona 'Victor es tu CEO' en systemPrompt", () => {
  for (const p of ALL) {
    if (p.slug === "victor") continue;
    expect(p.systemPrompt).toContain("Victor es tu CEO");
  }
});

test("10: Victor no cita 'Victor es tu CEO' en su systemPrompt", () => {
  expect(PERSONA_VICTOR.systemPrompt).not.toContain("Victor es tu CEO");
});

test("11: Angel tiene alcance prohibido que incluye 'NUNCA envía mensaje final'", () => {
  expect(PERSONA_ANGEL.alcance_prohibido_especifico.some((a) => a.includes("NUNCA envía mensaje final"))).toBe(true);
});

test("12: Victor no cotiza por su cuenta (eso lo pasa a Zahra)", () => {
  expect(PERSONA_VICTOR.alcance_prohibido_especifico.some((a) => a.includes("No cotiza por su cuenta"))).toBe(true);
});

test("13: Victor y Angel son tier opus; los demás son sonnet", () => {
  expect(PERSONA_VICTOR.tier_modelo).toBe("opus");
  expect(PERSONA_ANGEL.tier_modelo).toBe("opus");
  expect(PERSONA_ZAHRA.tier_modelo).toBe("sonnet");
  expect(PERSONA_THAO.tier_modelo).toBe("sonnet");
  expect(PERSONA_IRIS.tier_modelo).toBe("sonnet");
  expect(PERSONA_ECO.tier_modelo).toBe("sonnet");
  expect(PERSONA_KELSY.tier_modelo).toBe("sonnet");
});

test("14: todas tienen habilidades no vacías", () => {
  for (const p of ALL) {
    expect(p.habilidades.length).toBeGreaterThan(0);
  }
});

test("15: todas tienen alcance_prohibido_especifico no vacío", () => {
  for (const p of ALL) {
    expect(p.alcance_prohibido_especifico.length).toBeGreaterThan(0);
  }
});

test("16: nombres_display únicos", () => {
  const names = ALL.map((p) => p.nombre_display);
  expect(new Set(names).size).toBe(7);
});