/**
 * HUB by Raisen — Resolucion del ticket via SERVICE-ROLE (no RLS del frontend). [Solucionado]:
 * conversations.status=resolved + record en activity_log (quien atendio + fecha) + la respuesta como
 * agent_knowledge (el agente la cita). [Mantener abierto]: status=open. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function resolverConversacion(tenantId: string, conversationId: string, atendio: string, nota: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("conversations").update({ status: "resolved" }).eq("id", conversationId).eq("tenant_id", tenantId);
    if (error) return false;
    await supabase.from("activity_log").insert({ tenant_id: tenantId, event_type: "resolved", label: ("Atendio " + (atendio || "-")).slice(0, 160), metadata: { conversationId, resolvedBy: userId, atendio, nota } });
    if (nota) await supabase.from("agent_knowledge").insert({ tenant_id: tenantId, category: "context", knowledge: nota, source: "manual", confidence: 0.8, status: "active" });
    return true;
  } catch {
    return false;
  }
}

export async function reabrirConversacion(tenantId: string, conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("conversations").update({ status: "open" }).eq("id", conversationId).eq("tenant_id", tenantId);
    return !error;
  } catch {
    return false;
  }
}
