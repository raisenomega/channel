/**
 * HUB by Raisen — Consulta de AGENTE (scope agente). Reusa activity_log: la pregunta vive en la fila
 * event_type=consulta (metadata.consultaId/agentSlug/pregunta); la respuesta del dueno se escribe como
 * event_type=resolved (aterriza en Tickets Resueltos) + agent_knowledge (todos los agentes la citan).
 * SERVICE-ROLE (evita el RLS del frontend). C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface ConsultaThread { consultaId: string; agentSlug: string; pregunta: string; respuesta: string; resuelta: boolean; createdAt: string; conversationId: string }

export async function leerConsulta(tenantId: string, consultaId: string): Promise<ConsultaThread | null> {
  try {
    const { data } = await supabase.from("activity_log").select("event_type,created_at,metadata").eq("tenant_id", tenantId).eq("metadata->>consultaId", consultaId).order("created_at", { ascending: true });
    let base: ConsultaThread | null = null;
    for (const x of (data ?? []) as Array<{ event_type?: string; created_at?: string; metadata?: { agentSlug?: string; pregunta?: string; respuesta?: string; conversationId?: string } | null }>) {
      const m = x.metadata ?? {};
      if (x.event_type === "consulta") base = { consultaId, agentSlug: String(m.agentSlug ?? ""), pregunta: String(m.pregunta ?? ""), respuesta: "", resuelta: false, createdAt: String(x.created_at ?? ""), conversationId: String(m.conversationId ?? "") };
      if (x.event_type === "resolved" && base) { base.respuesta = String(m.respuesta ?? ""); base.resuelta = true; }
    }
    return base;
  } catch {
    return null;
  }
}

export async function resolverConsulta(tenantId: string, consultaId: string, agentSlug: string, pregunta: string, respuesta: string, atendio: string, userId: string): Promise<boolean> {
  try {
    await supabase.from("activity_log").insert({ tenant_id: tenantId, event_type: "resolved", label: ("Consulta de " + (agentSlug || "agente") + " resuelta").slice(0, 160), metadata: { consultaId, kind: "consulta", agentSlug, atendio, respuesta, resolvedBy: userId } });
    if (respuesta) await supabase.from("agent_knowledge").insert({ tenant_id: tenantId, category: "context", knowledge: (pregunta ? pregunta + " -> " : "") + respuesta, source: "manual", confidence: 0.85, status: "active" });
    return true;
  } catch {
    return false;
  }
}
