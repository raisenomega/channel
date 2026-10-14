/**
 * HUB by Raisen — Tipos de SLA y horarios.
 */

export interface RowSlaPolicy {
  id: string;
  channel: string;
  max_response_minutes: number;
  enabled: boolean;
  created_at: string;
}

export interface RowBusinessHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  enabled: boolean;
}