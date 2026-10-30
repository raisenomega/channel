/**
 * HUB by Raisen — Data del scope AGENTE (consulta). Reusa los endpoints backend (service-role):
 * GET /api/agent-consulta/:id (hilo), POST /api/agent-consulta/mensaje (seguir el hilo), POST
 * /api/agent-consulta/resolve (cierre -> resolved + agent_knowledge). Mapea el hilo a Mensaje[] y al
 * Contact360 del AGENTE para reusar ChatPanel y ContactPanel sin cambios. C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";
import type { Mensaje, Contact360 } from "@/lib/types";

export interface ConsultaAgenteMsg { texto: string; satisfecho: boolean; createdAt: string }
export interface ConsultaThread { consultaId: string; agentSlug: string; pregunta: string; respuestas: { texto: string; createdAt: string }[]; mensajesAgente?: ConsultaAgenteMsg[]; listoParaCerrar?: boolean; resuelta: boolean; createdAt: string; conversationId: string }

export async function fetchConsultaThread(consultaId: string): Promise<ConsultaThread | null> {
  try {
    const res = await apiFetch("/api/agent-consulta/" + encodeURIComponent(consultaId));
    if (!res.ok) return null;
    const data = (await res.json()) as { thread?: ConsultaThread | null };
    return data.thread ?? null;
  } catch {
    return null;
  }
}

export async function agregarMensajeConsulta(consultaId: string, texto: string): Promise<boolean> {
  try {
    const res = await apiFetch("/api/agent-consulta/mensaje", { method: "POST", body: JSON.stringify({ consultaId, texto }) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resolverConsulta(consultaId: string, agentSlug: string, pregunta: string, respuesta: string, atendio: string): Promise<boolean> {
  try {
    const res = await apiFetch("/api/agent-consulta/resolve", { method: "POST", body: JSON.stringify({ consultaId, agentSlug, pregunta, respuesta, atendio }) });
    return res.ok;
  } catch {
    return false;
  }
}

export function consultaAMensajes(thread: ConsultaThread | null): Mensaje[] {
  if (!thread) return [];
  const out: Mensaje[] = [{ id: thread.consultaId + ":q", conversationId: thread.consultaId, senderType: "contact", senderId: null, content: thread.pregunta, messageType: "text", createdAt: thread.createdAt }];
  thread.respuestas.forEach((r, i) => out.push({ id: thread.consultaId + ":a" + i, conversationId: thread.consultaId, senderType: "agent", senderId: null, content: r.texto, messageType: "text", createdAt: r.createdAt }));
  // PR4: la confirmacion/seguimiento del agente (mismo lado que la pregunta); ordenado cronologico con el resto.
  (thread.mensajesAgente ?? []).forEach((m, i) => out.push({ id: thread.consultaId + ":g" + i, conversationId: thread.consultaId, senderType: "contact", senderId: null, content: (m.satisfecho ? "[LISTO PARA CERRAR] " : "") + m.texto, messageType: "text", createdAt: m.createdAt }));
  return out.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export function agentFicha(thread: ConsultaThread | null): Contact360 | null {
  if (!thread) return null;
  return { contactId: thread.agentSlug, displayName: ("Agente " + (thread.agentSlug || "")).trim(), primaryPhone: null, primaryEmail: null, segment: null, ltvUsd: 0, totalOrders: 0, preferredChannel: null, marketingOptIn: false, doNotContact: false, conversaciones: [], cotizaciones: [], ordenes: [], pagos: [] };
}
