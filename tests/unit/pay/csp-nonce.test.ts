import { expect, test } from "vitest";
import { generateNonce } from "../../../src/pay/infrastructure/csp-nonce.ts";

test("nonce es único entre llamadas", () => {
  const nonces = new Set<string>();
  for (let i = 0; i < 100; i++) nonces.add(generateNonce());
  expect(nonces.size).toBe(100);
});

test("nonce no contiene caracteres no seguros para atributo", () => {
  const n = generateNonce();
  expect(n).not.toMatch(/["'\s<>=]/);
  expect(n.length).toBeGreaterThan(10);
});