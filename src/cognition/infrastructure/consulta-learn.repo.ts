/**
 * HUB by Raisen — PR4: el agente APRENDE de verdad al cerrar el lazo. (1) Escribe su confirmacion/seguimiento
 * en el hilo (consulta_agent_msg, AGENTE-ONLY: nunca al cliente). (2) Guarda la REGLA aprendida en
 * agent_knowledge con SUPERSEDE del mismo tema (no apila 6 duplicados) + CEREBRO. Service-role. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { cerebroIngest } from "../../integrations/infrastructure/cerebro-client.ts";
import { mismoTema } from "./escalacion-dedup.query.ts";

export async function escribirMensajeAgente(tenantId: string, consultaId: string, texto: string, satisfecho: boolean): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      tenant_id: tenantId, event_type: "consulta_agent_msg",
      label: (satisfecho ? "Agente: listo para cerrar" : "Agente: pregunta de seguimiento").slice(0, 160),
      metadata: { consultaId, texto, satisfecho, role: "agent" },
    });
  } catch {
    /* fail-safe */
  }
}

export async function aprenderConsulta(tenantId: string, consultaId: string, pregunta: string, aprendizaje: string): Promise<void> {
  if (!aprendizaje) return;
  try {
    const { data } = await supabase.from("agent_knowledge").select("id, knowledge").eq("tenant_id", tenantId).eq("status", "active").limit(60);
    const dup = ((data ?? []) as Array<{ id: string; knowledge: string }>).filter((r) => mismoTema(aprendizaje, r.knowledge, 0.5) || mismoTema(pregunta, r.knowledge, 0.5));
    for (const r of dup) await supabase.from("agent_knowledge").update({ status: "superseded" }).eq("id", r.id); // la regla nueva reemplaza la vieja del mismo tema
    await supabase.from("agent_knowledge").insert({ tenant_id: tenantId, category: "context", knowledge: ((pregunta ? pregunta + " -> " : "") + aprendizaje).slice(0, 1200), source: "agente", confidence: 0.9, status: "active" });
    cerebroIngest({ event: "conversation.resolved", sourcePlatform: "hub", tenantId, occurredAt: new Date().toISOString(), identity: { idType: "local_id", idValue: tenantId }, payload: { consultaId, pregunta, aprendizaje } });
  } catch {
    /* fail-safe */
  }
}
