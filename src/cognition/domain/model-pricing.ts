/**
 * HUB by Raisen — Precios aprox de Anthropic (USD por 1M tokens) + costo REAL por request.
 * cacheRead = 0.1x input (lectura de cache, el ahorro); cacheCreation = 1.25x input (escritura). C4 <=75.
 */
const PRICE = Object.freeze({
  haiku: { inp: 1, out: 5 },
  sonnet: { inp: 3, out: 15 },
  opus: { inp: 15, out: 75 },
});

function familia(model: string): keyof typeof PRICE {
  if (model.includes("haiku")) return "haiku";
  if (model.includes("opus")) return "opus";
  return "sonnet";
}

export function calcularCostoUsd(model: string, tokensInput: number, tokensOutput: number, cacheRead: number, cacheCreation: number): number {
  const p = PRICE[familia(model)];
  const micro = tokensInput * p.inp + tokensOutput * p.out + cacheRead * p.inp * 0.1 + cacheCreation * p.inp * 1.25;
  return Math.round((micro / 1_000_000) * 1e6) / 1e6; // 6 decimales
}

export interface UsageBreakdown {
  readonly tokensInput: number;
  readonly tokensOutput: number;
  readonly cacheRead: number;
  readonly cacheCreation: number;
  readonly costUsd: number;
}

export function usageDesde(usage: Record<string, number> | undefined, model: string): UsageBreakdown {
  const u = usage ?? {};
  const tokensInput = u.input_tokens ?? 0;
  const tokensOutput = u.output_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheCreation = u.cache_creation_input_tokens ?? 0;
  return Object.freeze({ tokensInput, tokensOutput, cacheRead, cacheCreation, costUsd: calcularCostoUsd(model, tokensInput, tokensOutput, cacheRead, cacheCreation) });
}
