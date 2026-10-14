/**
 * HUB by Raisen — Helpers y ticks para las burbujas de chat.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export interface ChatMsg {
  id: string;
  senderType: string; // "contact" | "agent" | "system"
  content: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  contactName?: string;
}

export function dayLabel(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t(lang, "chat.hoy");
  if (d.toDateString() === yesterday.toDateString()) return t(lang, "chat.ayer");
  return d.toLocaleDateString(lang === "es" ? "es" : "en", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function timeLabel(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(lang === "es" ? "es" : "en", { hour: "2-digit", minute: "2-digit" });
}

export function Ticks({ status }: { status: ChatMsg["status"] }) {
  const cls = `chat-tick chat-tick--${status ?? "sent"}`;
  const two = status === "delivered" || status === "read";
  return (
    <span className={cls} title={String(status)}>
      <svg viewBox="0 0 16 10" width="14" height="9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 5l3.5 3.5L11 1.5" />
        {two ? <path d="M6 7l3 3L15 4" /> : null}
      </svg>
    </span>
  );
}