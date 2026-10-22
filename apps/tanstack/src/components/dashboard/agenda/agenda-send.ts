/**
 * HUB by Raisen — Cola de envio (canales + mensaje editable), mensaje por defecto, y cambio de
 * status para el cierre honesto. Todo PATCH directo a Supabase, RLS por tenant. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Idioma } from "@/lib/i18n";
import type { RowAppointment } from "./agenda-types";

async function patchAppt(id: string, fields: Record<string, unknown>): Promise<{ ok: boolean }> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false };
  try {
    const res = await fetch(`${base}/appointments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(fields),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export function queueSend(id: string, channels: string[], message: string, sent = false): Promise<{ ok: boolean }> {
  const fields: Record<string, unknown> = { send_channels: channels, send_message: message.trim() || null };
  if (sent) fields.sent_at = new Date().toISOString();
  return patchAppt(id, fields);
}

export function setApptStatus(id: string, status: string): Promise<{ ok: boolean }> {
  return patchAppt(id, { status });
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
