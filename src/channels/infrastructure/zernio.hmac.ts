/**
 * HUB by Raisen — Verificación HMAC-SHA256 de webhook Zernio (Slide 4.2a).
 * R19: patrón idéntico a OMEGA adaptado al crypto.subtle de HUB. timing-safe.
 * C4 ≤75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

export type HmacError = { readonly kind: "FIRMA_INVALIDA"; readonly causa: string };

export async function verifyZernioHmac(
  rawBody: string,
  signatureHeader: string | undefined,
  webhookSecret: string,
): Promise<Result<void, HmacError>> {
  if (!signatureHeader) return err({ kind: "FIRMA_INVALIDA", causa: "header_ausente" });
  if (!webhookSecret) return err({ kind: "FIRMA_INVALIDA", causa: "secret_no_configurado" });
  const received = signatureHeader.replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(received)) return err({ kind: "FIRMA_INVALIDA", causa: "header_malformado" });
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
    const sigBuf = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)) as ArrayBuffer);
    const expected = [...sigBuf].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return err({ kind: "FIRMA_INVALIDA", causa: "firma_mismatch" });
    }
    return ok(undefined);
  } catch { return err({ kind: "FIRMA_INVALIDA", causa: "firma_mismatch" }); }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}