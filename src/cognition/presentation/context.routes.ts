/**
 * HUB by Raisen — Rutas GET/PUT /tenants/:id/context: contexto del negocio p/ los agentes + % de
 * completitud (verde > 70%). JWT + tenant del claim (patron FORTRESS N, no el path). C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { leerContexto, guardarContexto } from "../infrastructure/context.repo.ts";
import { completeness, type BusinessContext } from "../domain/business-context.ts";

export function rutaContextoGet(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/context",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const c = await leerContexto(auth.value.tenantId);
      return jsonResponse(200, { ok: true, context: c, completeness: completeness(c) });
    },
  };
}

export function rutaContextoPut(): RouteDefinition {
  return {
    method: "PUT", path: "/tenants/:id/context",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const body = (ctx.body ?? {}) as BusinessContext;
      await guardarContexto(auth.value.tenantId, body);
      const c = await leerContexto(auth.value.tenantId);
      return jsonResponse(200, { ok: true, context: c, completeness: completeness(c) });
    },
  };
}
