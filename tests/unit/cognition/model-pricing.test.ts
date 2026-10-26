/**
 * HUB by Raisen — costo real por request: tabla de precios + descuento de cache + parseo del usage.
 */
import { expect, test } from "vitest";
import { calcularCostoUsd, usageDesde } from "../../../src/cognition/domain/model-pricing.ts";

const M = 1_000_000;

test("P-01 haiku: 1M in + 1M out = 1 + 5 = $6", () => {
  expect(calcularCostoUsd("claude-haiku-4-5", M, M, 0, 0)).toBe(6);
});

test("P-02 sonnet: 1M in = $3", () => {
  expect(calcularCostoUsd("claude-sonnet-4-5", M, 0, 0, 0)).toBe(3);
});

test("P-03 cache read = 0.1x input (el ahorro real): 1M cacheRead sonnet = $0.30", () => {
  expect(calcularCostoUsd("claude-sonnet-4-5", 0, 0, M, 0)).toBeCloseTo(0.3, 6);
});

test("P-04 cache creation = 1.25x input: 1M cacheCreation sonnet = $3.75", () => {
  expect(calcularCostoUsd("claude-sonnet-4-5", 0, 0, 0, M)).toBeCloseTo(3.75, 6);
});

test("P-05 haiku es mas barato que sonnet para el mismo uso", () => {
  const h = calcularCostoUsd("claude-haiku-4-5", M, M, 0, 0);
  const s = calcularCostoUsd("claude-sonnet-4-5", M, M, 0, 0);
  expect(h).toBeLessThan(s);
});

test("P-06 usageDesde parsea el usage de Anthropic (incl. cache_read) y calcula costo", () => {
  const u = usageDesde({ input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 2000 }, "claude-sonnet-4-5");
  expect(u.tokensInput).toBe(1000);
  expect(u.cacheRead).toBe(2000);
  expect(u.costUsd).toBeGreaterThan(0);
});

test("P-07 usage vacio = 0 (honesto, sin crash)", () => {
  const u = usageDesde(undefined, "claude-sonnet-4-5");
  expect(u.tokensInput).toBe(0);
  expect(u.costUsd).toBe(0);
});
