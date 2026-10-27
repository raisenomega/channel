/**
 * HUB by Raisen — Envio de mensaje saliente del inbox por el endpoint REAL (POST /api/message/send,
 * senderType human_agent): valida, persiste y entrega por Zernio. Resuelve contactId + canal de la
 * conversacion. Reemplaza el POST directo a PostgREST que fallaba (payload invalido). C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { enc } from "./conversation-format";

export async function enviarMensajeConversacion(conversationId: string, text: string): Promise<boolean> {
  const body = text.trim();
  if (!body) return false;
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return false;
  try {
    const url = `${base}/conversations?id=eq.${enc(conversationId)}&select=contact_id,primary_channel&limit=1`;
    const r = await fetch(url, { headers });
    if (!r.ok) return false;
    const rows = (await r.json()) as Array<{ contact_id: string | null; primary_channel: string | null }>;
    const contactId = rows[0]?.contact_id;
    const channel = rows[0]?.primary_channel;
    if (!contactId || !channel) return false;
    const res = await apiFetch("/api/message/send", {
      method: "POST",
      body: JSON.stringify({ conversationId, contactId, channel, provider: "zernio", content: { type: "text", body }, senderType: "human_agent" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
