/**
 * HUB by Raisen — Tipos del cliente SLA.
 */

export type SlaError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: SlaError };

export interface RawSla {
  id: string;
  channel: string;
  max_response_minutes: number;
  enabled: boolean;
  created_at: string;
}

export interface RawHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  enabled: boolean;
}

export interface SlaPolicyItem {
  id: string;
  channel: string;
  maxResponseMinutes: number;
  enabled: boolean;
}

export interface BusinessHoursItem {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  enabled: boolean;
}