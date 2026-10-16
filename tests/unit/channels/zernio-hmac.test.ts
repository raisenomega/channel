import { expect, test } from "vitest";
import { verifyZernioHmac } from "../../../src/channels/infrastructure/zernio.hmac.ts";

// Usamos crypto.subtle para generar una firma real para tests
async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)) as ArrayBuffer);
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}

test("A-01 HMAC_INVALIDO_HEADER: header ausente -> FIRMA_INVALIDA.header_ausente", async () => {
  const r = await verifyZernioHmac("body", undefined, "secret");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.causa).toBe("header_ausente");
});

test("A-02 HMAC_BODY_ALTERADO: body diferente post-firma -> firma_mismatch", async () => {
  const sig = await sign("real body", "secret");
  const r = await verifyZernioHmac("tampered body", `sha256=${sig}`, "secret");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.causa).toBe("firma_mismatch");
});

test("A-03 HMAC_TIMING_SAFE: firma correcta -> ok", async () => {
  const sig = await sign("hello", "mysecret");
  const r = await verifyZernioHmac("hello", `sha256=${sig}`, "mysecret");
  expect(r.ok).toBe(true);
});

test("secret vacio -> secret_no_configurado", async () => {
  const r = await verifyZernioHmac("body", "sha256=abc", "");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.causa).toBe("secret_no_configurado");
});

test("header malformado (no hex) -> header_malformado", async () => {
  const r = await verifyZernioHmac("body", "sha256=zzz", "secret");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.causa).toBe("header_malformado");
});

test("longitud de firma distinta -> firma_mismatch", async () => {
  const sig = (await sign("body", "diff_secret"));
  const r = await verifyZernioHmac("body", sig, "correct_secret");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.causa).toBe("firma_mismatch");
});