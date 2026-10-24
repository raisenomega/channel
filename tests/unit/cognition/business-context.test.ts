/**
 * HUB by Raisen — Contexto del negocio: completitud (verde > 70%, 23 preguntas) + buildFacts (omite vacios).
 */
import { expect, test } from "vitest";
import { completeness, CONTEXT_KEYS, type BusinessContext } from "../../../src/cognition/domain/business-context.ts";
import { buildFacts } from "../../../src/cognition/domain/business-facts.ts";

function fillN(n: number): BusinessContext {
  const c: Record<string, string> = {};
  const strKeys = CONTEXT_KEYS.filter((k) => k !== "hasProducts");
  for (let i = 0; i < n; i++) { const k = strKeys[i]; if (k) c[k] = "x"; }
  return c as BusinessContext;
}

test("CTX-01 contexto vacio -> 0%, no verde, total 23", () => {
  const r = completeness({});
  expect(r.filled).toBe(0);
  expect(r.percent).toBe(0);
  expect(r.green).toBe(false);
  expect(r.total).toBe(23);
});

test("CTX-02 verde SOLO > 70% (17/23 = 74% verde; 16/23 = 70% gris)", () => {
  expect(completeness(fillN(17)).green).toBe(true);
  expect(completeness(fillN(16)).green).toBe(false);
});

test("CTX-03 buildFacts arma lenguaje natural y omite vacios/espacios", () => {
  const f = buildFacts({ industry: "retail", customInstructions: "   ", businessWhat: "vende zafacones", escalationTriggers: "quejas publicas" });
  expect(f.some((x) => x.includes("vende zafacones"))).toBe(true);
  expect(f.some((x) => x.includes("Industria: retail"))).toBe(true);
  expect(f.some((x) => x.includes("Escalar directo al humano: quejas publicas"))).toBe(true);
  expect(f.some((x) => x.toLowerCase().includes("instrucciones"))).toBe(false);
});
