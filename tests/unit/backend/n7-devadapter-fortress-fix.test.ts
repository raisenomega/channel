import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
// Aserción de fuente: channel-router-wrapper importa supabase.client (landmine Deno.exit),
// no importable en vitest. Verificamos el guard de registro condicional del DevChannelAdapter.
const SRC = readFileSync("src/server/channel-router-wrapper.ts", "utf8");

test("A-N-7: DevChannelAdapter se registra SOLO fuera de producción (guard NODE_ENV)", () => {
  expect(SRC).toMatch(/nodeEnv\(\)\s*!==\s*"production"/);
  // El registro de dev está detrás del guard (misma línea que la condición).
  const guardLine = SRC.split("\n").find((l) => l.includes("registrar(new DevChannelAdapter())"));
  expect(guardLine).toBeDefined();
  expect(guardLine).toContain('!== "production"');
});
