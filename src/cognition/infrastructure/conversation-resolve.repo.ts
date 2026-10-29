/**
 * HUB by Raisen — Resolucion del ticket via SERVICE-ROLE (no RLS del frontend). [Solucionado]:
 * conversations.status=resolved + record en activity_log (quien atendio + fecha) + la respuesta como
 * agent_knowledge (el agente la cita). [Mantener abierto]: status=open. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { cerebroIngest } from "../../integrations/infrastructure/cerebro-client.ts";

export async function resolverConversacion(tenantId: string, conversationId: string, atendio: string, nota: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("conversations").update({ status: "resolved" }).eq("id", conversationId).eq("tenant_id", tenantId);
    if (error) return false;
    await supabase.from("activity_log").insert({ tenant_id: tenantId, event_type: "resolved", label: ("Atendio " + (atendio || "-")).slice(0, 160), metadata: { conversationId, resolvedBy: userId, atendio, nota } });
    const aprendido = await aprendizajeCliente(tenantId, conversationId, nota);
    if (aprendido) { await supabase.from("agent_knowledge").insert({ tenant_id: tenantId, category: "context", knowledge: aprendido, source: "manual", confidence: 0.8, status: "active" });
      cerebroIngest({ event: "conversation.resolved", sourcePlatform: "hub", tenantId, occurredAt: new Date().toISOString(), identity: { idType: "local_id", idValue: tenantId }, payload: { conversationId, learned: aprendido } }); } // HUB + cerebro
    return true;
  } catch {
    return false;
  }
}

// Aprende lo que el HUMANO escribio al cliente (sus respuestas en el hilo) + la nota, no solo la nota.
async function aprendizajeCliente(tenantId: string, conversationId: string, nota: string): Promise<string> {
  const { data } = await supabase.from("messages").select("content").eq("tenant_id", tenantId).eq("conversation_id", conversationId).eq("sender_type", "human_agent").order("created_at", { ascending: false }).limit(10);
  const msgs = ((data ?? []) as Array<{ content?: string | null }>).map((x) => String(x.content ?? "")).filter(Boolean).reverse();
  const todo = [...msgs, nota].filter(Boolean).join(" | ");
  return todo ? todo.slice(0, 1200) : "";
}

export async function reabrirConversacion(tenantId: string, conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("conversations").update({ status: "open" }).eq("id", conversationId).eq("tenant_id", tenantId);
    return !error;
  } catch {
    return false;
  }
}

export interface ResueltoRow { conversationId: string; consultaId: string; agentSlug: string; tipo: "cliente" | "consulta"; atendio: string; createdAt: string; label: string }

// Lectura via SERVICE-ROLE: el frontend NO puede leer activity_log (su RLS usa auth.jwt()->>'tenant_id'
// top-level, y el tenant del usuario vive en app_metadata -> NULL). Dedup por conversacion (ultimo resuelto).
export async function listarResueltos(tenantId: string): Promise<ResueltoRow[]> {
  try {
    const { data } = await supabase.from("activity_log").select("label,created_at,metadata").eq("tenant_id", tenantId).eq("event_type", "resolved").order("created_at", { ascending: false }).limit(100);
    const seen = new Set<string>();
    const out: ResueltoRow[] = [];
    for (const x of (data ?? []) as Array<{ label?: string; created_at?: string; metadata?: { conversationId?: string; consultaId?: string; agentSlug?: string; kind?: string; atendio?: string } | null }>) {
      const m = x.metadata ?? {};
      const consultaId = String(m.consultaId ?? "");
      const c = consultaId || String(m.conversationId ?? "");
      if (!c || seen.has(c)) continue;
      seen.add(c);
      out.push({ conversationId: String(m.conversationId ?? ""), consultaId, agentSlug: String(m.agentSlug ?? ""), tipo: m.kind === "consulta" ? "consulta" : "cliente", atendio: String(m.atendio ?? ""), createdAt: String(x.created_at ?? ""), label: String(x.label ?? "") });
    }
    return out;
  } catch {
    return [];
  }
}
