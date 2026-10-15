/**
 * HUB by Raisen — Ruta preparar PaymentIntent Stripe (3.2b-BIS).
 * POST /commerce/stripe/prepare. JWT requerido, tenantId del claim.
 * Devuelve client_secret listo para Stripe Elements en el frontend.
 * El client_secret es efímero y confidencial: nunca se loguea ni persiste. C4 ≤75.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import { parsearJwtClaims } from "../../../server/jwt-verify.ts";
import { tid } from "../../../server/server-types.ts";
import { extractJwt } from "../../../server/server-helpers.ts";
import type { OrderRepository } from "../../domain/commerce.repository.ts";
import type { StripeAdapter } from "../../infrastructure/stripe.adapter.ts";

export interface StripePrepareDeps {
  readonly orderRepo: OrderRepository;
  readonly adapter: StripeAdapter;
}

export function rutaStripePrepare(deps: StripePrepareDeps): RouteDefinition {
  return {
    method: "POST", path: "/commerce/stripe/prepare",
    handler: async (ctx) => {
      const claims = await parsearJwtClaims(extractJwt(ctx.headers));
      if (!claims.ok) return { ok: false, error: claims.error };
      const tenantId = tid(claims.value.tenantId);
      const orderId = String(((ctx.body ?? {}) as Record<string, unknown>)["orderId"] ?? "");
      if (!orderId) return { ok: false, error: { kind: "order_requerido" } };

      const order = await deps.orderRepo.buscar(orderId as never, tenantId);
      if (!order.ok) return { ok: false, error: { kind: "persistence_error" } };
      if (!order.value) return { ok: false, error: { kind: "order_not_found" } };

      const result = await deps.adapter.preparar(order.value);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, data: { paymentIntentId: result.value.paymentIntentId, clientSecret: result.value.clientSecret } };
    },
  };
}