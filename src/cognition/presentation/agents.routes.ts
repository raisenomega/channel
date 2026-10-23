/**
 * HUB by Raisen — Ruta HTTP: GET /tenants/:id/agents/status.
 * JWT obligatorio + tenant del path debe coincidir con el claim (Compuerta #17).
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const AGENT_NAMES = ["victor","zahra","thao","iris","eco","angel","kelsy"] as const;

export function rutaAgentStatus(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/agents/status",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx); // tenant del claim, no del path
      if (!auth.ok) return auth.error;
      const { data } = await supabase
        .from("agent_drafts")
        .select("agent_name, created_at")
        .eq("tenant_id", auth.value.tenantId)
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
