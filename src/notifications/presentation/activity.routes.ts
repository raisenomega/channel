/**
 * HUB by Raisen — Ruta HTTP: GET /tenants/:id/activity/recent.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export function rutaRecentActivity(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/activity/recent",
    handler: async (ctx: RequestContext) => {
      const tenantId = ctx.params["id"] ?? (ctx.path.split("/")[2] ?? "");
      const { data } = await supabase
        .from("activity_log")
        .select("id, event_type, label, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);
      const events = (data ?? []).map((r) => ({
        id: r.id as string,
        type: r.event_type as string,
        label: r.label as string,
        timestamp: r.created_at as string,
      }));
      return { ok: true, events };
    },
  };
}