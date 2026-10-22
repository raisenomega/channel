/**
 * HUB by Raisen — Citas de la Agenda en un rango (RLS auto-filtra por tenant) + agrupado por dia.
 */
import { restGet, enc } from "./agenda-rest";
import { dayKey } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

const COLS = [
  "id", "contact_id", "conversation_id", "agent_id", "quote_id", "order_id",
  "title", "description", "scheduled_at", "ends_at", "status", "channel", "created_by_type", "location",
  "reason", "pre_notes", "meeting_type", "meeting_url", "reminders", "media", "created_by_user_id",
  "created_by_name", "attachment_id", "send_channels", "sent_at", "created_at",
].join(",");

export function fetchAppointments(fromISO: string, toISO: string): Promise<RowAppointment[]> {
  const q = `appointments?select=${enc(COLS)}&scheduled_at=gte.${enc(fromISO)}&scheduled_at=lt.${enc(toISO)}&order=scheduled_at.asc&limit=500`;
  return restGet<RowAppointment>(q);
}

/** Todas las citas del tenant (para la lista "Agendados" del CRM), mas recientes primero. */
export function fetchAllAppointments(): Promise<RowAppointment[]> {
  const q = `appointments?select=${enc(COLS)}&order=scheduled_at.desc&limit=500`;
  return restGet<RowAppointment>(q);
}

/** Agrupa las citas por dia local (YYYY-MM-DD) para las vistas mes/semana/dia. */
export function groupByDay(items: RowAppointment[]): Map<string, RowAppointment[]> {
  const map = new Map<string, RowAppointment[]>();
  for (const a of items) {
    const k = dayKey(new Date(a.scheduled_at));
    const arr = map.get(k);
    if (arr) arr.push(a); else map.set(k, [a]);
  }
  return map;
}
