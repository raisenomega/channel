/**
 * HUB by Raisen — P3: GET metricas por agente (respuestas/aprobadas/enviadas/cotizaciones/cierres por
 * persona). JWT, tenant del claim. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import { metricasAgentes } from "../infrastructure/agent-metrics.query.ts";

const cp = (c: RequestContext) => c.path.split("/");

export function rutaAgentMetrics(): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/agents/metrics", handler: async (ctx) => {
    const t = ctx.params["id"] ?? cp(ctx)[2] ?? "";
    const auth = await requireTenantAuth(ctx, t); if (!auth.ok) return auth.error;
    const metrics = await metricasAgentes(String(tid(auth.value.tenantId)));
    return { ok: true, metrics };
  } };
}
