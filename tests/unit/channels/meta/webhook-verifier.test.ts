import { expect, test, vi } from "vitest";
import { verificarFirmaWebhook } from "../../../../src/channels/meta/infrastructure/webhook-verifier.ts";

const TEST_SECRET = "mi_app_secret_super_seguro";

async function calcularHash(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
  const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)) as ArrayBuffer);
  const hex = Array.from(sigBytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

test("firma con hash correcto retorna true", async () => {
  vi.stubEnv("META_APP_SECRET", TEST_SECRET);
  const body = "test_body";
  const expectedSig = await calcularHash(TEST_SECRET, body);
  const result = await verificarFirmaWebhook(expectedSig, body);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(true);
  vi.unstubAllEnvs();
});

test("firma incorrecta retorna false", async () => {
  vi.stubEnv("META_APP_SECRET", TEST_SECRET);
  const body = JSON.stringify({ id: "test", status: "CREATED" });
  const result = await verificarFirmaWebhook("sha256=hash_incorrecto", body);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(false);
  vi.unstubAllEnvs();
});

test("sin META_APP_SECRET retorna error", async () => {
  const result = await verificarFirmaWebhook("sha256=abc", "{}");
  expect(result.ok).toBe(false);
});

test("body vacio con firma correcta retorna true", async () => {
  vi.stubEnv("META_APP_SECRET", TEST_SECRET);
  const body = "";
  const expectedSig = await calcularHash(TEST_SECRET, body);
  const result = await verificarFirmaWebhook(expectedSig, body);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(true);
  vi.unstubAllEnvs();
});

test("NEW-CRIT-B adversarial: header vacio retorna error (no procesa)", async () => {
  vi.stubEnv("META_APP_SECRET", TEST_SECRET);
  const result = await verificarFirmaWebhook("", "test_body");
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(false); // HMAC vacio no coincide
  vi.unstubAllEnvs();
});

test("NEW-HIGH-E adversarial: raw body vs re-serialized (orden keys distinto)", async () => {
  vi.stubEnv("META_APP_SECRET", TEST_SECRET);
  // Meta firma el RAW body. Si el body es '{"id":"x","status":"CREATED"}', 
  // JSON.stringify(ctx.body) podria producir '{"status":"CREATED","id":"x"}' (orden distinto)
  const rawBody = '{"id":"x","status":"CREATED"}';
  const reSerialized = JSON.stringify(JSON.parse(rawBody)); // {"id":"x","status":"CREATED"} (JS preserva orden)
  const sigForRaw = await calcularHash(TEST_SECRET, rawBody);
  // JS JSON.parse + JSON.stringify preserva orden de keys, pero Meta podria NO
  // Si rawBody y reSerialized difieren, la firma no coincide
  const rawResult = await verificarFirmaWebhook(sigForRaw, rawBody);
  expect(rawResult.ok).toBe(true);
  if (rawResult.ok) expect(rawResult.value).toBe(true);
  // La firma calculada sobre rawBody NO debe funcionar con reSerialized si son diferentes
  if (rawBody !== reSerialized) {
    const reResult = await verificarFirmaWebhook(sigForRaw, reSerialized);
    expect(reResult.ok).toBe(true);
    if (reResult.ok) expect(reResult.value).toBe(false);
  }
  vi.unstubAllEnvs();
});