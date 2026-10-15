/**
 * HUB by Raisen — Rutas webhook WhatsApp Cloud API.
 * GET /webhooks/whatsapp — challenge-response (text/plain)
 * POST /webhooks/whatsapp — receive messages (firma MANDATORIA)
 * C4 ≤75 lineas.
 */
import type { RouteDefinition, HttpResponse } from "../../../../server/server-types.ts";
import { verificarFirmaWebhook } from "../../../meta/infrastructure/webhook-verifier.ts";
import { parsearPayloadMeta } from "../../infrastructure/webhook-payload.parser.ts";
import { SupabaseMessageRepo } from "../../infrastructure/supabase-message.repo.ts";
import { ReceiveMessageHandler } from "../../application/receive-message.handler.ts";
import { SupabaseMetaSignupFacade } from "../../../meta/infrastructure/meta-signup-facade.ts";

declare const process: { env: Record<string, string | undefined> };

const repo = new SupabaseMessageRepo();
const receiveHandler = new ReceiveMessageHandler(repo);
const signupLookup = new SupabaseMetaSignupFacade();

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
        // CRIT-S2-C: Meta espera text/plain con status 200
        const httpRes: HttpResponse = { status: 200, contentType: "text/plain", body: challenge };
        return httpRes;
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

      // CRIT-S2-B: resolver tenantId real desde phone_number_id (NO usar phoneNumberId como tenant)
      for (const msg of parsed.value) {
        const signup = await signupLookup.buscarPorPhoneNumberId(msg.phoneNumberId);
        if (!signup.ok || !signup.value) {
          // phoneNumberId desconocido: log + ignorar (no filtrar tenant)
          continue;
        }
        await receiveHandler.ejecutar(signup.value.tenantId, msg);
      }
      return { ok: true };
    },
  };
}