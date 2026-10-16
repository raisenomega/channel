/**
 * HUB by Raisen — Webhook route publica para Zernio (Slide 4.2d).
 * POST con body JSON directo + header X-Zernio-Signature.
 * Reusa verifyZernioHmac + ZernioAdapter.parseInboundWebhook + ProcessWebhookHandler.
 * C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import type { ServerHandlers } from "../../server/server-routes.ts";

export function handleZernioWebhook(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST",
    path: "/webhooks/zernio",
    handler: async (ctx) => {
      const sig = typeof ctx.headers["x-zernio-signature"] === "string"
        ? ctx.headers["x-zernio-signature"]
        : "";
      const bodyRaw = typeof ctx.rawBody === "string" ? ctx.rawBody : JSON.stringify(ctx.body ?? {});
      const r = await h.processWebhook.ejecutar({
        provider: "zernio",
        signature: sig,
        body: bodyRaw,
        rawPayload: ctx.body,
      });
      if (!r.ok && r.error.kind === "firma_invalida") {
        return { status: 401, body: JSON.stringify({ error: "signature_invalid" }) };
      }
      return r.ok
        ? { status: 200, body: JSON.stringify({ ok: true, events: r.value }) }
        : { status: 200, body: JSON.stringify({ ok: false, kind: r.error.kind }) };
    },
  };
}