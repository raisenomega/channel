/**
 * HUB by Raisen — Ruta HTTP: GET /tenants/:id/agents/status.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const AGENT_NAMES = ["victor","zahra","thao","iris","eco","angel","kelsy"] as const;

export function rutaAgentStatus(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/agents/status",
    handler: async (ctx: RequestContext) => {
      const tenantId = ctx.params["id"] ?? (ctx.path.split("/")[2] ?? "");
      const { data } = await supabase
        .from("agent_drafts")
        .select("agent_name, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      const lastAction: Record<string, string> = {};
      if (data) {
        for (const row of data) {
          const a = row.agent_name as string;
          if (!lastAction[a]) lastAction[a] = row.created_at as string;
        }
      }
      const agents = AGENT_NAMES.map((n) => ({
        name: n,
        online: !!lastAction[n],
        lastAction: lastAction[n] ?? "",
        timestamp: lastAction[n] ?? "",
      }));
      return { ok: true, agents };
    },
  };
}