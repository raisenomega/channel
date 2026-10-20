/**
 * HUB by Raisen — Webhook publico de Zernio (Slide 4.2d + 4.9 + Hotfix P).
 * Eventos: message.inbound + whatsapp.template.status_updated (ambos HMAC-SHA256).
 * Hotfix P (#171/#170/#172): logging estructurado por etapa (request_id + shape + conteo) +
 * propagacion de error (500 en fallo real, NUNCA 200 silencioso). C4 <=75.
 */
// PUBLIC: webhook entrante de Zernio; autenticado por HMAC-SHA256 (X-Zernio-Signature), 401 si falla.
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import type { ServerHandlers } from "../../server/server-routes.ts";
import { verifyZernioHmac } from "../infrastructure/zernio.hmac.ts";
import { nuevoReqId, logOauth } from "../infrastructure/oauth-telemetry.ts";

function parseBody(ctx: RequestContext): { sig: string; bodyRaw: string; parsed: Record<string, unknown> } {
  const sig = typeof ctx.headers["x-zernio-signature"] === "string" ? ctx.headers["x-zernio-signature"] : "";
  const bodyRaw = typeof ctx.rawBody === "string" ? ctx.rawBody : JSON.stringify(ctx.body ?? {});
  const parsed = (typeof ctx.body === "object" && ctx.body ? ctx.body : {}) as Record<string, unknown>;
  return { sig, bodyRaw, parsed };
}

/** Resumen del payload para el log (SOLO shape, nunca contenido/secretos): keys + event + #messages. */
function shapeOf(p: Record<string, unknown>): string {
  const msgs = Array.isArray(p["messages"]) ? (p["messages"] as unknown[]).length : "n/a";
  return `keys=[${Object.keys(p).join(",")}] event=${String(p["event"] ?? "-")} messages=${msgs}`;
}

async function manejarTemplate(h: ServerHandlers, reqId: string, parsed: Record<string, unknown>, bodyRaw: string, sig: string) {
  const hmac = h.templates ? await verifyZernioHmac(bodyRaw, sig, h.templates.webhookSecret) : undefined;
  if (!hmac?.ok) { logOauth("zernio-webhook", reqId, "template HMAC FAIL -> 401"); return { status: 401, body: JSON.stringify({ error: "signature_invalid" }) }; }
  const data = (parsed["data"] ?? {}) as Record<string, unknown>;
  const r = await h.templates.syncStatus.ejecutar({ nombre: String(data["name"] ?? ""), language: String(data["language"] ?? ""), status: String(data["status"] ?? "") as "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED", reason: data["rejection_reason"] as string | undefined });
  if (!r.ok && r.error.kind === "status_desconocido") return { status: 400, body: JSON.stringify({ ok: false, kind: "status_desconocido" }) };
  return { status: 200, body: JSON.stringify({ ok: true }) };
}

export function handleZernioWebhook(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/webhooks/zernio",
    handler: async (ctx) => {
      const reqId = nuevoReqId();
      const { sig, bodyRaw, parsed } = parseBody(ctx);
      logOauth("zernio-webhook", reqId, `recibido ${shapeOf(parsed)}`);
      if (parsed["event"] === "whatsapp.template.status_updated") return manejarTemplate(h, reqId, parsed, bodyRaw, sig);

      const r = await h.processWebhook.ejecutar({ provider: "zernio", signature: sig, body: bodyRaw, rawPayload: ctx.body });
      if (!r.ok) {
        if (r.error.kind === "firma_invalida") { logOauth("zernio-webhook", reqId, "HMAC FAIL -> 401"); return { status: 401, body: JSON.stringify({ error: "signature_invalid" }) }; }
        logOauth("zernio-webhook", reqId, `ingest ERROR ${r.error.kind} -> 500 (#170/#172: no silent 200)`);
        return { status: 500, body: JSON.stringify({ ok: false, kind: r.error.kind }) };
      }
      // Bloque 2: HMAC OK (processWebhook ok). Persistir el mensaje real en el inbox (conversations/messages).
      const ing = await h.ingestZernio.ejecutar(ctx.body);
      if (!ing.ok && ing.error.kind === "persistence_failure") {
        logOauth("zernio-webhook", reqId, `persist ERROR ${ing.error.cause} -> 500`);
        return { status: 500, body: JSON.stringify({ ok: false, kind: "persist_failed" }) };
      }
      const outcome = ing.ok ? (ing.value.persisted ? "persisted" : "dup_skip") : ing.error.kind;
      logOauth("zernio-webhook", reqId, `ingest=${outcome}`);
      return { status: 200, body: JSON.stringify({ ok: true, ingest: outcome }) };
    },
  };
}
