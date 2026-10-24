/**
 * HUB by Raisen — Etiqueta del destinatario del borrador: Red Social + Nombre (+ Telefono en el modal).
 * El dueno necesita saber a quien responde, con nombre y telefono, no un id crudo. C4 <=75.
 */
import type { DraftItem } from "@/hooks/useDraftsPending";

const NETS: Record<string, string> = {
  whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", telegram: "Telegram",
  sms: "SMS", x: "X", linkedin: "LinkedIn", webchat: "Webchat", email: "Email",
};

export function redSocial(ch?: string): string { return (ch && NETS[ch]) || ch || "—"; }

export function paraCorto(d: DraftItem): string {
  return `${redSocial(d.channel)} · ${d.contactName || d.contactLabel || "?"}`;
}

export function paraLargo(d: DraftItem): string {
  const tel = d.contactPhone ? ` · ${d.contactPhone}` : "";
  return `${redSocial(d.channel)} · ${d.contactName || d.contactLabel || "?"}${tel}`;
}
