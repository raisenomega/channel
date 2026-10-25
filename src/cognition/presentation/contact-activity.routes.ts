/**
 * HUB by Raisen — B8: GET /tenants/:id/contacts/:cid/activity -> lo que el agente ha hecho/decidido sobre un
 * contacto (sus agent_drafts: borradores, respuestas, cierres, con fecha/estado/razon). JWT + tenant del
 * claim == path. Para la ficha del contacto (timeline). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import { draftsPorContacto, contactMeta } from "../infrastructure/contact-activity.query.ts";

const cp = (ctx: RequestContext): string[] => ctx.path.split("/");

export function rutaContactActivity(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/contacts/:cid/activity",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, cp(ctx)[2] ?? ""); if (!auth.ok) return auth.error;
      const cid = ctx.params["cid"] ?? cp(ctx)[4] ?? "";
      const tt = String(tid(auth.value.tenantId));
      const [activity, meta] = await Promise.all([draftsPorContacto(cid, tt), contactMeta(cid, tt)]);
      return { ok: true, activity, notes: meta.notes, temperature: meta.temperature };
    },
  };
}
