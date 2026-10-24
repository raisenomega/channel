/**
 * HUB by Raisen — S7b: decision PURA de auto-envio (modo autonomo). Devuelve true SOLO si TODOS los
 * guardrails del owner pasan. Cualquier duda -> false (va a Borradores). A2 cero imports externos. C4 <=75.
 */
import type { AgentsConfig, AgentsHours } from "./agents-config.ts";

export function dentroDeHorario(hours: AgentsHours | null, now: Date): boolean {
  if (!hours) return true; // 24/7
  const day = (now.getDay() + 6) % 7; // 0=Lun .. 6=Dom
  if (!hours.days.includes(day)) return false;
  const hm = now.toTimeString().slice(0, 5); // "HH:MM"
  return hm >= hours.start && hm <= hours.end;
}

export interface AutoSendSignals {
  readonly opportunity: boolean;
  readonly complaint: boolean;
  readonly newContact: boolean;
  readonly confidence: number;  // 0-10
  readonly channel: string;
  readonly sentToday: number;
}

export function debeAutoEnviar(mode: string, config: AgentsConfig, s: AutoSendSignals, now: Date): boolean {
  if (mode !== "autonomous") return false;        // solo autonomo
  if (!config.can.reply) return false;            // sin firma de auto-responder
  if (s.opportunity && config.review.opportunities) return false; // dinero -> revisas tu
  if (s.complaint && config.review.complaints) return false;      // reputacion -> revisas tu
  if (s.newContact && config.review.newContacts) return false;
  if (s.confidence < config.confidence) return false;             // baja confianza -> borrador
  if (!config.channels.includes(s.channel)) return false;         // canal no autorizado
  if (s.sentToday >= config.dailyCap) return false;               // tope diario
  return dentroDeHorario(config.hours, now);                      // dentro de tu horario
}
