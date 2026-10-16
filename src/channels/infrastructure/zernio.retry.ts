/**
 * HUB by Raisen — Backoff exponencial con reintentos (Slide 4.2a).
 * R19: mismo patrón que OMEGA zernio-sync hardened. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";

export type RetryError = { readonly kind: "retry_agotado"; readonly intentos: number; readonly ultimo_error: string };

export interface RetryConfig {
  readonly maxIntentos: number;
  readonly backoffBaseMs: number;
}

const DEFAULT_CONFIG: RetryConfig = Object.freeze({ maxIntentos: 3, backoffBaseMs: 1000 });

export async function conReintentos<T>(
  op: () => Promise<Result<T, { readonly causa: string }>>,
  cfg: RetryConfig = DEFAULT_CONFIG,
): Promise<Result<T, RetryError>> {
  let ultimoError = "sin_intentos";
  for (let i = 0; i < cfg.maxIntentos; i++) {
    const r = await op();
    if (r.ok) return ok(r.value);
    ultimoError = r.error.causa;
    if (i < cfg.maxIntentos - 1) {
      await new Promise((res) => setTimeout(res, cfg.backoffBaseMs * Math.pow(2, i)));
    }
  }
  return err({ kind: "retry_agotado", intentos: cfg.maxIntentos, ultimo_error: ultimoError });
}