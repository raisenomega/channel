/**
 * HUB by Raisen — Rate limit por (ip, path) para rutas públicas (Slide 3.3).
 * Backing store: tabla Supabase rate_limit_counters. Ventana = minuto truncado.
 * Threshold configurable; por defecto 10 req/min. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export type RateLimitError = "rate_limited";

export interface RateLimitCheck {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export class RateLimiter {
  constructor(private readonly threshold: number = 10) {}

  async check(ip: string, path: string, threshold: number = this.threshold): Promise<Result<RateLimitCheck, RateLimitError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return ok({ allowed: true, retryAfterSeconds: 0 });
    try {
      const upsert = await fetch(`${u}/rpc/rate_limit_increment`, {
        method: "POST", headers: h,
        body: JSON.stringify({ p_ip: ip, p_path: path }),
      });
      if (!upsert.ok) return ok({ allowed: true, retryAfterSeconds: 0 });
      const count = Number(await upsert.json());
      if (count > threshold) return err("rate_limited");
      return ok({ allowed: true, retryAfterSeconds: 60 });
    } catch { return ok({ allowed: true, retryAfterSeconds: 0 }); }
  }
}