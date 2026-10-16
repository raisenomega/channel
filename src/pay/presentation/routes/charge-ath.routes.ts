/**
 * HUB by Raisen — POST /pay/:tenantSlug/:orderId/ath-charge (Slide 3.3).
 * Pública + rate-limit + CSRF. Valida phone, llama AthMovilAdapter.cobrar().
 * C4 ≤75.
 */
// PUBLIC: cobro desde la landing publica; protegido por CSRF token HMAC (X-CSRF-Token) + rate limit.
import type { RouteDefinition } from "../../../server/server-types.ts";
import { verificarCsrf } from "../../infrastructure/csrf-token.ts";
import { RateLimiter } from "../../infrastructure/rate-limit.ts";
import { LoadPagoPageHandler } from "../../application/load-pago-page.handler.ts";
import type { AthMovilAdapter } from "../../../commerce/infrastructure/ath-movil.adapter.ts";

export interface AthChargeDeps {
  readonly loader: LoadPagoPageHandler;
  readonly rateLimiter: RateLimiter;
  readonly adapter: AthMovilAdapter;
}

const normalizePhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11) return digits;
  return null;
};

export function rutaAthCharge(deps: AthChargeDeps): RouteDefinition {
  return {
    method: "POST", path: "/pay/:tenantSlug/:orderId/ath-charge",
    handler: async (ctx) => {
      const parts = ctx.path.split("/");
      const slug = parts[2] ?? "";
      const orderId = parts[3] ?? "";
      const ip = (ctx.headers["x-forwarded-for"] as string) ?? "local";
      const rl = await deps.rateLimiter.check(ip, `/pay/${slug}/${orderId}/ath-charge`);
      if (!rl.ok) return { status: 429, body: "", headers: { "Retry-After": "60" } };

      const body = ((ctx.body ?? {}) as Record<string, unknown>);
      const csrfToken = (ctx.headers["x-csrf-token"] as string) ?? "";
      const csrf = await verificarCsrf(orderId, csrfToken);
      if (!csrf.ok) return { status: 400, body: JSON.stringify({ ok: false, error: { kind: csrf.error } }) };

      const phone = normalizePhone(String(body["phoneNumber"] ?? ""));
      if (!phone) return { status: 400, body: JSON.stringify({ ok: false, error: { kind: "phone_invalido" } }) };

      const load = await deps.loader.ejecutar(slug, orderId as never);
      if (!load.ok) return { status: 404, body: JSON.stringify({ ok: false, error: { kind: "order_not_found" } }) };

      const result = await deps.adapter.cobrar(load.value.order as never, "ath_movil");
      if (!result.ok) return { status: 400, body: JSON.stringify({ ok: false, error: result.error }) };
      return { status: 200, body: JSON.stringify({ ok: true, ecommerceId: result.value }) };
    },
  };
}
