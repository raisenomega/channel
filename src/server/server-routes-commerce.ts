/**
 * HUB by Raisen — Rutas HTTP: comercio, cumplimiento e inbox.
 */
import type { QuoteLineItem, CreateByType } from "../commerce/domain/quote.entity.ts";
import type { ConsentSource } from "../compliance/domain/compliance.entity.ts";
import type { ServerHandlers } from "./server-routes.ts";
import type { RouteDefinition } from "./server-types.ts";
import { tid, cid } from "./server-types.ts";
import { obj, resultToJson, complianceChannel } from "./server-helpers.ts";

export function handleQuote(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/quote/create",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      const rawItems = (b["items"] as Array<Record<string, unknown>>) ?? [];
      const items: readonly QuoteLineItem[] = rawItems.map((item) => ({
        description: (item["description"] as string) ?? "",
        quantity: (item["quantity"] as number) ?? 1,
        unitPrice: (item["unitPrice"] as number) ?? 0,
        total: (item["total"] as number) ?? 0,
      }));
      return resultToJson(
        await h.createQuote.ejecutar({
          tenantId: tid(b["tenantId"] as string),
          contactId: cid(b["contactId"] as string),
          items,
          createdByType: (b["createdByType"] as CreateByType) ?? "human",
          mode: (b["mode"] as "lite" | "nucleo_synced") ?? "lite",
        } as Parameters<typeof h.createQuote.ejecutar>[0]),
      );
    },
  };
}

export function handleOptIn(h: ServerHandlers): RouteDefinition {
  return {
    method: "POST", path: "/api/compliance/opt-in",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      return resultToJson(
        await h.optIn.ejecutar(
          cid(b["contactId"] as string),
          tid(b["tenantId"] as string),
          complianceChannel(b["channel"] as string),
          (b["source"] as ConsentSource) ?? "explicit",
        ),
      );
    },
  };
}

export function handleListInbox(h: ServerHandlers): RouteDefinition {
  return {
    method: "GET", path: "/api/inbox/list",
    handler: async (ctx) => {
      const url = new URL(ctx.path, "http://localhost");
      const status = url.searchParams.get("status") ?? "all";
      const limit = parseInt(url.searchParams.get("limit") ?? "50", 10) || 50;
      return resultToJson(
        await h.listInbox.ejecutar({
          tenantId: tid(url.searchParams.get("tenantId")),
          status: status as "all" | "open" | "pending" | "snoozed" | "resolved" | "archived",
          assignedAgentId: null,
          limit,
        }),
      );
    },
  };
}

export function registrarRutas(h: ServerHandlers): RouteDefinition[] {
  return [handleQuote(h), handleOptIn(h), handleListInbox(h)];
}