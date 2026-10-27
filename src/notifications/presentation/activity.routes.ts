/**
 * HUB by Raisen — Ruta HTTP: GET /tenants/:id/activity/recent.
 * JWT obligatorio + tenant del path debe coincidir con el claim (Compuerta #17).
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export function rutaRecentActivity(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/activity/recent",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, ctx.params["id"] ?? "");
      if (!auth.ok) return auth.error;
      const { data } = await supabase
        .from("activity_log")
        .select("id, event_type, label, created_at, metadata")
        .eq("tenant_id", auth.value.tenantId)
        .order("created_at", { ascending: false })
        .limit(5);
      const events = (data ?? []).map((r) => ({
        id: r.id as string,
        type: r.event_type as string,
        label: r.label as string,
        timestamp: r.created_at as string,
        conversationId: (r.metadata as { conversationId?: string } | null)?.conversationId ?? null,
      }));
      return { ok: true, events };
    },
  };
}
