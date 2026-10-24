/**
 * HUB by Raisen — S7b: decision PURA de auto-envio + su RAZON. dentroDeHorario respeta la TZ del tenant
 * (antes comparaba contra UTC del server -> bloqueaba las tardes AST). Cualquier duda -> no envia. C4 <=75.
 */
import type { AgentsConfig, AgentsHours } from "./agents-config.ts";

const DIA: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function dentroDeHorario(hours: AgentsHours | null, now: Date, timeZone?: string): boolean {
  if (!hours) return true; // 24/7
  const p = new Intl.DateTimeFormat("en-US", { timeZone: timeZone || "UTC", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const val = (t: string): string => p.find((x) => x.type === t)?.value ?? "";
  const day = DIA[val("weekday")] ?? 0; // 0=Lun .. 6=Dom, en la TZ del tenant
  if (!hours.days.includes(day)) return false;
  const hm = `${val("hour")}:${val("minute")}`;
  return hm >= hours.start && hm <= hours.end;
}

export interface AutoSendSignals {
  readonly opportunity: boolean;
  readonly complaint: boolean;
  readonly newContact: boolean;
  readonly confidence: number;
  readonly channel: string;
  readonly sentToday: number;
}

export function razonAutoEnvio(mode: string, c: AgentsConfig, s: AutoSendSignals, now: Date, timeZone?: string): { send: boolean; reason: string } {
  if (mode !== "autonomous") return { send: false, reason: `modo ${mode}` };
  if (!c.can.reply) return { send: false, reason: "sin firma de responder" };
  if (s.opportunity && c.review.opportunities) return { send: false, reason: "oportunidad: a tu revision" };
  if (s.complaint && c.review.complaints) return { send: false, reason: "queja: a tu revision" };
  if (s.newContact && c.review.newContacts) return { send: false, reason: "contacto nuevo: a tu revision" };
  if (s.confidence < c.confidence) return { send: false, reason: `confianza ${s.confidence} < ${c.confidence}` };
  if (!c.channels.includes(s.channel)) return { send: false, reason: "canal no autorizado" };
  if (s.sentToday >= c.dailyCap) return { send: false, reason: "tope diario alcanzado" };
  if (!dentroDeHorario(c.hours, now, timeZone)) return { send: false, reason: "fuera de horario" };
  return { send: true, reason: "auto-enviado" };
}

export function debeAutoEnviar(mode: string, c: AgentsConfig, s: AutoSendSignals, now: Date, timeZone?: string): boolean {
  return razonAutoEnvio(mode, c, s, now, timeZone).send;
}
