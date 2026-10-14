/**
 * HUB by Raisen — Hilo de chat estilo mensajería nativa.
 * Reutilizable para CUALQUIER canal: burbujas, checkmarks, timestamp,
 * agrupación por día y avatar.
 */
import { useMemo } from "react";
import type { Idioma } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { dayLabel, timeLabel, Ticks, type ChatMsg } from "./chat-bubbles-helpers";

export type { ChatMsg } from "./chat-bubbles-helpers";

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