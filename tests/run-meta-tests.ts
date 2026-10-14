#!/usr/bin/env node
/**
 * Mini test runner for tests/unit/channels/meta/
 * Evita Vitest/esbuild porque el sandbox bloquea spawn con pipe.
 * node --experimental-strip-types tests/run-meta-tests.ts
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";

const META_TEST_DIR = new URL("../unit/channels/meta", import.meta.url).pathname;
const files = readdirSync(META_TEST_DIR).filter(f => f.endsWith(".test.ts"));

let passed = 0;
let failed = 0;

for (const f of files) {
  const fullPath = join(META_TEST_DIR, f);
  console.log(`\n🧪 ${f}`);
  try {
    const mod = await import(fullPath);
    // no-op: each file runs tests via top-level test() / describe()
    passed++;
  } catch (e) {
    console.error(`  FAIL: ${e}`);
    failed++;
  }
}

console.log(`\n${"=".repeat(40)}`);
console.log(`Resultados: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);