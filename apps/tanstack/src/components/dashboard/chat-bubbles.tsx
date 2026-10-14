/**
 * HUB by Raisen — Hilo de chat estilo mensajería nativa (patrón tipo app de messaging).
 * Reutilizable para CUALQUIER canal: burbujas, checkmarks de entrega, timestamp,
 * agrupación por día, avatar. Hereda el "feeling" que el cliente final ya conoce.
 */
import { useMemo } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";

export interface ChatMsg {
  id: string;
  senderType: string; // "contact" | "agent" | "system"
  content: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  contactName?: string;
}

function dayLabel(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t(lang, "chat.hoy");
  if (d.toDateString() === yesterday.toDateString()) return t(lang, "chat.ayer");
  return d.toLocaleDateString(lang === "es" ? "es" : "en", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function timeLabel(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(lang === "es" ? "es" : "en", { hour: "2-digit", minute: "2-digit" });
}

function Ticks({ status }: { status: ChatMsg["status"] }) {
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

export function ChatThread({ messages, lang, accentColor }: {
  messages: readonly ChatMsg[];
  lang: Idioma;
  accentColor?: string;
}) {
  const grouped = useMemo(() => {
    const out: { day: string; msgs: ChatMsg[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.createdAt, lang);
      const last = out[out.length - 1];
      if (last && last.day === day) last.msgs.push(m);
      else out.push({ day, msgs: [m] });
    }
    return out;
  }, [messages, lang]);

  return (
    <div className="chat-messages chat-thread-view">
      {grouped.map((g, gi) => (
        <div key={gi} className="flex w-full flex-col gap-[2px]">
          <div className="chat-day">{g.day}</div>
          {g.msgs.map((m) => {
            const isOut = m.senderType === "contact";
            const status = m.status ?? (isOut ? "read" : "delivered");
            return (
              <div key={m.id} className={"chat-row " + (isOut ? "in" : "out")}>
                {!isOut ? <span className="chat-avatar"><Avatar name={m.contactName ?? "Contacto"} size="xs" /></span> : null}
                <div className="chat-bubble" style={isOut && accentColor ? { background: accentColor } : undefined}>
                  <p>{m.content}</p>
                  <span className="chat-meta">
                    {timeLabel(m.createdAt, lang)}
                    {isOut ? <Ticks status={status} /> : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}