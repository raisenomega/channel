/**
 * HUB by Raisen — Verificador de firma de webhook Stripe (HMAC-SHA256).
 * Comparacion en tiempo constante. Timestamp tolerance 300s (replay defense).
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

export interface StripeSignatureParts {
  readonly timestamp: number;
  readonly signatures: readonly string[];
}

export class StripeSignatureVerifier {
  constructor(
    private readonly webhookSecret: string,
    private readonly toleranceSeconds = 300,
  ) {}

  parse(header: string): Result<StripeSignatureParts, "header_malformado"> {
    const tMatch = /(?:^|,)t=(\d+)/.exec(header);
    const v1 = [...header.matchAll(/(?:^|,)v1=([a-f0-9]+)/g)].map((m) => m[1] ?? "").filter(Boolean);
    if (!tMatch || v1.length === 0) return err("header_malformado");
    return ok({ timestamp: Number(tMatch[1]), signatures: v1 });
  }

  async verify(rawBody: string, header: string): Promise<Result<void, "header_malformado" | "timestamp_fuera_de_tolerancia" | "firma_invalida">> {
    const parsed = this.parse(header);
    if (!parsed.ok) return err("header_malformado");
    const { timestamp, signatures } = parsed.value;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > this.toleranceSeconds) return err("timestamp_fuera_de_tolerancia");

    const signedPayload = `${timestamp}.${rawBody}`;
    const key = new TextEncoder().encode(this.webhookSecret);
    const data = new TextEncoder().encode(signedPayload);
    try {
      const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) as CryptoKey;
      const sigBuf = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data) as ArrayBuffer);
      const expected = [...sigBuf].map((b) => b.toString(16).padStart(2, "0")).join("");
      const okMatch = signatures.some((s: string) => this.timingSafeEqual(expected, s));
      return okMatch ? ok(undefined) : err("firma_invalida");
    } catch { return err("firma_invalida"); }
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= (a.charCodeAt(i) as number) ^ (b.charCodeAt(i) as number);
    return diff === 0;
  }
}