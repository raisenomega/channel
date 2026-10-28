/**
 * HUB by Raisen — Estado del ticket de la conversacion. Va por el endpoint REAL del backend
 * (POST /api/conversation/resolve, service-role): [Solucionado] -> resolved + record (quien atendio +
 * fecha) + la respuesta como agent_knowledge; [Mantener abierto] -> open. Evita el RLS del frontend.
 * C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";

export async function cambiarEstadoTicket(conversationId: string, status: "resolved" | "open", atendio = "", nota = ""): Promise<boolean> {
  try {
    const res = await apiFetch("/api/conversation/resolve", {
      method: "POST",
      body: JSON.stringify({ conversationId, status, atendio, nota }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
