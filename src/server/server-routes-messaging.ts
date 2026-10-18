/** HUB by Raisen — Rutas HTTP webhook/mensajes. FORTRESS N: receive/send exigen JWT (tenant del claim, nunca del body) + send valida contacto del tenant. */
import type { ServerHandlers } from "./server-routes.ts";
import type { RouteDefinition } from "./server-types.ts";
import { tid, cid, coid, iid } from "./server-types.ts";
import { obj, resultToJson, channelType } from "./server-helpers.ts";
import { requireTenantAuth } from "./auth-helpers.ts";
import { buildContent, validarContactoTenant } from "./messaging-route-helpers.ts";

export function handleWebhook(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/webhook",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      return resultToJson(
        await h.processWebhook.ejecutar({
          provider: (b["provider"] as string) ?? "",
          signature: (b["signature"] as string) ?? "",
          body: (b["body"] as string) ?? "",
          rawPayload: b["rawPayload"],
        }),
      );
    },
  };
}

export function handleReceive(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/message/receive",
    handler: async (ctx) => {
      // N-6: JWT obligatorio; tenant del claim, NUNCA del body. La ingesta por firma de
      // canal vive en POST /api/webhook (handleWebhook).
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = obj(ctx.body);
      return resultToJson(
        await h.receiveMessage.ejecutar({
          tenantId: tid(auth.value.tenantId),
          inboxId: iid(b["inboxId"] as string),
          channel: channelType(b["channel"] as string),
          provider: (b["provider"] as string) ?? "",
          from: (b["from"] as string) ?? "",
          contactId: cid(b["contactId"] as string),
          content: buildContent(b),
        }),
      );
    },
  };
}

export function handleSend(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/message/send",
    handler: async (ctx) => {
      // N-5: JWT obligatorio; tenant del claim + contacto del tenant.
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = obj(ctx.body);
      const contactId = cid(b["contactId"] as string);
      const reject = await validarContactoTenant(h, contactId, tid(auth.value.tenantId));
      if (reject) return reject;
      return resultToJson(
        await h.sendMessage.ejecutar({
          tenantId: tid(auth.value.tenantId),
          conversationId: coid(b["conversationId"] as string),
          contactId,
          channel: channelType(b["channel"] as string),
          provider: (b["provider"] as string) ?? "",
          content: buildContent(b),
          senderType: (b["senderType"] as "human_agent" | "ai_agent" | "system") ?? "system",
        } as Parameters<typeof h.sendMessage.ejecutar>[0]),
      );
    },
  };
}
