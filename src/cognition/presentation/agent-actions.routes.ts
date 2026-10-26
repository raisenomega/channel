/**
 * HUB by Raisen — Dashboard: GET ultima accion por agente (1 linea honesta). JWT, tenant del claim. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import { ultimasAcciones } from "../infrastructure/agent-actions.query.ts";

const cp = (c: RequestContext) => c.path.split("/");

export function rutaAgentActions(): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/agents/last-actions", handler: async (ctx) => {
    const t = ctx.params["id"] ?? cp(ctx)[2] ?? "";
    const auth = await requireTenantAuth(ctx, t); if (!auth.ok) return auth.error;
    const actions = await ultimasAcciones(String(tid(auth.value.tenantId)));
    return { ok: true, actions };
  } };
}
