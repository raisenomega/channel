/**
 * HUB by Raisen — Citas de la Agenda en un rango (RLS auto-filtra por tenant).
 */
import { restGet, enc } from "./agenda-rest";
import type { RowAppointment } from "./agenda-types";

const COLS = [
  "id", "contact_id", "conversation_id", "agent_id", "quote_id", "order_id",
  "title", "description", "scheduled_at", "ends_at", "status", "channel", "created_by_type", "location",
].join(",");

export function fetchAppointments(fromISO: string, toISO: string): Promise<RowAppointment[]> {
  const q = `appointments?select=${enc(COLS)}&scheduled_at=gte.${enc(fromISO)}&scheduled_at=lt.${enc(toISO)}&order=scheduled_at.asc&limit=500`;
  return restGet<RowAppointment>(q);
}
