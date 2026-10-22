/**
 * HUB by Raisen — Envio generico a un contacto por los canales elegidos (motor de CITA, reutilizable
 * para cotizacion/factura/orden). Por cada canal busca el hilo del contacto y manda el texto via
 * POST /api/message/send (Zernio). Reporta a cuales llego. C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

async function convFor(contactId: string, channel: string): Promise<string | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const q = `conversations?contact_id=eq.${encodeURIComponent(contactId)}&primary_channel=eq.${encodeURIComponent(channel)}&select=id&order=last_message_at.desc.nullslast&limit=1`;
  try {
    const res = await fetch(`${base}/${q}`, { headers });
    if (!res.ok) return null;
    return ((await res.json()) as { id: string }[])[0]?.id ?? null;
  } catch { return null; }
}

export async function sendToContact(contactId: string, channels: string[], message: string): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  const body = message.trim();
  if (!contactId || !body) return { sent, failed: channels };
  for (const ch of channels) {
    const convId = await convFor(contactId, ch);
    if (!convId) { failed.push(ch); continue; }
    try {
      const res = await apiFetch("/api/message/send", {
        method: "POST",
        body: JSON.stringify({ conversationId: convId, contactId, channel: ch, provider: "zernio", content: { type: "text", body }, senderType: "human_agent" }),
      });
      if (res.ok) sent.push(ch); else failed.push(ch);
    } catch {
      failed.push(ch);
    }
  }
  return { sent, failed };
}
