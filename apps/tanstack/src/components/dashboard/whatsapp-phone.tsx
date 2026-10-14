/**
 * HUB by Raisen — Mockup Samsung S25 Ultra con app WhatsApp real.
 * Barrera de exportaciones: los submódulos viven bajo components/dashboard/whatsapp
 * (C4 ≤75 líneas por archivo).
 */
import type { WaChat } from "./whatsapp/wa-types";
import { colorFor, timeLabel } from "./whatsapp/wa-types";

export type { WaChat, WaMsg, WaContact } from "./whatsapp/wa-types";
export { samsungWhatsApp } from "./whatsapp/wa-phone-inner";
export { WaSidePanel } from "./whatsapp/wa-side-panel";
export { WaContactBar } from "./whatsapp/wa-contact-bar";

export function waChatFrom(conv: {
  conversationId: string; contactName: string; lastMessage: string; lastMessageAt: string; unreadCount: number; channel: string;
}): WaChat {
  return {
    id: conv.conversationId,
    name: conv.contactName === "Contacto" || !conv.contactName ? "Cliente WhatsApp" : conv.contactName,
    preview: conv.lastMessage || "Hola, ¿tienen disponibilidad?",
    time: timeLabel(conv.lastMessageAt),
    unread: conv.unreadCount,
    color: colorFor(conv.contactName),
  };
}