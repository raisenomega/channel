/**
 * HUB by Raisen — Escribe una fila en activity_log (migr 040) cuando el agente intento ESCALAR a
 * humano, para que el dueno la vea en la tarjeta "Actividad Reciente". Fire-and-forget, fail-safe:
 * NUNCA bloquea ni rompe la respuesta al cliente. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { cerebroIngest } from "../../integrations/infrastructure/cerebro-client.ts";

export async function registrarEscalacion(
  tenantId: string,
  conversationId: string | null,
  tipo: "escalar" | "consulta",
  detalle: string,
  agentSlug = "",
  consultaId = "",
): Promise<void> {
  const esConsulta = tipo === "consulta";
  const label = (esConsulta ? ("Consulta de " + (agentSlug || "agente") + ": ") : "Escalacion a humano: ") + detalle;
  const cid = consultaId || crypto.randomUUID(); // consulta Y escalada tienen hilo de AGENTE (lo que respondes NO va al cliente)
  try {
    await supabase.from("activity_log").insert({
      tenant_id: tenantId,
      event_type: esConsulta ? "consulta" : "escalation",
      label: label.slice(0, 160),
      metadata: {
        ...(conversationId ? { conversationId } : {}), tipo,
        ...(agentSlug ? { agentSlug } : {}),
        consultaId: cid, pregunta: detalle,
      },
    });
    // CEREBRO: ademas de HUB (activity_log), guarda en la memoria compartida (identidad de negocio). Nada se pierde.
    cerebroIngest({ event: esConsulta ? "agent.consulta" : "agent.escalation", sourcePlatform: "hub", tenantId, occurredAt: new Date().toISOString(), identity: { idType: "local_id", idValue: tenantId }, payload: { tipo, detalle, agente: agentSlug, conversationId: conversationId ?? "" } });
  } catch {
    /* fail-safe: la alerta al dueno nunca bloquea la respuesta */
  }
}
