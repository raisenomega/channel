/**
 * HUB by Raisen — Utilidades de formato para el hilo del inbox.
 */
import type { Idioma } from "@/lib/i18n";

export function enc(v: string): string { return encodeURIComponent(v); }

export function currency(v: number, mon: string, lang: Idioma): string {
  try {
    return v.toLocaleString(lang === "es" ? "es" : "en", { style: "currency", currency: mon || "USD" });
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

export function dateStr(iso: string, lang: Idioma): string {
  return new Date(iso).toLocaleDateString(lang === "es" ? "es" : "en");
}

export function initial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

export function makeAgentMessage(conversationId: string, content: string) {
  return {
    conversation_id: conversationId,
    sender_type: "agent",
    sender_id: "",
    content,
    message_type: "text",
  };
}