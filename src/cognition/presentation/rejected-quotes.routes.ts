/**
 * HUB by Raisen — #3/#4: GET cotizaciones del agente RECHAZADAS recientes (<=30 dias) para mostrarlas en
 * Borradores con etiqueta "Cotizacion rechazada". La query barre las >30 dias (auto-borrado) y lista las
 * recientes. JWT, tenant del claim. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import { cotizacionesRechazadasRecientes } from "../infrastructure/rejected-quotes.query.ts";

const cp = (c: RequestContext) => c.path.split("/");

export function rutaCotizacionesRechazadas(): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/drafts/rejected-quotes", handler: async (ctx) => {
    const t = ctx.params["id"] ?? cp(ctx)[2] ?? "";
    const auth = await requireTenantAuth(ctx, t); if (!auth.ok) return auth.error;
    const rows = await cotizacionesRechazadasRecientes(String(tid(auth.value.tenantId)));
    return { ok: true, rejectedQuotes: rows };
  } };
}
