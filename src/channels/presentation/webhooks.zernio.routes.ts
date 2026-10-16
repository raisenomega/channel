/**
 * HUB by Raisen — Webhook route publica para Zernio (Slide 4.2d + 4.9).
 * Soporta eventos message.inbound (original) + whatsapp.template.status_updated.
 * Ambos verifican HMAC-SHA256. C4 ≤75.
 */
// PUBLIC: webhook entrante de Zernio; autenticado por HMAC-SHA256 (X-Zernio-Signature), 401 si falla.
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import type { ServerHandlers } from "../../server/server-routes.ts";
import { verifyZernioHmac } from "../infrastructure/zernio.hmac.ts";

function parseBody(ctx: RequestContext): { sig: string; bodyRaw: string; parsed: Record<string, unknown> } {
  const sig = typeof ctx.headers["x-zernio-signature"] === "string" ? ctx.headers["x-zernio-signature"] : "";
  const bodyRaw = typeof ctx.rawBody === "string" ? ctx.rawBody : JSON.stringify(ctx.body ?? {});
  const parsed = (typeof ctx.body === "object" && ctx.body ? ctx.body : {}) as Record<string, unknown>;
  return { sig, bodyRaw, parsed };
}

export function handleZernioWebhook(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST",
    path: "/webhooks/zernio",
    handler: async (ctx) => {
      const { sig, bodyRaw, parsed } = parseBody(ctx);

      // Slide 4.9: whatsapp.template.status_updated
      if (parsed.event === "whatsapp.template.status_updated") {
        const hmac = h.templates ? await verifyZernioHmac(bodyRaw, sig, h.templates.webhookSecret) : undefined;
        if (!hmac?.ok) return { status: 401, body: JSON.stringify({ error: "signature_invalid" }) };
        const data = (parsed.data ?? {}) as Record<string, unknown>;
        const r = await h.templates.syncStatus.ejecutar({
          nombre: String(data.name ?? ""),
          language: String(data.language ?? ""),
          status: String(data.status ?? "") as "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED",
          reason: data.rejection_reason as string | undefined,
        });
        if (!r.ok && r.error.kind === "template_no_encontrado") {
          console.info(`[templates] webhook: template "${data.name}" no local — ${JSON.stringify(r.error)}`);
          return { status: 200, body: JSON.stringify({ ok: true }) };
        }
        if (!r.ok && r.error.kind === "status_desconocido") {
          return { status: 400, body: JSON.stringify({ ok: false, kind: "status_desconocido" }) };
        }
        return { status: 200, body: JSON.stringify({ ok: true }) };
      }

      // Slide 4.2d: message.inbound (original)
      const r = await h.processWebhook.ejecutar({
        provider: "zernio", signature: sig, body: bodyRaw, rawPayload: ctx.body,
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