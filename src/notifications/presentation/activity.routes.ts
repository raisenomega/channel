/**
 * HUB by Raisen — Rutas HTTP de actividad. GET /tenants/:id/activity/recent (ultimos 5 + alertas
 * pendientes) y /tenants/:id/activity/all (lista completa). JWT obligatorio + tenant del path == claim
 * (Compuerta #17). Excluye consulta_msg (ruido del hilo). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth } from "../../server/auth-helpers.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { contarPendientes } from "../infrastructure/alertas-pendientes.repo.ts";

function mapear(data: unknown): Array<Record<string, unknown>> {
  return ((data ?? []) as Array<{ id: string; event_type: string; label: string; created_at: string; metadata: Record<string, unknown> | null }>).map((r) => {
    const m = r.metadata ?? {};
    return { id: r.id, type: r.event_type, label: r.label, timestamp: r.created_at, conversationId: (m.conversationId as string) ?? null, consultaId: (m.consultaId as string) ?? null, agentSlug: (m.agentSlug as string) ?? null };
  });
}

type Fila = { id: string; event_type: string; label: string; created_at: string; metadata: { consultaId?: string; conversationId?: string } | null };

// La tarjeta muestra pendientes + feed, NUNCA los resueltos: saca las filas 'resolved' y las
// consulta/escalada que ya tienen un resolved que las cierra (mismo criterio que contarPendientes).
async function leer(tenantId: string, limit: number): Promise<Array<Record<string, unknown>>> {
  const { data } = await supabase.from("activity_log").select("id, event_type, label, created_at, metadata").eq("tenant_id", tenantId).neq("event_type", "consulta_msg").order("created_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as Fila[];
  const rCons = new Set<string>(); const rConv = new Set<string>();
  for (const r of rows) if (r.event_type === "resolved") { const m = r.metadata ?? {}; if (m.consultaId) rCons.add(m.consultaId); if (m.conversationId) rConv.add(m.conversationId); }
  const visibles = rows.filter((r) => {
    if (r.event_type === "resolved") return false; // resueltos viven en Tickets Resueltos, no en la tarjeta
    const m = r.metadata ?? {};
    if (r.event_type === "consulta" && m.consultaId && rCons.has(m.consultaId)) return false; // consulta ya atendida
    if (r.event_type === "escalation" && m.conversationId && rConv.has(m.conversationId)) return false; // escalada ya atendida
    return true;
  });
  return mapear(visibles.slice(0, limit));
}

export function rutaRecentActivity(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/activity/recent",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, ctx.params["id"] ?? "");
      if (!auth.ok) return auth.error;
      const tid = String(auth.value.tenantId);
      return { ok: true, events: await leer(tid, 5), alertas: await contarPendientes(tid) };
    },
  };
}

export function rutaAllActivity(): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/activity/all",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, ctx.params["id"] ?? "");
      if (!auth.ok) return auth.error;
      return { ok: true, events: await leer(String(auth.value.tenantId), 100) };
    },
  };
}
