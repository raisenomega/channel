/**
 * HUB by Raisen — Poner una cita en cola de envio: guarda los canales (send_channels) y el
 * mensaje editable (send_message) que recibira el cliente. El disparo real por WA/IG/FB lo hara
 * el backend al volver Railway. Tambien compone el mensaje por defecto desde la cita. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Idioma } from "@/lib/i18n";
import type { RowAppointment } from "./agenda-types";

export async function queueSend(id: string, channels: string[], message: string): Promise<{ ok: boolean }> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false };
  try {
    const res = await fetch(`${base}/appointments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ send_channels: channels, send_message: message.trim() || null }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export function defaultSendMessage(lang: Idioma, appt: RowAppointment, name: string): string {
  const es = lang === "es";
  const loc = es ? "es-ES" : "en-US";
  const d = new Date(appt.scheduled_at);
  const fecha = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }).format(d);
  const hora = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }).format(d);
  const quien = name || (es ? "cliente" : "there");
  const base = es
    ? `Hola ${quien}, te confirmamos tu cita: ${appt.title} — ${fecha} a las ${hora}.`
    : `Hi ${quien}, your appointment is confirmed: ${appt.title} — ${fecha} at ${hora}.`;
  const rz = appt.reason ? ` ${appt.reason}.` : "";
  const vid = appt.meeting_url ? (es ? ` Únete aquí: ${appt.meeting_url}` : ` Join here: ${appt.meeting_url}`) : "";
  return base + rz + vid;
}
