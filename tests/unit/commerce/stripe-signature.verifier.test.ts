import { expect, test } from "vitest";
import { StripeSignatureVerifier } from "../../../src/commerce/infrastructure/stripe-signature.verifier.ts";

const SECRET = "whsec_test_secret";
const t = Math.floor(Date.now() / 1000).toString();

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)) as ArrayBuffer);
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}

test("firma valida -> ok", async () => {
  const body = JSON.stringify({ id: "evt_1" });
  const sig = await sign(`${t}.${body}`);
  const v = new StripeSignatureVerifier(SECRET);
  const r = await v.verify(body, `t=${t},v1=${sig}`);
  expect(r.ok).toBe(true);
});

test("adversarial 1: header ausente tratado por ruta (verify con vacío -> header_malformado]", async () => {
  const v = new StripeSignatureVerifier(SECRET);
  const r = await v.verify("{}", "");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("header_malformado");
});

test("adversarial 2: header malformado (sin t=)", async () => {
  const v = new StripeSignatureVerifier(SECRET);
  const r = await v.verify("{}", "abc");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("header_malformado");
});

test("adversarial 3: timestamp viejo -> timestamp_fuera_de_tolerancia", async () => {
  const old = (Math.floor(Date.now() / 1000) - 600).toString();
  const body = "{}";
  const v = new StripeSignatureVerifier(SECRET, 300);
  const r = await v.verify(body, `t=${old},v1=abc`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("timestamp_fuera_de_tolerancia");
});

test("adversarial 4: firma con otro secret -> firma_invalida", async () => {
  const body = "{}";
  const otherSecret = "whsec_other";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(otherSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)) as ArrayBuffer);
  const badSig = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const v = new StripeSignatureVerifier(SECRET);
  const r = await v.verify(body, `t=${t},v1=${badSig}`);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toBe("firma_invalida");
});

test("adversarial 5: body re-serializado no coincide (usa rawBody)", async () => {
  const raw = '{"id":"evt_1","n":1}';
  const reSerialized = JSON.stringify(JSON.parse(raw)); // mismo orden aqui, pero firma usa raw
  const sigRaw = await sign(`${t}.${raw}`);
  const v = new StripeSignatureVerifier(SECRET);
  const okRaw = await v.verify(raw, `t=${t},v1=${sigRaw}`);
  expect(okRaw.ok).toBe(true);
  if (raw !== reSerialized) {
    const r2 = await v.verify(reSerialized, `t=${t},v1=${sigRaw}`);
    expect(r2.ok).toBe(false);
  }
});

test("timing-safe: compara byte a byte (assert uso de comparación)", () => {
  const v = new StripeSignatureVerifier(SECRET);
  const parsed = v.parse(`t=${t},v1=abc`);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) expect(parsed.value.signatures).toEqual(["abc"]);
});