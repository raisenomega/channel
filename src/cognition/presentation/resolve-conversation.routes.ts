/**
 * HUB by Raisen — Ruta HTTP: POST /api/conversation/resolve. JWT obligatorio (tenant del claim,
 * nunca del body). Resuelve/reabre via service-role (evita el RLS del frontend). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { resolverConversacion, reabrirConversacion, listarResueltos } from "../infrastructure/conversation-resolve.repo.ts";
import { leerConsulta, resolverConsulta } from "../infrastructure/agent-consulta.repo.ts";

export function rutaResolverConversacion(): RouteDefinition {
  return {
    method: "POST", path: "/api/conversation/resolve",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = (ctx.body ?? {}) as { conversationId?: string; status?: string; atendio?: string; nota?: string };
      const cid = String(b.conversationId ?? "");
      if (!cid) return jsonResponse(400, { ok: false, error: { kind: "conversacion_vacia" } });
      const t = String(auth.value.tenantId);
      const ok = b.status === "open"
        ? await reabrirConversacion(t, cid)
        : await resolverConversacion(t, cid, String(b.atendio ?? ""), String(b.nota ?? ""), String(auth.value.userId ?? ""));
      return jsonResponse(ok ? 200 : 400, { ok });
    },
  };
}

export function rutaListarResueltos(): RouteDefinition {
  return {
    method: "GET", path: "/api/conversation/resueltos",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const rows = await listarResueltos(String(auth.value.tenantId));
      return jsonResponse(200, { ok: true, rows });
    },
  };
}

export function rutaLeerConsulta(): RouteDefinition {
  return {
    method: "GET", path: "/api/agent-consulta/:consultaId",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const thread = await leerConsulta(String(auth.value.tenantId), String(ctx.params["consultaId"] ?? ""));
      return jsonResponse(200, { ok: true, thread });
    },
  };
}

export function rutaResolverConsulta(): RouteDefinition {
  return {
    method: "POST", path: "/api/agent-consulta/resolve",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = (ctx.body ?? {}) as { consultaId?: string; agentSlug?: string; pregunta?: string; respuesta?: string; atendio?: string };
      const ok = await resolverConsulta(String(auth.value.tenantId), String(b.consultaId ?? ""), String(b.agentSlug ?? ""), String(b.pregunta ?? ""), String(b.respuesta ?? ""), String(b.atendio ?? ""), String(auth.value.userId ?? ""));
      return jsonResponse(ok ? 200 : 400, { ok });
    },
  };
}
