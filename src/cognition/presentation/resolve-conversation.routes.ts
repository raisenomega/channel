/**
 * HUB by Raisen — Ruta HTTP: POST /api/conversation/resolve. JWT obligatorio (tenant del claim,
 * nunca del body). Resuelve/reabre via service-role (evita el RLS del frontend). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { resolverConversacion, reabrirConversacion, listarResueltos } from "../infrastructure/conversation-resolve.repo.ts";
import { listarHistorial } from "../infrastructure/historial-resueltos.query.ts";

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

export function rutaHistorialResueltos(): RouteDefinition {
  return {
    method: "GET", path: "/api/conversation/resueltos/historial",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const q = new URL(ctx.path, "http://localhost").searchParams;
      const page = parseInt(q.get("page") ?? "0", 10) || 0;
      const size = Math.min(50, Math.max(1, parseInt(q.get("size") ?? "18", 10) || 18));
      const { rows, total } = await listarHistorial(String(auth.value.tenantId), page, size);
      return jsonResponse(200, { ok: true, rows, total, page, pageSize: size });
    },
  };
}

