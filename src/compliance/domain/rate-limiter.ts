import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export interface RateLimitState {
  readonly tenantId: TenantId;
  readonly channel: string;
  readonly maxRequests: number;
  readonly windowSeconds: number;
  readonly isActive: boolean;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: Date;
  readonly retryAfter: number;
}

export class RateLimiter {
  private readonly store = new Map<string, { count: number; resetAt: number }>();

  verificar(
    tenantId: TenantId,
    channel: string,
    config: RateLimitState,
    now: number = Date.now(),
  ): RateLimitResult {
    const key = `${tenantId}:${channel}`;
    const entry = this.store.get(key);
    const shouldReset = entry && entry.resetAt <= now;

    if (!entry || shouldReset) {
      this.store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
      return Object.freeze({ allowed: true, remaining: config.maxRequests - 1, resetAt: new Date(now + config.windowSeconds * 1000), retryAfter: 0 });
    }

    if (entry.count >= config.maxRequests) {
      return Object.freeze({ allowed: false, remaining: 0, resetAt: new Date(entry.resetAt), retryAfter: Math.ceil((entry.resetAt - now) / 1000) });
    }

    entry.count++;
    return Object.freeze({ allowed: true, remaining: config.maxRequests - entry.count, resetAt: new Date(entry.resetAt), retryAfter: 0 });
  }
}

export const generarDisclosureIA = (
  config: { aiDisclosure: boolean; aiDisclosureText: string },
  jurisdictionDetected: string | null,
  contactAsked: boolean,
): string | null => {
  if (!config.aiDisclosure) return null;
  if (contactAsked) return config.aiDisclosureText;
  if (jurisdictionDetected === "CA" || jurisdictionDetected === "US_CA") return config.aiDisclosureText;
  return null;
};