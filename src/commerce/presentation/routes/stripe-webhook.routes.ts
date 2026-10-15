/**
 * HUB by Raisen — Ruta webhook Stripe (platform-wide). Verifica firma real
 * contra rawBody, resuelve tenant por account, dispatcha evento.
 * Nunca loguea header Stripe-Signature ni crudos. C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import type { StripeWebhookHandler, StripeEvent } from "../../infrastructure/stripe-webhook.handler.ts";
import { StripeSignatureVerifier } from "../../infrastructure/stripe-signature.verifier.ts";

export interface StripeWebhookDeps {
  readonly webhookHandler: StripeWebhookHandler;
  readonly verifier: StripeSignatureVerifier;
}

export function rutaStripeWebhook(deps: StripeWebhookDeps): RouteDefinition {
  return {
    method: "POST", path: "/webhooks/stripe",
    handler: async (ctx) => {
      const sig = (ctx.headers["stripe-signature"] ?? ctx.headers["Stripe-Signature"]) as string | undefined;
      if (!sig) return { ok: false, error: { kind: "header_ausente" } };
      const rawBody = ctx.rawBody ?? "";
      const verificado = await deps.verifier.verify(rawBody, sig);
      if (!verificado.ok) return { ok: false, error: { kind: verificado.error } };

      const event = JSON.parse(rawBody) as StripeEvent;
      const result = await deps.webhookHandler.procesar(event);
      if (!result.ok) return { ok: false, error: { kind: "handler_error", cause: result.error } };
      if (result.value.kind === "tenant_not_found") return { ok: false, error: { kind: "tenant_not_found" } };
      return { ok: true };
    },
  };
}