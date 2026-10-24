/**
 * HUB by Raisen — Modo de los agentes por negocio (tenants.agents_autodraft): GET/PUT /tenants/:id/agents/mode.
 * off = no generan; supervised = generan borrador para aprobar. 'autonomous' (envia solo) llega en S7 con
 * guardrails -> aqui NO se acepta todavia (seguro). JWT + tenant del claim. C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const VALID = new Set(["off", "supervised"]); // 'autonomous' habilitado en S7

export function rutaAgentModeGet(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/agents/mode",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const { data } = await supabase.from("tenants").select("agents_autodraft").eq("id", auth.value.tenantId).maybeSingle();
      return jsonResponse(200, { ok: true, mode: (data as { agents_autodraft?: string } | null)?.agents_autodraft ?? "off" });
    },
  };
}

export function rutaAgentModePut(): RouteDefinition {
  return {
    method: "PUT", path: "/tenants/:id/agents/mode",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const mode = String(((ctx.body ?? {}) as { mode?: string }).mode ?? "");
      if (!VALID.has(mode)) return jsonResponse(400, { ok: false, error: { kind: "modo_invalido" } });
      await supabase.from("tenants").update({ agents_autodraft: mode }).eq("id", auth.value.tenantId);
      return jsonResponse(200, { ok: true, mode });
    },
  };
}
