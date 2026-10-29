/**
 * HUB by Raisen — Origen del SALIENTE: distingue el envio del AGENTE IA del envio HUMANO. El eco de Zernio
 * (message.sent) no dice quien lo mando; aqui se compara con los agent_drafts ENVIADOS en la conversacion
 * (ultimos 10 min, por sent_at + mismo texto). Match -> ai_agent; sin match -> human_agent (humano desde HUB
 * o desde su telefono). Degrada seguro: ante duda, humano (nunca marca a un humano como agente). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function esEnvioAgente(convId: string, content: string): Promise<boolean> {
  if (!convId || !content) return false;
  const desde = new Date(Date.now() - 600000).toISOString();
  const { data } = await supabase.from("agent_drafts").select("id")
    .eq("conversation_id", convId).eq("status", "sent").eq("draft_content", content)
    .gte("sent_at", desde).limit(1);
  return Array.isArray(data) && data.length > 0;
}
