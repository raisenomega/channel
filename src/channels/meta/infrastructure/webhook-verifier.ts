/**
 * HUB by Raisen — Verificador de firma HMAC-SHA256 para webhooks de Meta.
 * Usa comparacion constante en tiempo (timingSafeEqual).
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= (aBytes[i] as number) ^ (bBytes[i] as number);
  return diff === 0;
}

export async function verificarFirmaWebhook(signature: string, rawBody: string): Promise<Result<boolean, string>> {
  const secret = getEnv("META_APP_SECRET");
  if (!secret) return err("META_APP_SECRET no configurada");

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret)!;
  const msgData = encoder.encode(rawBody)!;

  try {
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
    const sigBuffer = await crypto.subtle.sign("HMAC", key, msgData) as ArrayBuffer;
    const sigBytes = new Uint8Array(sigBuffer);
    const hex = Array.from(sigBytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");

    const expected = `sha256=${hex}`;
    return ok(timingSafeEqual(signature, expected));
  } catch {
    return err("fallo_verificacion_firma");
  }
}