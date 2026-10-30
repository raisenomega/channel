/**
 * HUB by Raisen — Escribe una fila en activity_log (migr 040) cuando el agente intento ESCALAR a
 * humano, para que el dueno la vea en "Actividad Reciente". Fire-and-forget, fail-safe: NUNCA bloquea.
 * PR1 anti-rafaga: si ya hay una escalada/consulta ABIERTA o reciente del MISMO tema en la conversacion,
 * se ANEXA (bump) en vez de crear otra fila. Kill-switch ESCALADA_DEDUP=off para rollback. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { cerebroIngest } from "../../integrations/infrastructure/cerebro-client.ts";
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import { buscarEscaladaDuplicada, knowledgeCubre } from "./escalacion-dedup.query.ts";

export interface EscalacionResultado { created: boolean; deduped: boolean; cubierto: boolean; consultaId: string }

function dedupOn(): boolean { return (getEnv("ESCALADA_DEDUP") ?? "on").toLowerCase() !== "off"; }
function skipOn(): boolean { return (getEnv("ESCALADA_SKIP_SI_RESUELTO") ?? "on").toLowerCase() !== "off"; }
function ventanaMin(): number { const n = parseInt(getEnv("ESCALADA_DEDUP_WINDOW_MIN") ?? "30", 10); return Number.isFinite(n) && n > 0 ? n : 30; }

export async function registrarEscalacion(
  tenantId: string,
  conversationId: string | null,
  tipo: "escalar" | "consulta",
  detalle: string,
  agentSlug = "",
  consultaId = "",
): Promise<EscalacionResultado> {
  const esConsulta = tipo === "consulta";
  const label = (esConsulta ? ("Consulta de " + (agentSlug || "agente") + ": ") : "Escalacion a humano: ") + detalle;
  // PR4 consultar-antes-de-preguntar: si una DUDA de negocio ya esta cubierta por knowledge aprendido, no re-pregunta.
  if (esConsulta && skipOn() && conversationId && await knowledgeCubre(tenantId, detalle)) {
    return { created: false, deduped: false, cubierto: true, consultaId: "" };
  }
  // Anti-rafaga: anexar a un hilo abierto/reciente del mismo tema en vez de crear otra fila (ni otra alerta).
  if (dedupOn() && conversationId) {
    const dup = await buscarEscaladaDuplicada(tenantId, conversationId, detalle, ventanaMin());
    if (dup) { await bumpReincidencia(tenantId, dup.consultaId, dup.metadata, detalle); return { created: false, deduped: true, cubierto: false, consultaId: dup.consultaId }; }
  }
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
  return { created: true, deduped: false, cubierto: false, consultaId: cid };
}

// Anexa la reincidencia al hilo abierto: incrementa contador + guarda el ultimo detalle. Sin fila ni alerta nueva.
async function bumpReincidencia(tenantId: string, consultaId: string, metadata: Record<string, unknown>, detalle: string): Promise<void> {
  try {
    const prev = Number((metadata["reincidencias"] as number) ?? 0);
    const meta = { ...metadata, reincidencias: prev + 1, ultimoDetalle: detalle.slice(0, 300), ultimaReincidencia: new Date().toISOString() };
    await supabase.from("activity_log").update({ metadata: meta }).eq("tenant_id", tenantId).in("event_type", ["consulta", "escalation"]).eq("metadata->>consultaId", consultaId);
  } catch {
    /* fail-safe */
  }
}
