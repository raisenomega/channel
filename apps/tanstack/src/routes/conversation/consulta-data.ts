/**
 * HUB by Raisen — Data del scope AGENTE (consulta). Reusa el endpoint backend (service-role):
 * GET /api/agent-consulta/:id (hilo) y POST /api/agent-consulta/resolve (respuesta del dueno ->
 * resolved + agent_knowledge). Mapea el hilo a Mensaje[] y al Contact360 del AGENTE para reusar
 * ChatPanel y ContactPanel sin cambios. C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";
import { readLocalSession } from "@/lib/auth";
import type { Mensaje, Contact360 } from "@/lib/types";

export interface ConsultaThread { consultaId: string; agentSlug: string; pregunta: string; respuesta: string; resuelta: boolean; createdAt: string; conversationId: string }

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

export async function responderConsulta(consultaId: string, agentSlug: string, pregunta: string, respuesta: string): Promise<boolean> {
  try {
    const atendio = readLocalSession()?.user?.email ?? "";
    const res = await apiFetch("/api/agent-consulta/resolve", {
      method: "POST",
      body: JSON.stringify({ consultaId, agentSlug, pregunta, respuesta, atendio }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function consultaAMensajes(thread: ConsultaThread | null): Mensaje[] {
  if (!thread) return [];
  const out: Mensaje[] = [{ id: thread.consultaId + ":q", conversationId: thread.consultaId, senderType: "contact", senderId: null, content: thread.pregunta, messageType: "text", createdAt: thread.createdAt }];
  if (thread.resuelta && thread.respuesta) out.push({ id: thread.consultaId + ":a", conversationId: thread.consultaId, senderType: "agent", senderId: null, content: thread.respuesta, messageType: "text", createdAt: thread.createdAt });
  return out;
}

export function agentFicha(thread: ConsultaThread | null): Contact360 | null {
  if (!thread) return null;
  return { contactId: thread.agentSlug, displayName: ("Agente " + (thread.agentSlug || "")).trim(), primaryPhone: null, primaryEmail: null, segment: null, ltvUsd: 0, totalOrders: 0, preferredChannel: null, marketingOptIn: false, doNotContact: false, conversaciones: [], cotizaciones: [], ordenes: [], pagos: [] };
}
