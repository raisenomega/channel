/**
 * HUB by Raisen — Consulta de AGENTE (scope agente). Reusa activity_log (sin tabla nueva): la pregunta
 * = fila event_type=consulta; cada mensaje del dueno en el hilo = event_type=consulta_msg; el cierre =
 * event_type=resolved (aterriza en Tickets Resueltos) + agent_knowledge (todos los agentes lo citan).
 * SERVICE-ROLE (evita el RLS del frontend). C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { cerebroIngest } from "../../integrations/infrastructure/cerebro-client.ts";

export interface ConsultaRespuesta { texto: string; createdAt: string }
export interface ConsultaThread { consultaId: string; agentSlug: string; pregunta: string; respuestas: ConsultaRespuesta[]; resuelta: boolean; createdAt: string; conversationId: string; tipo: string }

export async function leerConsulta(tenantId: string, consultaId: string): Promise<ConsultaThread | null> {
  try {
    const { data } = await supabase.from("activity_log").select("event_type,created_at,metadata").eq("tenant_id", tenantId).eq("metadata->>consultaId", consultaId).order("created_at", { ascending: true });
    let base: ConsultaThread | null = null;
    for (const x of (data ?? []) as Array<{ event_type?: string; created_at?: string; metadata?: { agentSlug?: string; pregunta?: string; texto?: string; respuesta?: string; conversationId?: string } | null }>) {
      const m = x.metadata ?? {};
      const at = String(x.created_at ?? "");
      if (x.event_type === "consulta" || x.event_type === "escalation") base = { consultaId, agentSlug: String(m.agentSlug ?? ""), pregunta: String(m.pregunta ?? ""), respuestas: [], resuelta: false, createdAt: at, conversationId: String(m.conversationId ?? ""), tipo: x.event_type === "escalation" ? "escalada" : "consulta" };
      else if (x.event_type === "consulta_msg" && base) base.respuestas.push({ texto: String(m.texto ?? ""), createdAt: at });
      else if (x.event_type === "resolved" && base) { if (m.respuesta) base.respuestas.push({ texto: String(m.respuesta), createdAt: at }); base.resuelta = true; }
    }
    return base;
  } catch {
    return null;
  }
}

export async function agregarMensaje(tenantId: string, consultaId: string, texto: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_log").insert({ tenant_id: tenantId, event_type: "consulta_msg", label: "respuesta de consulta", metadata: { consultaId, texto, tipo: "consulta_msg" } });
    return !error;
  } catch {
    return false;
  }
}

export async function resolverConsulta(tenantId: string, consultaId: string, agentSlug: string, pregunta: string, respuesta: string, atendio: string, userId: string): Promise<boolean> {
  try {
    await supabase.from("activity_log").insert({ tenant_id: tenantId, event_type: "resolved", label: ("Consulta de " + (agentSlug || "agente") + " resuelta").slice(0, 160), metadata: { consultaId, kind: "consulta", agentSlug, atendio, respuesta, resolvedBy: userId } });
    const aprendido = await aprendizajeConsulta(tenantId, consultaId, pregunta, respuesta);
    if (aprendido) { await supabase.from("agent_knowledge").insert({ tenant_id: tenantId, category: "context", knowledge: aprendido, source: "manual", confidence: 0.85, status: "active" });
      cerebroIngest({ event: "conversation.resolved", sourcePlatform: "hub", tenantId, occurredAt: new Date().toISOString(), identity: { idType: "local_id", idValue: tenantId }, payload: { consultaId, agentSlug, learned: aprendido } }); } // HUB + cerebro
    return true;
  } catch {
    return false;
  }
}

// Aprende TODO lo escrito en el hilo (los consulta_msg del dueno) + la nota de cierre, no solo la nota.
async function aprendizajeConsulta(tenantId: string, consultaId: string, pregunta: string, nota: string): Promise<string> {
  const { data } = await supabase.from("activity_log").select("metadata").eq("tenant_id", tenantId).eq("event_type", "consulta_msg").eq("metadata->>consultaId", consultaId).order("created_at", { ascending: true }).limit(50);
  const msgs = ((data ?? []) as Array<{ metadata?: { texto?: string } | null }>).map((x) => String(x.metadata?.texto ?? "")).filter(Boolean);
  const respuestas = [...msgs, nota].filter(Boolean).join(" | ");
  return respuestas ? ((pregunta ? pregunta + " -> " : "") + respuestas).slice(0, 1200) : "";
}
