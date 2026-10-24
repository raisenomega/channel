/**
 * HUB by Raisen — S7b: decision PURA de auto-envio + su RAZON (para ver por que un borrador no se envio).
 * razonAutoEnvio devuelve {send, reason}; debeAutoEnviar = .send. Cualquier duda -> no envia. C4 <=75.
 */
import type { AgentsConfig, AgentsHours } from "./agents-config.ts";

export function dentroDeHorario(hours: AgentsHours | null, now: Date): boolean {
  if (!hours) return true; // 24/7
  const day = (now.getDay() + 6) % 7; // 0=Lun .. 6=Dom
  if (!hours.days.includes(day)) return false;
  const hm = now.toTimeString().slice(0, 5);
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

export function razonAutoEnvio(mode: string, c: AgentsConfig, s: AutoSendSignals, now: Date): { send: boolean; reason: string } {
  if (mode !== "autonomous") return { send: false, reason: `modo ${mode}` };
  if (!c.can.reply) return { send: false, reason: "sin firma de responder" };
  if (s.opportunity && c.review.opportunities) return { send: false, reason: "oportunidad: a tu revision" };
  if (s.complaint && c.review.complaints) return { send: false, reason: "queja: a tu revision" };
  if (s.newContact && c.review.newContacts) return { send: false, reason: "contacto nuevo: a tu revision" };
  if (s.confidence < c.confidence) return { send: false, reason: `confianza ${s.confidence} < ${c.confidence}` };
  if (!c.channels.includes(s.channel)) return { send: false, reason: "canal no autorizado" };
  if (s.sentToday >= c.dailyCap) return { send: false, reason: "tope diario alcanzado" };
  if (!dentroDeHorario(c.hours, now)) return { send: false, reason: "fuera de horario" };
  return { send: true, reason: "auto-enviado" };
}

export function debeAutoEnviar(mode: string, c: AgentsConfig, s: AutoSendSignals, now: Date): boolean {
  return razonAutoEnvio(mode, c, s, now).send;
}
