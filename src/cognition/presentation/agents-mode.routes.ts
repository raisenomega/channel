/**
 * HUB by Raisen — Modo + config de los agentes por negocio. GET/PUT /tenants/:id/agents/mode (solo el modo)
 * y GET/PUT /tenants/:id/agents/config (modo + config S7: confianza, capacidades, revision, horario, tope,
 * canales). off|supervised|autonomous. JWT + tenant del claim. C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { mergeConfig } from "../domain/agents-config.ts";

const VALID = new Set(["off", "supervised", "autonomous"]);
type Row = { agents_autodraft?: string; agents_config?: unknown };
const leer = async (tid: string): Promise<Row> => {
  const { data } = await supabase.from("tenants").select("agents_autodraft, agents_config").eq("id", tid).maybeSingle();
  return (data ?? {}) as Row;
};
const resp = (r: Row) => ({ ok: true, mode: r.agents_autodraft ?? "off", config: mergeConfig(r.agents_config) });

export function rutaAgentModeGet(): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/agents/mode", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx); if (!auth.ok) return auth.error;
    return jsonResponse(200, resp(await leer(auth.value.tenantId)));
  } };
}
export function rutaAgentModePut(): RouteDefinition {
  return { method: "PUT", path: "/tenants/:id/agents/mode", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx); if (!auth.ok) return auth.error;
    const mode = String(((ctx.body ?? {}) as { mode?: string }).mode ?? "");
    if (!VALID.has(mode)) return jsonResponse(400, { ok: false, error: { kind: "modo_invalido" } });
    await supabase.from("tenants").update({ agents_autodraft: mode }).eq("id", auth.value.tenantId);
    return jsonResponse(200, resp(await leer(auth.value.tenantId)));
  } };
}
export function rutaAgentConfigGet(): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/agents/config", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx); if (!auth.ok) return auth.error;
    return jsonResponse(200, resp(await leer(auth.value.tenantId)));
  } };
}
export function rutaAgentConfigPut(): RouteDefinition {
  return { method: "PUT", path: "/tenants/:id/agents/config", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx); if (!auth.ok) return auth.error;
    const body = (ctx.body ?? {}) as { mode?: string; config?: unknown };
    const upd: Record<string, unknown> = {};
    if (body.mode && VALID.has(body.mode)) upd["agents_autodraft"] = body.mode;
    if (body.config) upd["agents_config"] = mergeConfig(body.config);
    if (Object.keys(upd).length) await supabase.from("tenants").update(upd).eq("id", auth.value.tenantId);
    return jsonResponse(200, resp(await leer(auth.value.tenantId)));
  } };
}
