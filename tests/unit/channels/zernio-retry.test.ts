import { expect, test } from "vitest";
import { conReintentos } from "../../../src/channels/infrastructure/zernio.retry.ts";
import { ok, err } from "../../../src/shared/domain/result.ts";

test("A-05 RETRY_503_RECUPERA: fallo 1x + fallo 2x -> OK en 3er intento", async () => {
  let calls = 0;
  const r = await conReintentos(async () => {
    calls++;
    return calls >= 3 ? ok("exito") : err({ causa: "http_503" });
  }, { maxIntentos: 3, backoffBaseMs: 1 });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe("exito");
  expect(calls).toBe(3);
});

test("A-06 RETRY_AGOTADO: 3 fallos consecutivos -> RETRY_AGOTADO", async () => {
  const r = await conReintentos(async () => err({ causa: "provider_unavailable" }), { maxIntentos: 3, backoffBaseMs: 1 });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.kind).toBe("retry_agotado");
    expect(r.error.intentos).toBe(3);
    expect(r.error.ultimo_error).toBe("provider_unavailable");
  }
});

test("exito en primer intento -> ok sin delay", async () => {
  const r = await conReintentos(async () => ok(42), { maxIntentos: 3, backoffBaseMs: 1000 });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);
});

test("config por defecto usa 3 intentos, 1s base", async () => {
  let calls = 0;
  const r = await conReintentos(async () => { calls++; return err({ causa: "x" }); });
  expect(r.ok).toBe(false);
  expect(calls).toBe(3);
});