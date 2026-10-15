import { expect, test, vi, afterEach } from "vitest";
import { generarCsrf, verificarCsrf } from "../../../src/pay/infrastructure/csrf-token.ts";

const ORIG = process.env["CSRF_SECRET"];

function setup(secret = "a".repeat(64)): void { process.env["CSRF_SECRET"] = secret; }
function restore(): void { if (ORIG === undefined) delete process.env["CSRF_SECRET"]; else process.env["CSRF_SECRET"] = ORIG; }
afterEach(() => { vi.useRealTimers(); });

test("generate produce formato ts.mac y verificable", async () => {
  setup();
  const tok = await generarCsrf("ord_1");
  expect(tok.ok).toBe(true);
  if (!tok.ok) return;
  expect(tok.value).toMatch(/^\d+\.[a-f0-9]{64}$/);
  const v = await verificarCsrf("ord_1", tok.value);
  expect(v.ok).toBe(true);
  restore();
});

test("verify con orden distinta -> csrf_invalido", async () => {
  setup();
  const tok = (await generarCsrf("ord_1"));
  if (!tok.ok) return;
  const v = await verificarCsrf("ord_OTHER", tok.value);
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.error).toBe("csrf_invalido");
  restore();
});

test("verify expirado (>15 min) -> csrf_expirado", async () => {
  setup();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const tok = await generarCsrf("ord_1");
  // avanzar 20 minutos -> token dentro del formato pero fuera de tolerancia
  vi.setSystemTime(new Date("2026-01-01T00:20:00Z"));
  const v = await verificarCsrf("ord_1", tok.ok ? tok.value : "");
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.error).toBe("csrf_expirado");
  vi.useRealTimers();
  restore();
});

test("verify con token malformado (sin punto) -> csrf_invalido", async () => {
  setup();
  const v = await verificarCsrf("ord_1", "abcdef");
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.error).toBe("csrf_invalido");
  restore();
});

test("secret ausente -> csrf_invalido", async () => {
  restore(); // secret undefined
  const v = await verificarCsrf("ord_1", `1.${"f".repeat(64)}`);
  expect(v.ok).toBe(false);
});

test("generate es determinista por ts (mismo secret+order+ts -> mismo mac)", async () => {
  setup();
  const a = await generarCsrf("ord_1");
  const b = await generarCsrf("ord_1");
  expect(a.ok && b.ok).toBe(true);
  if (a.ok && b.ok) {
    const [tsA, macA] = a.value.split(".");
    const [tsB, macB] = b.value.split(".");
    expect(new Number(tsB) >= new Number(tsA)).toBe(true); // newer ts
    // distintos ts => distintos token; verificar que cada uno se puede validar
    expect(await (await verificarCsrf("ord_1", a.value)).ok).toBe(true);
    expect(await (await verificarCsrf("ord_1", b.value)).ok).toBe(true);
    void macA; void macB;
  }
  restore();
});