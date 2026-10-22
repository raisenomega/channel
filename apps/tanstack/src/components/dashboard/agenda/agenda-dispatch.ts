/**
 * HUB by Raisen — Envio real de la cita: por cada canal marcado busca el hilo del contacto en ese
 * canal y manda el mensaje via POST /api/message/send (Zernio), igual que el inbox. Reporta a
 * cuales llego y cuales no (sin hilo en ese canal o fallo). C4 <=75.
 */
import { apiFetch } from "@/lib/api-client";
import { restGet, enc } from "./agenda-rest";
import type { RowAppointment } from "./agenda-types";

async function convFor(contactId: string, channel: string): Promise<string | null> {
  const rows = await restGet<{ id: string }>(`conversations?contact_id=eq.${enc(contactId)}&primary_channel=eq.${enc(channel)}&select=id&order=last_message_at.desc.nullslast&limit=1`);
  return rows[0]?.id ?? null;
}

export async function sendAppointment(appt: RowAppointment, channels: string[], message: string): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  const contactId = appt.contact_id;
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
