/**
 * HUB by Raisen — Rutas webhook WhatsApp Cloud API.
 * GET /webhooks/whatsapp — challenge-response (verify_token)
 * POST /webhooks/whatsapp — receive messages (firma MANDATORIA)
 * C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../../server/server-types.ts";
import { verificarFirmaWebhook } from "../../../meta/infrastructure/webhook-verifier.ts";
import { parsearPayloadMeta } from "../../infrastructure/webhook-payload.parser.ts";
import { SupabaseMessageRepo } from "../../infrastructure/supabase-message.repo.ts";
import { ReceiveMessageHandler } from "../../application/receive-message.handler.ts";

declare const process: { env: Record<string, string | undefined> };

const repo = new SupabaseMessageRepo();
const receiveHandler = new ReceiveMessageHandler(repo);

export function rutaWebhookVerify(): RouteDefinition {
  return {
    method: "GET", path: "/webhooks/whatsapp",
    handler: async (ctx) => {
      const q = ctx.path.includes("?") ? new URLSearchParams(ctx.path.split("?")[1] ?? "") : new URLSearchParams();
      const mode = q.get("hub.mode");
      const token = q.get("hub.verify_token");
      const challenge = q.get("hub.challenge");
      const expected = process.env["META_WEBHOOK_VERIFY_TOKEN"] ?? "";
      if (mode === "subscribe" && token === expected && challenge) {
        // Retornar challenge como text/plain (requiere modificacion en server)
        return { ok: true, challenge } as Record<string, unknown>;
      }
      return { ok: false, error: { kind: "verify_failed" } };
    },
  };
}

export function rutaWebhookReceive(): RouteDefinition {
  return {
    method: "POST", path: "/webhooks/whatsapp",
    handler: async (ctx) => {
      const sig = (ctx.headers?.["x-hub-signature-256"] ?? "") as string;
      if (!sig) return { ok: false, error: { kind: "firma_requerida" } };
      const rawBody = ctx.rawBody ?? "";
      const firmado = await verificarFirmaWebhook(sig, rawBody);
      if (!firmado.ok || !firmado.value) return { ok: false, error: { kind: "firma_invalida" } };

      const parsed = parsearPayloadMeta(ctx.body as Record<string, unknown>);
      if (!parsed.ok) return { ok: false, error: { kind: "payload_invalido", cause: parsed.error } };

      // Para cada mensaje inbound, procesar con el tenant apropiado
      for (const msg of parsed.value) {
        const tenantId = msg.phoneNumberId; // simplificado: mapear phone_number_id a tenant
        await receiveHandler.ejecutar(tenantId, msg);
      }
      return { ok: true };
    },
  };
}