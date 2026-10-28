/**
 * HUB by Raisen — Bloque 6: lista de mensajes del hilo con scroll infinito + separadores de día.
 * Autoscroll al fondo en nuevo/inicial; al prepender historial (scroll arriba) MANTIENE la posición.
 * Cada burbuja muestra la hora; separador de día (Hoy/Ayer/fecha) entre días. C4 <=75.
 */
import { useRef, useEffect } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { WaMsg } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { MediaBubble } from "@/components/dashboard/media-bubble";

const MEDIA = ["image", "audio", "video", "document", "sticker"]; // tipos que se renderizan via media-proxy (no como texto)

function dayKey(iso: string): string { return new Date(iso).toDateString(); }
function dayLabel(iso: string): string {
  const hoy = new Date(); const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  if (dayKey(iso) === hoy.toDateString()) return "Hoy";
  if (dayKey(iso) === ayer.toDateString()) return "Ayer";
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

export function MsgList({ msgs, meta, lang, onLoadOlder, hasMore, loadingOlder }: {
  msgs: readonly WaMsg[]; meta: ChannelMeta; lang: Idioma;
  onLoadOlder: () => void; hasMore: boolean; loadingOlder: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevH = useRef(0); const anchor = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (anchor.current) { el.scrollTop = el.scrollHeight - prevH.current; anchor.current = false; }
    else { el.scrollTop = el.scrollHeight; } // nuevo/inicial -> al fondo
  }, [msgs]);
  const onScroll = () => {
    const el = ref.current; if (!el || !hasMore || loadingOlder) return;
    if (el.scrollTop < 60) { prevH.current = el.scrollHeight; anchor.current = true; onLoadOlder(); } // cerca del tope -> más viejos
  };
  if (msgs.length === 0) return <div style={{ textAlign: "center", fontSize: 13, color: meta.muted, padding: 18 }}>{t(lang, "canal.sinMsgs")}</div>;
  return (
    <div ref={ref} onScroll={onScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      {loadingOlder ? <div style={{ textAlign: "center", fontSize: 11, color: meta.muted }}>…</div> : null}
      {msgs.map((m, i) => {
        const prev = msgs[i - 1];
        const showDay = !prev || dayKey(prev.time) !== dayKey(m.time);
        return (
          <div key={m.id}>
            {showDay ? <div style={{ textAlign: "center", fontSize: 11, color: meta.muted, margin: "6px 0" }}>{dayLabel(m.time)}</div> : null}
            <div style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "72%", padding: "7px 11px", borderRadius: 10, fontSize: 14, wordBreak: "break-word", background: m.out ? meta.bubbleOut : meta.bubbleIn, color: meta.fg, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", lineHeight: 1.4 }}>
                {MEDIA.includes(m.messageType ?? "") ? <MediaBubble messageId={m.id} kind={m.messageType ?? ""} fallback={m.text} /> : m.text}
                <span style={{ float: "right", margin: "4px 0 -2px 8px", fontSize: 10, color: meta.muted, opacity: 0.85 }}>
                  {new Date(m.time).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
