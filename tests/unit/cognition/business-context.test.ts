/**
 * HUB by Raisen — Contexto del negocio: completitud (verde > 70%) + buildFacts (omite vacios).
 */
import { expect, test } from "vitest";
import { completeness, buildFacts, type BusinessContext } from "../../../src/cognition/domain/business-context.ts";

test("CTX-01 contexto vacio -> 0%, no verde", () => {
  const r = completeness({});
  expect(r.filled).toBe(0);
  expect(r.percent).toBe(0);
  expect(r.green).toBe(false);
});

test("CTX-02 verde SOLO cuando > 70% (10/14 = 71% verde; 9/14 = 64% gris)", () => {
  const base: BusinessContext = {
    businessWhat: "x", industry: "retail", brandServices: "y", targetAudience: "z", differentiator: "d",
    brandTone: "formal", brandMission: "m", policies: "p", mainGoal: "g", competitors: "c",
  };
  expect(completeness(base).filled).toBe(10);
  expect(completeness(base).green).toBe(true);
  const nueve = { ...base, competitors: undefined };
  expect(completeness(nueve).filled).toBe(9);
  expect(completeness(nueve).green).toBe(false);
});

test("CTX-03 buildFacts arma lenguaje natural y omite vacios/espacios", () => {
  const f = buildFacts({ industry: "retail", customInstructions: "   ", businessWhat: "vende zafacones" });
  expect(f.some((x) => x.includes("vende zafacones"))).toBe(true);
  expect(f.some((x) => x.includes("Industria: retail"))).toBe(true);
  expect(f.some((x) => x.toLowerCase().includes("instrucciones"))).toBe(false);
});
