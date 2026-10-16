/**
 * HUB by Raisen — Rutas HTTP: webhook y mensajes.
 */
import type { MessageContent } from "../inbox/domain/message.entity.ts";
import type { ServerHandlers } from "./server-routes.ts";
import type { RouteDefinition } from "./server-types.ts";
import { tid, cid, coid, iid } from "./server-types.ts";
import { obj, resultToJson, channelType, contentType } from "./server-helpers.ts";

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
      const b = obj(ctx.body);
      const content: MessageContent = {
        type: contentType((b["content"] as Record<string, unknown> | undefined)?.["type"] as string | null),
        body: ((b["content"] as Record<string, unknown> | undefined)?.["body"] as string) ?? "",
      };
      return resultToJson(
        await h.receiveMessage.ejecutar({
          tenantId: tid(b["tenantId"] as string),
          inboxId: iid(b["inboxId"] as string),
          channel: channelType(b["channel"] as string),
          provider: (b["provider"] as string) ?? "",
          from: (b["from"] as string) ?? "",
          contactId: cid(b["contactId"] as string),
          content,
        }),
      );
    },
  };
}

export function handleSend(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/message/send",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      const content: MessageContent = {
        type: contentType((b["content"] as Record<string, unknown> | undefined)?.["type"] as string | null),
        body: ((b["content"] as Record<string, unknown> | undefined)?.["body"] as string) ?? "",
      };
      return resultToJson(
        await h.sendMessage.ejecutar({
          tenantId: tid(b["tenantId"] as string),
          conversationId: coid(b["conversationId"] as string),
          contactId: cid(b["contactId"] as string),
          channel: channelType(b["channel"] as string),
          provider: (b["provider"] as string) ?? "",
          content,
          senderType: (b["senderType"] as "human_agent" | "ai_agent" | "system") ?? "system",
        } as Parameters<typeof h.sendMessage.ejecutar>[0]),
      );
    },
  };
}