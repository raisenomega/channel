/**
 * HUB by Raisen — Rutas HTTP del scope AGENTE (consulta). JWT obligatorio (tenant del claim, nunca del
 * body). GET hilo · POST mensaje al hilo · POST resolver (resolved + agent_knowledge). Service-role
 * (evita el RLS del frontend). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { leerConsulta, resolverConsulta, agregarMensaje } from "../infrastructure/agent-consulta.repo.ts";

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

export function rutaMensajeConsulta(): RouteDefinition {
  return {
    method: "POST", path: "/api/agent-consulta/mensaje",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = (ctx.body ?? {}) as { consultaId?: string; texto?: string };
      const ok = await agregarMensaje(String(auth.value.tenantId), String(b.consultaId ?? ""), String(b.texto ?? ""));
      return jsonResponse(ok ? 200 : 400, { ok });
    },
  };
}

export function rutaResolverConsulta(reconectar?: (tenantId: string, consultaId: string) => void): RouteDefinition {
  return {
    method: "POST", path: "/api/agent-consulta/resolve",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const b = (ctx.body ?? {}) as { consultaId?: string; agentSlug?: string; pregunta?: string; respuesta?: string; atendio?: string };
      const ok = await resolverConsulta(String(auth.value.tenantId), String(b.consultaId ?? ""), String(b.agentSlug ?? ""), String(b.pregunta ?? ""), String(b.respuesta ?? ""), String(b.atendio ?? ""), String(auth.value.userId ?? ""));
      if (ok && reconectar) reconectar(String(auth.value.tenantId), String(b.consultaId ?? "")); // D: el agente le responde al cliente (Borrador)
      return jsonResponse(ok ? 200 : 400, { ok });
    },
  };
}
